import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SummaryRequest } from "./chart-summary.server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validPayload(input: SummaryRequest): SummaryRequest {
  if (!input || typeof input.panel !== "string" || !Array.isArray(input.rows)) {
    throw new Error("Invalid summary request");
  }
  return { ...input, rows: input.rows.slice(0, 40) };
}

export const summariseChartFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validPayload)
  .handler(async ({ data, context }) => {
    const { generateChartSummary } = await import("./chart-summary.server");
    const { assertAiQuota } = await import("./ai-quota.server");
    assertAiQuota(`summary:${context.userId}`);
    return { summary: await generateChartSummary(data) };
  });


/** Generates the analyst summary for the current view and emails it with references. */
export const emailChartSummaryFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; payload: SummaryRequest }) => {
    if (!input || !EMAIL_RE.test((input.email ?? "").trim())) {
      throw new Error("Enter a valid email address");
    }
    return { email: input.email.trim().toLowerCase(), payload: validPayload(input.payload) };
  })
  .handler(async ({ data }) => {
    const { generateChartSummary } = await import("./chart-summary.server");
    const { sourcesFor, REFERENCE_NOTE } = await import("./data-sources");
    const { sendTemplateEmail } = await import("./email-templates/send-email");

    const summary = await generateChartSummary(data.payload);
    const result = await sendTemplateEmail("chart-summary", data.email, {
      templateData: {
        panel: data.payload.panel,
        measureLabel: data.payload.measureLabel,
        filterLabel: data.payload.filterLabel,
        summary,
        sources: sourcesFor(data.payload.panel),
        referenceNote: REFERENCE_NOTE,
        dateLabel: new Date().toUTCString().slice(0, 16),
      },
    });
    return { sent: result.sent };
  });
