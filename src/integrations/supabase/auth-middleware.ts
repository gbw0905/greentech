import { createMiddleware } from "@tanstack/react-start";
import { appendResponseHeader, getRequest } from "@tanstack/react-start/server";
import { createCookieClient } from "./cookie-client.server";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    if (!request) throw new Error("Unauthorized: No request available");

    const { client, getResponseCookies } = createCookieClient(request);
    const { data, error } = await client.auth.getUser();
    for (const cookie of getResponseCookies()) appendResponseHeader("set-cookie", cookie);

    if (error || !data.user) {
      throw new Error("Unauthorized: Invalid or expired session");
    }

    return next({
      context: {
        supabase: client,
        userId: data.user.id,
        claims: {
          sub: data.user.id,
          email: data.user.email_confirmed_at ? data.user.email : undefined,
        },
      },
    });
  },
);
