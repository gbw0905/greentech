import type { PolicyStatus } from "@/features/policy/taxonomy";

// Colours are presentation only. Keep the existing policyStatusFor classification.
export const MAP_STATUS_COLORS: Record<PolicyStatus, string> = {
  Mandated: "#0f6b5a",
  "Policy framework": "#d4b46a",
  "In development": "#8c9bb5",
  "No framework": "#e3e8ee",
};
