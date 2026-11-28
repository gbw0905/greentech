import { clientIp, takeRequestSlot } from "@/infrastructure/http/server/request-limit.server";
import { readCredentials } from "@/features/auth/server/credentials.server";
import { RequestBodyError } from "@/infrastructure/http/server/request-body.server";
import { createFileRoute } from "@tanstack/react-router";
import { createCookieClient } from "@/integrations/supabase/cookie-client.server";
import { getPostHogClient } from "@/infrastructure/telemetry/posthog.server";

export const Route = createFileRoute("/api/auth/sign-in")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!takeRequestSlot(`auth:sign-in:${clientIp(request)}`, 20))
          return Response.json(
            { error: "Too many attempts. Try again later." },
            { status: 429, headers: { "Retry-After": "60" } },
          );
        const credentials = await readCredentials(request).catch(
          (error: RequestBodyError) => error,
        );
        if (credentials instanceof RequestBodyError)
          return Response.json({ error: credentials.message }, { status: credentials.status });
        const { email, password } = credentials;

        const { client, applyToResponse } = createCookieClient(request);
        const { data, error } = await client.auth.signInWithPassword({ email, password });

        if (error) {
          if (error.status === 429)
            return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
          return Response.json({ error: "Invalid email or password." }, { status: 401 });
        }

        const posthog = getPostHogClient();
        posthog?.capture({
          distinctId: data.user.id,
          event: "user_signed_in",
          properties: {
            $session_id: request.headers.get("X-PostHog-Session-Id") ?? undefined,
            source: "api",
          },
        });
        await posthog?.flush().catch(() => {});

        return applyToResponse(
          Response.json({
            user: { id: data.user.id, email: data.user.email },
          }),
        );
      },
    },
  },
});
