import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "search_policy_updates",
  title: "Search bioenergy policy & market updates",
  description:
    "Search the tracker's feed of global bioenergy policy and market updates from trusted outlets and government sources. Filter by free-text query, country slug, region, fuel type or category, newest first.",
  inputSchema: {
    query: z.string().optional().describe("Free-text match against title and summary."),
    country_slug: z
      .string()
      .optional()
      .describe("Country slug, e.g. 'united-states' (see list_jurisdictions)."),
    region: z.string().optional().describe("Region name, e.g. 'Europe'."),
    fuel: z.string().optional().describe("Fuel type, e.g. 'SAF', 'Ethanol', 'Biodiesel'."),
    category: z.enum(["policy", "market"]).optional().describe("Update category."),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, country_slug, region, fuel, category, limit }) => {
    let q = supabaseAnon()
      .from("policy_updates")
      .select(
        "url,title,summary,source,published_at,region,country_slug,country_name,fuels,category",
      )
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit ?? 20);

    if (country_slug) q = q.eq("country_slug", country_slug);
    if (region) q = q.eq("region", region);
    if (category) q = q.eq("category", category);
    if (fuel) q = q.contains("fuels", [fuel]);
    if (query) {
      // Treat the query as literal text: strip PostgREST filter metacharacters
      // so it cannot inject extra conditions into the .or() expression.
      const safe = query
        .replace(/[,.()*%\\"']/g, " ")
        .trim()
        .slice(0, 120);
      if (safe) q = q.or(`title.ilike.%${safe}%,summary.ilike.%${safe}%`);
    }

    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: error.message }], isError: true };

    const updates = data ?? [];
    return {
      content: [{ type: "text" as const, text: JSON.stringify(updates, null, 2) }],
      structuredContent: { count: updates.length, updates },
    };
  },
});
