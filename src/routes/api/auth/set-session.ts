import { clientIp, takeRequestSlot } from "@/infrastructure/http/server/request-limit.server";
import { z } from "zod";
import { readJson, RequestBodyError } from "@/infrastructure/http/server/request-body.server";
import { createFileRoute } from "@tanstack/react-router";
import { createCookieClient } from "@/integrations/supabase/cookie-client.server";

export const Route = createFileRoute("/api/auth/set-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!takeRequestSlot(`auth:set-session:${clientIp(request)}`, 20))
          return Response.json(
            { error: "Too many attempts. Try again later." },
            { status: 429, headers: { "Retry-After": "60" } },
          );
        const tokens = await readJson(request, 16_384).catch((error: RequestBodyError) => error);
        if (tokens instanceof RequestBodyError)
          return Response.json({ error: tokens.message }, { status: tokens.status });
        const parsed = z
          .object({
            access_token: z.string().min(1).max(12_000),
            refresh_token: z.string().min(1).max(2048),
          })
          .safeParse(tokens);
        if (!parsed.success) return Response.json({ error: "Invalid session" }, { status: 400 });

        const { client, applyToResponse } = createCookieClient(request);
        const { error } = await client.auth.setSession(parsed.data);
        if (error) {
          return Response.json({ error: "Invalid session" }, { status: 401 });
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
