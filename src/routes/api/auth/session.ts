import { createFileRoute } from "@tanstack/react-router";
import { sessionProfile } from "@/features/auth/server/session-profile.server";
import { createCookieClient } from "@/integrations/supabase/cookie-client.server";

export const Route = createFileRoute("/api/auth/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { client, applyToResponse } = createCookieClient(request);
        const { data, error } = await client.auth.getUser();

        return applyToResponse(
          Response.json(
            { user: error ? null : sessionProfile(data.user) },
            { headers: { "Cache-Control": "no-store" } },
          ),
        );
      },
    },
  },
});
