import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createCookieClient } from "./cookie-client.server";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    if (!request) throw new Error("Unauthorized: No request available");

    const { client } = createCookieClient(request);
    const { data, error } = await client.auth.getUser();

    if (error || !data.user) {
      throw new Error("Unauthorized: Invalid or expired session");
    }

    return next({
      context: {
        supabase: client,
        userId: data.user.id,
        claims: { sub: data.user.id, email: data.user.email },
      },
    });
  },
);
