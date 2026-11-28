import { AsyncLocalStorage } from "node:async_hooks";

export const requestNonce = new AsyncLocalStorage<string>();

function configuredOrigin(value: string | undefined) {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" ? url.origin : "";
  } catch {
    return "";
  }
}

export function contentSecurityPolicy(nonce?: string) {
  const origins = new Set(
    [
      process.env["SUPABASE_URL"],
      import.meta.env["VITE_SUPABASE_URL"],
      import.meta.env["VITE_PUBLIC_POSTHOG_HOST"],
    ]
      .map(configuredOrigin)
      .filter(Boolean),
  );
  return [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    nonce
      ? `script-src 'self' 'nonce-${nonce}' https://s3.tradingview.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com 'wasm-unsafe-eval'`
      : "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' https: data: blob:",
    `connect-src 'self' ${[...origins].join(" ")} https://us.i.posthog.com https://eu.i.posthog.com https://us-assets.i.posthog.com https://eu-assets.i.posthog.com`,
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://s.tradingview.com https://www.tradingview-widget.com https://www.tradingview.com",
    "worker-src 'self' blob:",
    "media-src 'self' blob:",
  ].join("; ");
}

export function secureResponse(request: Request, response: Response, nonce: string) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (new URL(request.url).protocol === "https:") {
    headers.set("Strict-Transport-Security", "max-age=31536000");
  }

  const path = new URL(request.url).pathname;
  if (/^\/(?:alerts\/(?:confirm|unsubscribe)|api\/auth\/callback)\/?$/.test(path)) {
    headers.set("Referrer-Policy", "no-referrer");
  }
  const html = headers.get("content-type")?.includes("text/html");
  if (html && import.meta.env.PROD) {
    headers.set("Content-Security-Policy", contentSecurityPolicy(nonce));
  }
  if (
    html ||
    (path.startsWith("/api/") && path !== "/api/public/flyer-image") ||
    headers.has("set-cookie")
  ) {
    headers.set("Cache-Control", "private, no-store");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
