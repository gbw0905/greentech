import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const visitInput = z.object({
  path: z.string().max(200),
  visitorId: z.string().min(1).max(64),
  referrer: z.string().max(200).optional(),
});

export const recordVisitFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => visitInput.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("record_visit", {
      _path: data.path,
      _visitor_id: data.visitorId,
      ...(data.referrer ? { _referrer: data.referrer } : {}),
    });
    return { ok: true };
  });

export const getTrafficStatsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("get_traffic_stats");
  if (error) return null;
  return data;
});