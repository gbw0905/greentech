// Server-only: tools, prompt and persistence helpers for the Watch Assistant.

import { tool } from "ai";
import { z } from "zod";
import { SITE_URL } from "@/shared/data/data-sources";
import { GOVERNMENT_SITES, MANDATES, mandatesForCountry } from "@/features/countries/mandates";
import { SUPPLY_SEO } from "@/features/supply/seo";

export const ASSISTANT_MODEL = "openai/gpt-6-astra";

export const SYSTEM_PROMPT = [
  "You are Watch Assistant, a senior bioenergy policy and market analyst working for Global Bioenergy Watch (globalbioenergywatch.org).",
  "You help visitors understand global biofuel and bioenergy policy, mandates, markets, producers and supply chains.",
  "",
  "Always prefer the site's own data: use your tools to look up policy updates, national mandates and the supply & producer datasets before answering questions about specific countries, rules or companies.",
  "When an answer comes from the site, link the relevant page using markdown links with absolute URLs on https://www.globalbioenergywatch.org (for example /countries/<slug>, /countries/<slug>/mandates, /supply/<dataset>).",
  "You may also answer general bioenergy questions from your own knowledge; say clearly when something is general background rather than tracked site data.",
  "",
  "Rules: never invent figures, dates, legal obligations, blending percentages or company data. If a tool returns nothing, say the site does not currently track it. Keep answers tight and useful — short paragraphs or compact bullet lists, no filler preamble. Remind users to verify against primary legislation before compliance decisions when they ask about legal obligations.",
].join("\n");

function mandateSummary(m: (typeof MANDATES)[number]) {
  return {
    id: m.id,
    jurisdiction: m.jurisdiction,
    instrument: m.instrument,
    countrySlug: m.countrySlug,
    fuels: m.fuels,
    status: m.status,
    currentObligation: m.currentObligation,
    requirements: m.requirements,
    compliance: m.compliance,
    timeline: m.timeline,
    sourceName: m.sourceName,
    officialSites: m.officialSites ?? [],
    sourceUrl: m.sourceUrl,
    lastReviewed: m.lastReviewed,
    profileUrl: m.countrySlug
      ? `${SITE_URL}/countries/${m.countrySlug}/mandates`
      : SITE_URL + "/mandates",
  };
}

export const assistantTools = {
  search_policy_updates: tool({
    description:
      "Search the live Global Bioenergy Watch feed of government policy and market updates by keyword, country slug, region or category.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "Keywords to search titles and summaries for. Use an empty string for the latest updates.",
        ),
      countrySlug: z
        .string()
        .nullable()
        .describe("Country slug filter such as 'united-states' or 'brazil'. Null for all."),
      category: z.enum(["policy", "market", "any"]).describe("Filter by update type."),
      limit: z.number().describe("How many updates to return, 1-20."),
    }),
    execute: async ({ query, countrySlug, category, limit }) => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      let q = supabaseAdmin
        .from("policy_updates")
        .select(
          "id,title,summary,source,url,category,country_name,country_slug,region,fuels,published_at",
        )
        .order("published_at", { ascending: false })
        .limit(Math.min(Math.max(Math.round(limit) || 8, 1), 20));

      const term = query.trim().slice(0, 120);
      if (term) q = q.or(`title.ilike.%${term}%,summary.ilike.%${term}%`);
      if (countrySlug) q = q.eq("country_slug", countrySlug);
      if (category !== "any") q = q.eq("category", category);

      const { data, error } = await q;
      if (error) return { error: error.message, updates: [] };
      return { updates: data ?? [] };
    },
  }),

  list_country_mandates: tool({
    description:
      "List the tracked biofuel mandates, targets, timelines, compliance details and official government sources for a country.",
    inputSchema: z.object({
      countrySlug: z
        .string()
        .describe("Country slug such as 'indonesia', 'brazil', 'india', 'united-states'."),
    }),
    execute: async ({ countrySlug }) => {
      const slug = countrySlug.trim().toLowerCase();
      const mandates = mandatesForCountry(slug).map(mandateSummary);
      return {
        countrySlug: slug,
        mandates,
        governmentSites: GOVERNMENT_SITES[slug] ?? [],
        profileUrl: `${SITE_URL}/countries/${slug}`,
      };
    },
  }),

  search_mandates: tool({
    description:
      "Search every tracked mandate worldwide by keyword, fuel or status — use when the user does not name one country.",
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          "Keywords matched against mandate title, country, fuel and summary. Empty string returns all.",
        ),
      limit: z.number().describe("How many mandates to return, 1-25."),
    }),
    execute: async ({ query, limit }) => {
      const term = query.trim().toLowerCase();
      const matches = MANDATES.filter((m) =>
        term.length === 0
          ? true
          : [m.jurisdiction, m.instrument, m.fuels.join(" "), m.status, m.currentObligation]
              .join(" ")
              .toLowerCase()
              .includes(term),
      ).slice(0, Math.min(Math.max(Math.round(limit) || 10, 1), 25));
      return { count: matches.length, mandates: matches.map(mandateSummary) };
    },
  }),

  list_supply_datasets: tool({
    description:
      "List the Supply & producers datasets tracked on the site (ethanol, SAF, hydrogen, UCO, pellets, carriers and more) with their page URLs and coverage.",
    inputSchema: z.object({}),
    execute: async () => ({
      datasets: Object.entries(SUPPLY_SEO).map(([id, seo]) => ({
        id,
        title: seo.title,
        description: seo.description,
        url: `${SITE_URL}/supply/${id}`,
      })),
    }),
  }),
} as const;
