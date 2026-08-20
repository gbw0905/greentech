import { createServerFn } from "@tanstack/react-start";
import type { SummaryRequest } from "./chart-summary.server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const summariseChartFn = createServerFn({ method: "POST" })
  .inputValidator((input: SummaryRequest) => {
    if (!input || typeof input.panel !== "string" || !Array.isArray(input.rows)) {
      throw new Error("Invalid summary request");
    }
    return { ...input, rows: input.rows.slice(0, 40) };
  })
  .handler(async ({ data }) => {
    const { generateChartSummary } = await import("./chart-summary.server");
    return { summary: await generateChartSummary(data) };
  });

export const emailChartSummaryFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      email: string;
      panel: string;
      measureLabel: string;
      filterLabel: string;
      summary: string;
    }) => {
      if (!input || !EMAIL_RE.test(input.email.trim())) throw new Error("Enter a valid email address");
      if (!input.summary || input.summary.length < 50) throw new Error("Generate a summary first");
      return { ...input, email: input.email.trim().toLowerCase() };
    },
  )
  .handler(async ({ data }) => {
    const { sendTemplateEmail } = await import("./email-templates/send-email");
    const result = await sendTemplateEmail("chart-summary", data.email, {
      templateData: {
        panel: data.panel,
        measureLabel: data.measureLabel,
        filterLabel: data.filterLabel,
        summary: data.summary,
        dateLabel: new Date().toUTCString().slice(0, 16),
      },
    });
    return { sent: result.sent };
  });
