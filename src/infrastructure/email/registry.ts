import type { ComponentType } from "react";
import { template as dailyTrafficTemplate } from "./templates/daily-traffic";
import { template as alertConfirmTemplate } from "./templates/alert-confirm";
import { template as policyAlertTemplate } from "./templates/policy-alert";
import { template as policyBriefTemplate } from "./templates/policy-brief";
import { template as dailyFlyerTemplate } from "./templates/daily-flyer";
import { template as chartSummaryTemplate } from "./templates/chart-summary";
import { template as contactFormTemplate } from "./templates/contact-form";

export interface TemplateEntry {
  component: ComponentType<any>;
  subject: string | ((data: Record<string, any>) => string);
  displayName?: string;
  previewData?: Record<string, any>;
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string;
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  "daily-traffic": dailyTrafficTemplate,
  "alert-confirm": alertConfirmTemplate,
  "policy-alert": policyAlertTemplate,
  "policy-brief": policyBriefTemplate,
  "daily-flyer": dailyFlyerTemplate,
  "chart-summary": chartSummaryTemplate,
  "contact-form": contactFormTemplate,
};
