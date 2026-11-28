import "./infrastructure/telemetry/ai-observability.server";
import "./infrastructure/telemetry/error-capture";

import { consumeLastCapturedError } from "./infrastructure/telemetry/error-capture";
import {
  logServerEntryInitialized,
  logSsrFallbackRendered,
  logSsrRequestFailed,
} from "./infrastructure/telemetry/posthog-logs.server";
import { renderErrorPage } from "@/shared/errors/error-page";
import { randomBytes } from "node:crypto";
import {
  requestNonce,
  secureResponse,
} from "@/infrastructure/http/server/response-security.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then((m) => {
      logServerEntryInitialized();
      return (m.default ?? m) as ServerEntry;
    });
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  logSsrFallbackRendered();
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const nonce = randomBytes(18).toString("base64");
    try {
      const handler = await getServerEntry();
      const response = await requestNonce.run(nonce, () => handler.fetch(request, env, ctx));
      return secureResponse(request, await normalizeCatastrophicSsrResponse(response), nonce);
    } catch (error) {
      console.error(error);
      logSsrRequestFailed();
      return secureResponse(
        request,
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
        nonce,
      );
    }
  },
};
