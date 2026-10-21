import { createFileRoute } from "@tanstack/react-router";
import { createCookieClient } from "@/integrations/supabase/cookie-client.server";

export const Route = createFileRoute("/api/auth/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { client, applyToResponse } = createCookieClient(request);
        const { data, error } = await client.auth.getUser();

        if (error || !data.user) {
          return applyToResponse(Response.json({ user: null }));
        }

        return applyToResponse(
          Response.json({
            user: { id: data.user.id, email: data.user.email },
          }),
        );
      },
    },
  },
});
