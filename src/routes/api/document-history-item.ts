import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ownedDocumentPath } from "@/features/documents/server/document-storage.server";

export const Route = createFileRoute("/api/document-history-item")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { userIdFromRequest } =
            await import("@/features/auth/server/user-from-request.server");
          const userId = await userIdFromRequest(request);
          if (!userId) {
            return Response.json({ error: "Sign in to view history." }, { status: 401 });
          }
          const url = new URL(request.url);
          const id = url.searchParams.get("id");
          if (!id || !z.uuid().safeParse(id).success) {
            return Response.json({ error: "Invalid analysis id." }, { status: 400 });
          }
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("document_analyses")
            .select("analysis, file_path")
            .eq("id", id)
            .eq("user_id", userId)
            .single();
          if (error || !data) {
            return Response.json({ error: "Analysis not found." }, { status: 404 });
          }
          let fileUrl: string | null = null;
          const path = ownedDocumentPath(data.file_path, userId, id);
          if (path) {
            const { data: signed } = await supabaseAdmin.storage
              .from("doc")
              .createSignedUrl(path, 60 * 15);
            fileUrl = signed?.signedUrl ?? null;
          }
          const analysis = data.analysis as Record<string, unknown>;
          return Response.json({ ...analysis, fileUrl });
        } catch (error) {
          console.error("document history item fetch failed", error);
          return Response.json({ error: "Failed to load analysis." }, { status: 500 });
        }
      },
    },
  },
});
