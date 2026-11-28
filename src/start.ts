import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "@/shared/errors/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions and browser API writes protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: ({ handlerType, request }) => {
    if (handlerType === "serverFn") return true;
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return false;
    const path = new URL(request.url).pathname;
    return path.startsWith("/api/") && !path.startsWith("/api/public/");
  },
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
