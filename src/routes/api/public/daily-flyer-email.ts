import { createFileRoute } from "@tanstack/react-router";
import { sendTemplateEmail } from "@/infrastructure/email/send-email";

/** Daily flyer with the top 10 bioenergy policy headlines, sent to the desk owner. */
async function run() {
  const recipient = process.env["TRAFFIC_DIGEST_EMAIL"];
  if (!recipient) {
    return Response.json({ error: "TRAFFIC_DIGEST_EMAIL is not configured" }, { status: 500 });
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  let { data: updates, error } = await supabaseAdmin
    .from("policy_updates")
    .select("url,title,summary,source,country_name,fuels,category,published_at,created_at")
    .gte("created_at", since)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(10);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Fall back to the freshest archive items when nothing new landed.
  if (!updates || updates.length === 0) {
    const fallback = await supabaseAdmin
      .from("policy_updates")
      .select("url,title,summary,source,country_name,fuels,category,published_at,created_at")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(10);
    if (fallback.error) return Response.json({ error: fallback.error.message }, { status: 500 });
    updates = fallback.data ?? [];
  }

  const items = updates.map((u) => ({
    title: u.title,
    url: u.url,
    summary: u.summary ?? "",
    source: u.source ?? "",
    countryName: u.country_name,
    fuels: u.fuels ?? [],
    category: u.category ?? "policy",
    publishedAt: u.published_at
      ? new Date(u.published_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        })
      : undefined,
  }));

  const dayKey = new Date().toISOString().slice(0, 10);
  const result = await sendTemplateEmail("daily-flyer", recipient, {
    templateData: {
      dateLabel: new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      items,
    },
    idempotencyKey: `daily-flyer-${dayKey}`,
  });

  return Response.json({ ok: true, headlines: items.length, ...result });
}

export const Route = createFileRoute("/api/public/daily-flyer-email")({
  server: { handlers: { GET: run, POST: run } },
});
