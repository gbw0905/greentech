import { createFileRoute } from "@tanstack/react-router";
import { createCookieClient } from "@/integrations/supabase/cookie-client.server";

export const Route = createFileRoute("/api/auth/sign-out")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { client, applyToResponse } = createCookieClient(request);
        await client.auth.signOut();
        return applyToResponse(Response.json({ ok: true }));
      },
    },
  },
});
