import { createFileRoute } from "@tanstack/react-router";

/** Serves a stored flyer PNG image by day key. Public so email clients can load it. */
export const Route = createFileRoute("/api/public/flyer-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const day = url.searchParams.get("day");
        if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) {
          return new Response("Invalid day parameter", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("flyer_generations")
          .select("image_base64")
          .eq("day_key", day)
          .maybeSingle();

        if (error) {
          return new Response(`Database error: ${error.message}`, { status: 500 });
        }
        if (!data?.image_base64) {
          return new Response("Flyer not found", { status: 404 });
        }

        const buffer = Buffer.from(data.image_base64, "base64");
        return new Response(buffer, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
