import { createFileRoute } from "@tanstack/react-router";
import { createCookieClient } from "@/integrations/supabase/cookie-client.server";

export const Route = createFileRoute("/api/auth/sign-in")({
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

        const { client, applyToResponse } = createCookieClient(request);
        const { data, error } = await client.auth.signInWithPassword({ email, password });

        if (error) {
          return Response.json({ error: error.message }, { status: 401 });
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
