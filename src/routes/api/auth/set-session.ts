import { createFileRoute } from "@tanstack/react-router";
import { createCookieClient } from "@/integrations/supabase/cookie-client.server";

export const Route = createFileRoute("/api/auth/set-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { access_token, refresh_token } = (await request.json()) as {
          access_token?: string;
          refresh_token?: string;
        };
        if (!access_token || !refresh_token) {
          return Response.json({ error: "Missing tokens" }, { status: 400 });
        }

        const { client, applyToResponse } = createCookieClient(request);
        const { error } = await client.auth.setSession({ access_token, refresh_token });
        if (error) {
          return Response.json({ error: error.message }, { status: 401 });
        }

        const { data, error: userError } = await client.auth.getUser();
        if (userError || !data.user) {
          return Response.json({ error: "Invalid session" }, { status: 401 });
        }

        return applyToResponse(
          Response.json({ user: { id: data.user.id, email: data.user.email } }),
        );
      },
    },
  },
});
