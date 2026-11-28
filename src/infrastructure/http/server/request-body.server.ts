export class RequestBodyError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function boundedRequest(request: Request, limit: number) {
  const body = request.body;
  if (!body) throw new RequestBodyError(400, "Request body is required.");
  const tooLarge = new RequestBodyError(413, "Request body is too large.");
  if (Number(request.headers.get("content-length")) > limit) throw tooLarge;
  let size = 0;
  return new Response(
    body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          size += chunk.byteLength;
          if (size > limit) throw tooLarge;
          controller.enqueue(chunk);
        },
      }),
    ),
    { headers: { "content-type": request.headers.get("content-type") ?? "" } },
  );
}

export async function readJson(request: Request, limit: number): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !== "application/json"
  ) {
    throw new RequestBodyError(415, "Expected a JSON request.");
  }
  try {
    return await boundedRequest(request, limit).json();
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError(400, "Invalid JSON.");
  }
}

export async function readForm(request: Request, limit: number) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data;")) {
    throw new RequestBodyError(415, "Expected a file upload.");
  }
  try {
    return await boundedRequest(request, limit).formData();
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError(400, "Invalid file upload.");
  }
}
