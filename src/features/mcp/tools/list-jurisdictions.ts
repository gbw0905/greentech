import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { COUNTRIES, policyStatusFor } from "@/features/policy/taxonomy";

export default defineTool({
  name: "list_jurisdictions",
  title: "List tracked jurisdictions",
  description:
    "List the jurisdictions tracked by Global Bioenergy Watch with their slug, region and biofuel policy status (Mandated, Policy framework, In development, No framework).",
  inputSchema: {
    region: z.string().optional().describe("Optional region filter, e.g. 'Asia Pacific'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ region }) => {
    const items = COUNTRIES.filter(
      (c) => !region || c.region.toLowerCase() === region.toLowerCase(),
    ).map((c) => ({
      slug: c.slug,
      name: c.name,
      region: c.region,
      policy_status: policyStatusFor(c),
    }));
    return {
      content: [{ type: "text" as const, text: JSON.stringify(items, null, 2) }],
      structuredContent: { count: items.length, jurisdictions: items },
    };
  },
});
