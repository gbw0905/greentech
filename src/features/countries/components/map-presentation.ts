import type { PolicyStatus } from "@/features/policy/taxonomy";

// Colours are presentation only. Keep the existing policyStatusFor classification.
export const MAP_STATUS_COLORS: Record<PolicyStatus, string> = {
  Mandated: "#10a459",
  "Policy framework": "#f2c56b",
  "In development": "#a98aff",
  "No framework": "#e5ebf0",
};
