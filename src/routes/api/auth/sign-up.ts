import { createFileRoute } from "@tanstack/react-router";
import { createCookieClient } from "@/integrations/supabase/cookie-client.server";
import { getPostHogClient } from "@/infrastructure/telemetry/posthog.server";

export const Route = createFileRoute("/api/auth/sign-up")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { email, password } = (await request.json()) as {
          email?: string;
          password?: string;
        };
        if (!email || !password) {
          return Response.json({ error: "Email and password are required" }, { status: 400 });
        }

        const origin = new URL(request.url).origin;
        const { client, applyToResponse } = createCookieClient(request);
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: origin },
        });

        if (error) {
          return Response.json({ error: error.message }, { status: 400 });
        }

        if (!data.session) {
          return Response.json({ needsConfirmation: true });
        }

        if (data.user?.id) {
          const posthog = getPostHogClient();
          posthog?.capture({
            distinctId: data.user.id,
            event: "user_signed_up",
            properties: {
              $session_id: request.headers.get("X-PostHog-Session-Id") ?? undefined,
              source: "api",
            },
          });
          await posthog?.flush().catch(() => {});
        }

        return applyToResponse(
          Response.json({
            user: { id: data.user?.id, email: data.user?.email },
          }),
        );
      },
    },
  },
});
