import { createFileRoute } from "@tanstack/react-router";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

/** Sends AI briefs for brand-new updates to subscribers on the "instant" cadence. */
async function run() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

  const { data: subs, error: subErr } = await supabaseAdmin
    .from("alert_subscribers")
    .select("id,email,fuels,countries")
    .eq("cadence", "instant")
    .not("confirmed_at", "is", null);
  if (subErr) return Response.json({ error: subErr.message }, { status: 500 });
  if (!subs || subs.length === 0) return Response.json({ ok: true, sent: 0, reason: "no_subscribers" });

  const { data: updates, error: updErr } = await supabaseAdmin
    .from("policy_updates")
    .select(
      "id,url,title,summary,source,category,region,country_slug,country_name,fuels,published_at,ai_brief",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20);
  if (updErr) return Response.json({ error: updErr.message }, { status: 500 });
  if (!updates || updates.length === 0) return Response.json({ ok: true, sent: 0, reason: "no_new_updates" });

  const { getOrCreateBrief } = await import("@/lib/ai-brief.server");

  let sent = 0;
  let skipped = 0;

  for (const sub of subs) {
    const wanted = sub.fuels ?? [];
    const wantedCountries = sub.countries ?? [];

    const { data: alreadySent } = await supabaseAdmin
      .from("brief_sends")
      .select("update_id")
      .eq("email", sub.email)
      .gte("sent_at", since);
    const seen = new Set((alreadySent ?? []).map((r) => r.update_id));

    const matched = updates
      .filter((u) => !seen.has(u.id))
      .filter((u) => wanted.length === 0 || (u.fuels ?? []).some((f) => wanted.includes(f)))
      .filter(
        (u) =>
          wantedCountries.length === 0 ||
          (u.country_slug != null && wantedCountries.includes(u.country_slug)),
      )
      .slice(0, 3);

    for (const u of matched) {
      try {
        const brief = await getOrCreateBrief(u);
        const result = await sendTemplateEmail("policy-brief", sub.email, {
          templateData: {
            title: u.title,
            brief,
            jurisdiction: u.country_name ?? u.region ?? "Global",
            fuels: u.fuels ?? [],
            source: u.source ?? "",
            category: u.category,
            url: u.url,
            dateLabel: u.published_at
              ? new Date(u.published_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })
              : "",
          },
          idempotencyKey: `policy-brief-${u.id}-${sub.email}`,
        });
        if (result.sent) sent++;
        else skipped++;
        await supabaseAdmin.from("brief_sends").upsert(
          {
            email: sub.email,
            update_id: u.id,
            subscriber_id: sub.id,
            cadence: "instant",
            sent_at: new Date().toISOString(),
          },
          { onConflict: "email,update_id" },
        );
      } catch (e) {
        console.error("instant-brief-alerts: failed", sub.email, u.id, e);
        skipped++;
      }
    }

    if (matched.length > 0) {
      await supabaseAdmin
        .from("alert_subscribers")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("id", sub.id);
    }
  }

  return Response.json({ ok: true, sent, skipped });
}

export const Route = createFileRoute("/api/public/instant-brief-alerts")({
  server: { handlers: { GET: run, POST: run } },
});
