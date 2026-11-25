import * as React from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { TEMPLATES } from "./registry";

// Server-only: reads RESEND_API_KEY. Never import from client components.

const SITE_NAME = "Global Bioenergy Watch";
const SENDER_EMAIL = "noreply@globalbioenergywatch.org";

export type SendTemplateEmailResult =
  { sent: true } | { sent: false; reason: "recipient_suppressed" };

export interface SendTemplateEmailOptions {
  templateData?: Record<string, unknown>;
  /** Dedupes retries of the same logical send; defaults to a random UUID (no dedupe). */
  idempotencyKey?: string;
  replyTo?: string;
  /** Self-service opt-out link for subscription emails (opens a confirmation page). */
  unsubscribeUrl?: string;
}

/**
 * Renders a registered template and sends it through Resend.
 * A suppressed recipient is an expected outcome ({ sent: false });
 * any other failure throws.
 */
export async function sendTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {},
): Promise<SendTemplateEmailResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const template = TEMPLATES[templateName];
  if (!template) {
    throw new Error(
      `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(", ")}`,
    );
  }

  const recipient = template.to || to;
  if (!recipient) {
    throw new Error("Recipient is required (the template defines no fixed recipient)");
  }

  const templateData = options.templateData ?? {};
  const element = React.createElement(template.component, templateData);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject =
    typeof template.subject === "function" ? template.subject(templateData) : template.subject;

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    to: recipient,
    from: `${SITE_NAME} <${SENDER_EMAIL}>`,
    subject,
    html,
    text,
    replyTo: options.replyTo || SENDER_EMAIL,
    ...(options.idempotencyKey || options.unsubscribeUrl
      ? {
          headers: {
            ...(options.idempotencyKey ? { "X-Entity-Ref-ID": options.idempotencyKey } : {}),
            ...(options.unsubscribeUrl
              ? { "List-Unsubscribe": `<${options.unsubscribeUrl}>` }
              : {}),
          },
        }
      : {}),
  });

  if (error) {
    if (error.name === "validation_error" && error.message?.includes("suppressed")) {
      return { sent: false, reason: "recipient_suppressed" };
    }
    throw new Error(`Resend error: ${error.message}`);
  }

  return { sent: true };
}
