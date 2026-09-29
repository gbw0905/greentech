import { createServerFn } from "@tanstack/react-start";

// Server-function bridge for the traffic feature. Browser modules may call
// these functions, but privileged dependencies stay inside their handlers.
import { z } from "zod";

export const recordVisitFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as Record<string, unknown>)
  .handler(async ({ data }) => {
    const parsed = z
      .object({
        path: z.string().max(200),
        visitorId: z.string().min(1).max(64),
        referrer: z.string().max(200).optional(),
        utmSource: z.string().max(100).optional(),
      })
      .parse(data);
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const country =
      (getRequestHeader("cf-ipcountry" as never) as string | undefined) ??
      (getRequestHeader("x-vercel-ip-country" as never) as string | undefined) ??
      undefined;
    // A tagged link (utm_source) is the true origin even when the browser
    // strips the referrer (email apps, messaging, privacy mode).
    const source = parsed.utmSource ?? parsed.referrer;
    await supabaseAdmin.rpc("record_visit", {
      _path: parsed.path,
      _visitor_id: parsed.visitorId,
      ...(source ? { _referrer: source.slice(0, 200) } : {}),
      ...(country ? { _country: country } : {}),
    } as never);
    return { ok: true };
  });

export const getTrafficStatsFn = createServerFn({ method: "GET" })
  .validator((input: unknown) => input as Record<string, never>)
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("get_traffic_stats");
    if (error) return null;
    return data;
  });
