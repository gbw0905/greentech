import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { countryBySlug, policyStatusFor } from "@/lib/policy-taxonomy";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "get_country_profile",
  title: "Get country bioenergy profile",
  description:
    "Get a jurisdiction's bioenergy policy profile — mandates, frameworks, policy status — plus its most recent tracked policy and market updates.",
  inputSchema: {
    country_slug: z.string().describe("Country slug, e.g. 'brazil' (see list_jurisdictions)."),
    updates_limit: z.number().int().min(0).max(50).default(10),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ country_slug, updates_limit }) => {
    const country = countryBySlug(country_slug);
    if (!country) throw new ToolError(`Unknown country slug: ${country_slug}`);

    const limit = updates_limit ?? 10;
    let updates: unknown[] = [];
    if (limit > 0) {
      const { data, error } = await supabaseAnon()
        .from("policy_updates")
        .select("url,title,summary,source,published_at,category,fuels")
        .eq("country_slug", country.slug)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };
      updates = data ?? [];
    }

    const profile = {
      slug: country.slug,
      name: country.name,
      region: country.region,
      policy_status: policyStatusFor(country),
      summary: country.blurb,
      mandates: country.mandates,
      frameworks: country.frameworks,
      recent_updates: updates,
    };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(profile, null, 2) }],
      structuredContent: profile,
    };
  },
});
