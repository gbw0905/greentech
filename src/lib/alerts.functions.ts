import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { countryBySlug } from "@/lib/policy-taxonomy";

const subscribeSchema = z.object({
  email: z.string().trim().email().max(255),
  fuels: z.array(z.string().max(40)).max(12).default([]),
  countries: z.array(z.string().max(60)).max(40).default([]),
});

export const subscribeToAlerts = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => subscribeSchema.parse(data))
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("alert_subscribers")
      .upsert(
        { email, fuels: data.fuels, countries: data.countries, cadence: "daily" },
        { onConflict: "email" },
      )
      .select("id, confirm_token, confirmed_at")
      .single();

    if (error) throw new Error(error.message);

    if (row.confirmed_at) {
      return { status: "already_confirmed" as const };
    }

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const confirmUrl = `https://www.globalbioenergywatch.org/alerts/confirm?token=${row.confirm_token}`;
    const result = await sendTemplateEmail("alert-confirm", email, {
      templateData: {
        confirmUrl,
        fuels: data.fuels,
        countries: data.countries.map((s) => countryBySlug(s)?.name ?? s),
      },
      idempotencyKey: `alert-confirm-${row.id}-${row.confirm_token.slice(0, 8)}`,
    });

    if (!result.sent) return { status: "suppressed" as const };
    return { status: "confirmation_sent" as const };
  });

export const confirmAlertSubscription = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ token: z.string().min(10).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("alert_subscribers")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("confirm_token", data.token)
      .select("email");

    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return { ok: false as const };
    return { ok: true as const, email: rows[0]!.email };
  });

const briefSchema = z.object({
  email: z.string().trim().email().max(255),
  updateId: z.string().uuid(),
});

/** On-demand: emails an AI brief for one specific update to a reader. */
export const requestPolicyBrief = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => briefSchema.parse(data))
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Rate limit: max 10 briefs per address per hour.
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("brief_sends")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("sent_at", hourAgo);
    if ((count ?? 0) >= 10) return { status: "rate_limited" as const };

    const { data: update, error: updErr } = await supabaseAdmin
      .from("policy_updates")
      .select(
        "id,title,summary,source,url,category,country_name,region,fuels,published_at,ai_brief",
      )
      .eq("id", data.updateId)
      .maybeSingle();
    if (updErr) throw new Error(updErr.message);
    if (!update) return { status: "not_found" as const };

    const { getOrCreateBrief } = await import("@/lib/ai-brief.server");
    const brief = await getOrCreateBrief(update);

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const result = await sendTemplateEmail("policy-brief", email, {
      templateData: {
        title: update.title,
        brief,
        jurisdiction: update.country_name ?? update.region ?? "Global",
        fuels: update.fuels ?? [],
        source: update.source ?? "",
        category: update.category,
        url: update.url,
        dateLabel: update.published_at
          ? new Date(update.published_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            })
          : "",
      },
      idempotencyKey: `policy-brief-${update.id}-${email}`,
    });

    if (!result.sent) return { status: "suppressed" as const };

    // Register the reader for future alerts (unconfirmed until they opt in).
    const { data: sub } = await supabaseAdmin
      .from("alert_subscribers")
      .upsert({ email }, { onConflict: "email", ignoreDuplicates: false })
      .select("id")
      .single();

    await supabaseAdmin
      .from("brief_sends")
      .upsert(
        {
          email,
          update_id: update.id,
          subscriber_id: sub?.id ?? null,
          cadence: "ondemand",
          sent_at: new Date().toISOString(),
        },
        { onConflict: "email,update_id" },
      );

    return { status: "sent" as const };
  });