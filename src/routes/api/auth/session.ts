import { createFileRoute } from "@tanstack/react-router";
import { createCookieClient } from "@/integrations/supabase/cookie-client.server";

export const Route = createFileRoute("/api/auth/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { client, applyToResponse } = createCookieClient(request);
        const { data, error } = await client.auth.getUser();

        if (error || !data.user) {
          return applyToResponse(
            Response.json({ user: null }, { headers: { "Cache-Control": "no-store" } }),
          );
        }

        const meta = data.user.user_metadata ?? {};
        return applyToResponse(
          Response.json(
            {
              user: {
                id: data.user.id,
                email: data.user.email,
                avatar_url: meta["avatar_url"] ?? meta["picture"] ?? null,
                full_name: meta["full_name"] ?? meta["name"] ?? null,
                created_at: data.user.created_at,
              },
            },
            { headers: { "Cache-Control": "no-store" } },
          ),
        );
      },
    },
  },
});
