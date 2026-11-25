import { createFileRoute } from "@tanstack/react-router";
import { createCookieClient } from "@/integrations/supabase/cookie-client.server";
import { premiumStatusForEmail } from "@/features/premium/access.server";

export const Route = createFileRoute("/api/civanta-access")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
        try {
          const { client, applyToResponse } = createCookieClient(request);
          const { data, error } = await client.auth.getUser();
          const access =
            !error && data.user
              ? await premiumStatusForEmail(client, data.user.email, request)
              : { premium: false };
          return applyToResponse(
            Response.json(
              { signedIn: !error && Boolean(data.user), premium: access.premium },
              { headers },
            ),
          );
        } catch {
          return Response.json({ signedIn: false, premium: false }, { status: 503, headers });
        }
      },
    },
  },
});
