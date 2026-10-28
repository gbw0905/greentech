import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/document-history")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { userIdFromRequest } = await import(
            "@/features/auth/server/user-from-request.server"
          );
          const userId = await userIdFromRequest(request);
          if (!userId) {
            return Response.json({ error: "Sign in to view history." }, { status: 401 });
          }
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("document_analyses")
            .select("id, file_name, file_type, keywords, created_at, file_path")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50);
          if (error) throw error;
          return Response.json(data ?? []);
        } catch (error) {
          console.error("document history fetch failed", error);
          return Response.json({ error: "Failed to load history." }, { status: 500 });
        }
      },
      DELETE: async ({ request }) => {
        try {
          const { userIdFromRequest } = await import(
            "@/features/auth/server/user-from-request.server"
          );
          const userId = await userIdFromRequest(request);
          if (!userId) {
            return Response.json({ error: "Sign in to manage history." }, { status: 401 });
          }
          const url = new URL(request.url);
          const id = url.searchParams.get("id");
          if (!id) {
            return Response.json({ error: "Missing analysis id." }, { status: 400 });
          }
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          // Fetch the file_path before deleting so we can remove the stored file
          const { data: row } = await supabaseAdmin
            .from("document_analyses")
            .select("file_path")
            .eq("id", id)
            .eq("user_id", userId)
            .single();
          const { error } = await supabaseAdmin
            .from("document_analyses")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);
          if (error) throw error;
          // Clean up the stored file (best-effort)
          if (row?.file_path) {
            await supabaseAdmin.storage.from("doc").remove([row.file_path]).catch(() => {});
          }
          return Response.json({ ok: true });
        } catch (error) {
          console.error("document history delete failed", error);
          return Response.json({ error: "Failed to delete." }, { status: 500 });
        }
      },
    },
  },
});
