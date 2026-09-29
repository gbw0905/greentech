import type { TrafficStats } from "@/features/traffic/contracts";
import { sendTemplateEmail } from "@/infrastructure/email/send-email";

export async function sendDailyTrafficEmail(): Promise<Response> {
  const recipient = process.env["TRAFFIC_DIGEST_EMAIL"];
  if (!recipient) {
    return Response.json({ error: "TRAFFIC_DIGEST_EMAIL is not configured" }, { status: 500 });
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("get_traffic_stats");
  if (error) {
    console.error("daily-traffic-email: stats failed", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const stats = (data ?? {}) as Partial<TrafficStats>;
  const now = new Date();
  const dayKey = now.toISOString().slice(0, 10);

  const result = await sendTemplateEmail("daily-traffic", recipient, {
    templateData: {
      dateLabel: now.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      viewsToday: stats.views_today ?? 0,
      uniqueVisitors: stats.unique_visitors ?? 0,
      totalViews: stats.total_views ?? 0,
      views7d: stats.views_7d ?? 0,
      liveNow: stats.live_now ?? 0,
      topPaths: stats.top_paths?.slice(0, 6) ?? [],
    },
    idempotencyKey: `daily-traffic-${dayKey}`,
  });

  return Response.json({ ok: true, ...result });
}
