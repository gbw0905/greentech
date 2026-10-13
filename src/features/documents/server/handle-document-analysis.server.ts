import { assertAiQuota } from "@/infrastructure/ai/quota.server";

export async function handleDocumentAnalysis(request: Request): Promise<Response> {
  try {
    const { userIdFromRequest } = await import("@/features/auth/server/user-from-request.server");
    const userId = await userIdFromRequest(request);
    if (!userId) {
      return Response.json({ error: "Sign in to analyze documents." }, { status: 401 });
    }

    assertAiQuota(`document:${userId}`, 4);
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
