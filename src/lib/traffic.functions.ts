import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const recordVisitFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input as Record<string, unknown>)
  .handler(async ({ data }) => {
    const parsed = z
      .object({
        path: z.string().max(200),
        visitorId: z.string().min(1).max(64),
        referrer: z.string().max(200).optional(),
      })
      .parse(data);
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const country =
      (getRequestHeader("cf-ipcountry" as never) as string | undefined) ??
      (getRequestHeader("x-vercel-ip-country" as never) as string | undefined) ??
      undefined;
    await supabaseAdmin.rpc("record_visit", {
      _path: parsed.path,
      _visitor_id: parsed.visitorId,
      ...(parsed.referrer ? { _referrer: parsed.referrer } : {}),
      ...(country ? { _country: country } : {}),
    } as never);
    return { ok: true };
  });

export const getTrafficStatsFn = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => input as Record<string, never>)
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("get_traffic_stats");
    if (error) return null;
    return data;
  });
