import { readForm, RequestBodyError } from "@/infrastructure/http/server/request-body.server";
import { assertAiQuota } from "@/infrastructure/ai/quota.server";

export async function handleDocumentAnalysis(request: Request): Promise<Response> {
  try {
    const { userIdFromRequest } = await import("@/features/auth/server/user-from-request.server");
    const userId = await userIdFromRequest(request);
    if (!userId) {
      return Response.json({ error: "Sign in to analyze documents." }, { status: 401 });
    }

    assertAiQuota(`document:${userId}`, 4);
    const form = await readForm(request, 15 * 1024 * 1024 + 64 * 1024);
    const file = form.get("file");
    const query = form.get("query");

    if (!(file instanceof File)) {
      return Response.json({ error: "Choose a document to analyze." }, { status: 400 });
    }
    if (typeof query !== "string" || query.length > 2000) {
      return Response.json({ error: "Enter keywords or a topic." }, { status: 400 });
    }

    const { analyzeDocument } = await import("@/features/documents/server/analyze-document.server");
    const result = await analyzeDocument(file, query, userId);

    // Persist the analysis and the original file for the user's history
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const ext = file.name.toLowerCase().split(".").pop() ?? "bin";
      const analysisId = crypto.randomUUID();
      const storagePath = `${userId}/${analysisId}.${ext}`;

      // Upload the original file to the "doc" bucket
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await supabaseAdmin.storage
        .from("doc")
        .upload(storagePath, fileBuffer, {
          contentType: "application/octet-stream",
          upsert: false,
        });
      if (uploadError) console.error("failed to upload document file", uploadError);

      const { error: insertError } = await supabaseAdmin.from("document_analyses").insert({
        id: analysisId,
        user_id: userId,
        file_name: result.fileName,
        file_type: result.fileType,
        keywords: result.keywordsUsed,
        analysis: JSON.parse(JSON.stringify(result)),
        file_path: uploadError ? null : storagePath,
      });
      if (insertError) {
        if (!uploadError) await supabaseAdmin.storage.from("doc").remove([storagePath]);
        throw insertError;
      }
    } catch (saveError) {
      console.error("failed to save analysis history", saveError);
    }

    return Response.json(result);
  } catch (error) {
    if (error instanceof RequestBodyError)
      return Response.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : "Document analysis failed.";
    const status = message.startsWith("Too many")
      ? 429
      : message.includes("Gemini request failed")
        ? 502
        : 400;
    console.error("document analysis failed", error);
    const clientMessage =
      status === 429 ||
      /^(Enter |Use no more|Keep each|Unsupported file|The selected file|The file is larger|Select some text)/.test(
        message,
      )
        ? message
        : "Could not process the document. Please try again.";
    return Response.json({ error: clientMessage }, { status });
  }
}
