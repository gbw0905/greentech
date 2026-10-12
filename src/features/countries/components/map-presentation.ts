import type { PolicyStatus } from "@/features/policy/taxonomy";

// Match the production website palette. Colours are presentation only. Keep the existing policyStatusFor classification.
export const MAP_STATUS_COLORS: Record<PolicyStatus, string> = {
  Mandated: "oklch(0.62 0.19 152)",
  "Policy framework": "oklch(0.76 0.17 78)",
  "In development": "oklch(0.66 0.2 292)",
  "No framework": "#e3e8ee",
};
