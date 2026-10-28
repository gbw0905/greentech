import { createFileRoute } from "@tanstack/react-router";
import { createCookieClient } from "@/integrations/supabase/cookie-client.server";

export const Route = createFileRoute("/api/auth/sign-out")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { client, applyToResponse } = createCookieClient(request);
        const { error } = await client.auth.signOut();
        if (error) {
          return applyToResponse(Response.json({ error: "Sign out failed" }, { status: 500 }));
        }
        return applyToResponse(Response.json({ ok: true }));
      },
    },
  },
});
