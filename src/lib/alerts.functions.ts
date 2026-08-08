import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().trim().email().max(255),
  fuels: z.array(z.string().max(40)).max(12).default([]),
});

export const subscribeToAlerts = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => subscribeSchema.parse(data))
  .handler(async ({ data }) => {
    const email = data.email.toLowerCase();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("alert_subscribers")
      .upsert({ email, fuels: data.fuels }, { onConflict: "email" })
      .select("id, confirm_token, confirmed_at")
      .single();

    if (error) throw new Error(error.message);

    if (row.confirmed_at) {
      return { status: "already_confirmed" as const };
    }

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const confirmUrl = `https://www.globalbioenergywatch.org/alerts/confirm?token=${row.confirm_token}`;
    const result = await sendTemplateEmail("alert-confirm", email, {
      templateData: { confirmUrl, fuels: data.fuels },
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