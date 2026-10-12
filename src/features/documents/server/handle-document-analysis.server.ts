import { assertAiQuota } from "@/infrastructure/ai/quota.server";

function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

export async function handleDocumentAnalysis(request: Request): Promise<Response> {
  try {
    assertAiQuota(`document:${clientKey(request)}`, 4);
    const form = await request.formData();
    const file = form.get("file");
    const query = form.get("query");

    if (!(file instanceof File)) {
      return Response.json({ error: "Choose a document to analyze." }, { status: 400 });
    }
    if (typeof query !== "string") {
      return Response.json({ error: "Enter keywords or a topic." }, { status: 400 });
    }

    const { analyzeDocument } = await import("@/features/documents/server/analyze-document.server");
    return Response.json(await analyzeDocument(file, query));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Document analysis failed.";
    const status = message.startsWith("Too many")
      ? 429
      : message.includes("Gemini request failed")
        ? 502
        : 400;
    console.error("document analysis failed", error);
    return Response.json({ error: message }, { status });
  }
}
