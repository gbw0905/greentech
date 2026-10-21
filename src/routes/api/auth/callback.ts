import { createFileRoute } from "@tanstack/react-router";
import { createCookieClient } from "@/integrations/supabase/cookie-client.server";

export const Route = createFileRoute("/api/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const origin = url.origin;

        if (!code) {
          return Response.redirect(`${origin}/auth?error=missing_code`, 302);
        }

        const { client, applyToResponse } = createCookieClient(request);
        const { error } = await client.auth.exchangeCodeForSession(code);

        if (error) {
          return applyToResponse(
            Response.redirect(`${origin}/auth?error=${encodeURIComponent(error.message)}`, 302),
          );
        }

        return applyToResponse(Response.redirect(origin, 302));
      },
    },
  },
});
