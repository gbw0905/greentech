import { createServerClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import type { Database } from "./types";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export function createCookieClient(request: Request) {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY");

  const responseCookies: string[] = [];

  const client = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        const header = request.headers.get("cookie") ?? "";
        return parseCookieHeader(header);
      },
      setAll(cookies) {
        for (const { name, value, options } of cookies) {
          responseCookies.push(
            serializeCookieHeader(name, value, {
              ...options,
              ...COOKIE_OPTIONS,
              maxAge: options.maxAge === 0 ? 0 : COOKIE_OPTIONS.maxAge,
            }),
          );
        }
      },
    },
  });

  return {
    client,
    getResponseCookies() {
      return responseCookies;
    },
    applyToResponse(response: Response) {
      const headers = new Headers(response.headers);
      for (const cookie of responseCookies) {
        headers.append("set-cookie", cookie);
      }
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    },
  };
}
