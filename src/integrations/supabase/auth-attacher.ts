import { createMiddleware } from "@tanstack/react-start";

// Cookies are sent automatically by the browser — no need to attach
// Bearer tokens. This middleware is kept as a no-op so start.ts doesn't
// need to change its functionMiddleware registration.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => next(),
);
