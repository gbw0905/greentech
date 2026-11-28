import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { countryBySlug } from "@/features/policy/taxonomy";

const subscribeSchema = z.object({
  email: z.string().trim().email().max(255),
  fuels: z.array(z.string().max(40)).max(12).default([]),
  countries: z.array(z.string().max(60)).max(40).default([]),
});

export const subscribeToAlerts = createServerFn({ method: "POST" })
  .validator((data: unknown) => subscribeSchema.parse(data))
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase();
    const { clientIp, takeRequestSlot } =
      await import("@/infrastructure/http/server/request-limit.server");
    const address = clientIp(getRequest());
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!takeRequestSlot(`alert-signup:${address}`, 8))
      throw new Error("Too many requests. Please try again in a minute.");

    const columns = "id, confirm_token, confirmed_at, fuels, countries";
    const created = await supabaseAdmin
      .from("alert_subscribers")
      .upsert(
        { email, fuels: data.fuels, countries: data.countries, cadence: "daily" },
        { onConflict: "email", ignoreDuplicates: true },
      )
      .select(columns)
      .maybeSingle();
    const { data: row, error } =
      created.error || created.data
        ? created
        : await supabaseAdmin.from("alert_subscribers").select(columns).eq("email", email).single();
    if (error || !row) {
      console.error("alert subscription lookup failed", error);
      throw new Error("Could not process the subscription.");
    }
    if (row.confirmed_at) return { status: "confirmation_sent" as const };

    const { sendTemplateEmail } = await import("@/infrastructure/email/send-email");
    const confirmUrl = `https://www.globalbioenergywatch.org/alerts/confirm?token=${row.confirm_token}`;
    const result = await sendTemplateEmail("alert-confirm", email, {
      templateData: {
        confirmUrl,
        fuels: row.fuels,
        countries: row.countries.map((s) => countryBySlug(s)?.name ?? s),
      },
      idempotencyKey: `alert-confirm-${row.id}-${row.confirm_token.slice(0, 8)}`,
    });

    if (!result.sent) return { status: "suppressed" as const };
    return { status: "confirmation_sent" as const };
  });

export const confirmAlertSubscription = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ token: z.string().regex(/^[a-f0-9]{48}$/i) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("alert_subscribers")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("confirm_token", data.token)
      .select("id");

    if (error) {
      console.error("alert subscription update failed", error);
      throw new Error("Could not update the subscription.");
    }
    if (!rows || rows.length === 0) return { ok: false as const };
    return { ok: true as const };
  });

const unsubscribeSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{48}$/i, "Invalid subscription link"),
});

/**
 * Changes a confirmed subscriber back to an unconfirmed state and rotates the
 * bearer token, preventing old email links from being reused.
 *
 * Deliberately POST-only: link-scanning bots that prefetch an email URL must
 * not trigger an unsubscribe.
 */
export const unsubscribeFromAlerts = createServerFn({ method: "POST" })
  .validator((data: unknown) => unsubscribeSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { randomBytes } = await import("node:crypto");
    const { data: row, error } = await supabaseAdmin
      .from("alert_subscribers")
      .update({
        confirmed_at: null,
        confirm_token: randomBytes(24).toString("hex"),
      })
      .eq("confirm_token", data.token)
      .not("confirmed_at", "is", null)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("alert subscription update failed", error);
      throw new Error("Could not update the subscription.");
    }
    return { ok: Boolean(row) };
  });

const briefSchema = z.object({
  email: z.string().trim().email().max(255),
  updateId: z.string().uuid(),
});

/** On-demand: emails an AI brief for one specific update to a reader. */
export const requestPolicyBrief = createServerFn({ method: "POST" })
  .validator((data: unknown) => briefSchema.parse(data))
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase();
    const { clientIp, takeRequestSlot } =
      await import("@/infrastructure/http/server/request-limit.server");
    const address = clientIp(getRequest());
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!takeRequestSlot(`policy-brief:${address}`, 6) || !takeRequestSlot("policy-brief:all", 40))
      return { status: "rate_limited" as const };

    // Rate limit: max 10 briefs per recipient per hour.
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabaseAdmin
      .from("brief_sends")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("sent_at", hourAgo);
    if (countError) {
      console.error("policy brief quota lookup failed", countError);
      throw new Error("Could not process the brief request.");
    }
    if ((count ?? 0) >= 10) return { status: "rate_limited" as const };

    const { data: update, error: updErr } = await supabaseAdmin
      .from("policy_updates")
      .select(
        "id,title,summary,source,url,category,country_name,region,fuels,published_at,ai_brief",
      )
      .eq("id", data.updateId)
      .maybeSingle();
    if (updErr) {
      console.error("policy brief lookup failed", updErr);
      throw new Error("Could not process the brief request.");
    }
    if (!update) return { status: "not_found" as const };

    const { getOrCreateBrief } = await import("@/features/alerts/server/ai-brief.server");
    const brief = await getOrCreateBrief(update);

    const { sendTemplateEmail } = await import("@/infrastructure/email/send-email");
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

    await supabaseAdmin.from("brief_sends").upsert(
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
