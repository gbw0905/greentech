import { createFileRoute } from "@tanstack/react-router";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

/** Daily digest of new policy updates, sent to confirmed alert subscribers. */
async function run() {
  const windowMs = 24 * 60 * 60 * 1000;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - windowMs).toISOString();

  const { data: updates, error: updErr } = await supabaseAdmin
    .from("policy_updates")
    .select("id,url,title,summary,source,country_slug,country_name,fuels,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(60);

  if (updErr) return Response.json({ error: updErr.message }, { status: 500 });
  if (!updates || updates.length === 0) return Response.json({ ok: true, sent: 0, reason: "no_new_updates" });

  const { data: subs, error: subErr } = await supabaseAdmin
    .from("alert_subscribers")
    .select("id,email,fuels,countries")
    .eq("cadence", "daily")
    .not("confirmed_at", "is", null);

  if (subErr) return Response.json({ error: subErr.message }, { status: 500 });

  const dayKey = new Date().toISOString().slice(0, 10);
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  let sent = 0;
  let skipped = 0;

  for (const sub of subs ?? []) {
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
      .slice(0, 12);

    const items = matched.map((u) => ({
      title: u.title,
      url: u.url,
      summary: u.summary ?? "",
      source: u.source ?? "",
      countryName: u.country_name,
      fuels: u.fuels ?? [],
    }));

    if (items.length === 0) {
      skipped++;
      continue;
    }

    try {
      const result = await sendTemplateEmail("policy-alert", sub.email, {
        templateData: { dateLabel, items },
        idempotencyKey: `policy-alert-daily-${sub.id}-${dayKey}`,
      });
      if (result.sent) {
        sent++;
        await supabaseAdmin
          .from("alert_subscribers")
          .update({ last_sent_at: new Date().toISOString() })
          .eq("id", sub.id);
        await supabaseAdmin.from("brief_sends").upsert(
          matched.map((u) => ({
            email: sub.email,
            update_id: u.id,
            subscriber_id: sub.id,
            cadence: "daily",
            sent_at: new Date().toISOString(),
          })),
          { onConflict: "email,update_id" },
        );
      } else {
        skipped++;
      }
    } catch (e) {
      console.error("policy-alert-digest: send failed", sub.email, e);
      skipped++;
    }
  }

  return Response.json({ ok: true, cadence: "daily", sent, skipped, updates: updates.length });
}

export const Route = createFileRoute("/api/public/policy-alert-digest")({
  server: { handlers: { GET: run, POST: run } },
});