import { sendTemplateEmail } from "@/infrastructure/email/send-email";

/** Sends new policy updates to confirmed daily alert subscribers. */
export async function sendDailyAlertDigest(): Promise<Response> {
  const windowMs = 24 * 60 * 60 * 1000;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - windowMs).toISOString();

  const { data: updates, error: updateError } = await supabaseAdmin
    .from("policy_updates")
    .select("id,url,title,summary,source,country_slug,country_name,fuels,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(60);

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 });
  if (!updates || updates.length === 0) {
    return Response.json({ ok: true, sent: 0, reason: "no_new_updates" });
  }

  const { data: subscribers, error: subscriberError } = await supabaseAdmin
    .from("alert_subscribers")
    .select("id,email,fuels,countries")
    .eq("cadence", "daily")
    .not("confirmed_at", "is", null);

  if (subscriberError) {
    return Response.json({ error: subscriberError.message }, { status: 500 });
  }

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

  for (const subscriber of subscribers ?? []) {
    const wantedFuels = subscriber.fuels ?? [];
    const wantedCountries = subscriber.countries ?? [];
    const { data: alreadySent } = await supabaseAdmin
      .from("brief_sends")
      .select("update_id")
      .eq("email", subscriber.email)
      .gte("sent_at", since);
    const seen = new Set((alreadySent ?? []).map((row) => row.update_id));

    const matched = updates
      .filter((update) => !seen.has(update.id))
      .filter(
        (update) =>
          wantedFuels.length === 0 ||
          (update.fuels ?? []).some((fuel) => wantedFuels.includes(fuel)),
      )
      .filter(
        (update) =>
          wantedCountries.length === 0 ||
          (update.country_slug != null && wantedCountries.includes(update.country_slug)),
      )
      .slice(0, 12);

    if (matched.length === 0) {
      skipped += 1;
      continue;
    }

    try {
      const result = await sendTemplateEmail("policy-alert", subscriber.email, {
        templateData: {
          dateLabel,
          items: matched.map((update) => ({
            title: update.title,
            url: update.url,
            summary: update.summary ?? "",
            source: update.source ?? "",
            countryName: update.country_name,
            fuels: update.fuels ?? [],
          })),
        },
        idempotencyKey: `policy-alert-daily-${subscriber.id}-${dayKey}`,
      });

      if (!result.sent) {
        skipped += 1;
        continue;
      }

      sent += 1;
      await supabaseAdmin
        .from("alert_subscribers")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("id", subscriber.id);
      await supabaseAdmin.from("brief_sends").upsert(
        matched.map((update) => ({
          email: subscriber.email,
          update_id: update.id,
          subscriber_id: subscriber.id,
          cadence: "daily",
          sent_at: new Date().toISOString(),
        })),
        { onConflict: "email,update_id" },
      );
    } catch (error) {
      console.error("policy-alert-digest: send failed", subscriber.email, error);
      skipped += 1;
    }
  }

  return Response.json({ ok: true, cadence: "daily", sent, skipped, updates: updates.length });
}
