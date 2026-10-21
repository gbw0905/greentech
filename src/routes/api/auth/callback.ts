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
          return new Response(null, {
            status: 302,
            headers: { location: `${origin}/auth?error=missing_code` },
          });
        }

        const { client, applyToResponse } = createCookieClient(request);
        const { error } = await client.auth.exchangeCodeForSession(code);

        if (error) {
          return applyToResponse(
            new Response(null, {
              status: 302,
              headers: { location: `${origin}/auth?error=${encodeURIComponent(error.message)}` },
            }),
          );
        }

        return applyToResponse(
          new Response(null, { status: 302, headers: { location: origin } }),
        );
      },
    },
  },
});
