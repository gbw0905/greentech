import type { CountryProfile, PolicyStatus } from "@/features/policy/taxonomy";
import { COUNTRIES, policyStatusFor, countryBySlug } from "@/features/policy/taxonomy";
import { MANDATES, GOVERNMENT_SITES } from "@/features/countries/mandates";
import type { Mandate } from "@/features/countries/mandates";

export async function getCountryProfile(slug: string): Promise<CountryProfile | undefined> {
  const staticCountry = countryBySlug(slug);
  if (!staticCountry) return undefined;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("country_profiles")
      .select("*")
      .eq("country_slug", slug)
      .single();

    if (data) {
      return {
        ...staticCountry,
        blurb: data.blurb ?? staticCountry.blurb,
        mandates: (data.mandates as { label: string; value: string }[]) ?? staticCountry.mandates,
        frameworks: data.frameworks?.length ? data.frameworks : staticCountry.frameworks,
      };
    }
  } catch {
    // fall through to static
  }
  return staticCountry;
}

export interface ProfileChangeSource {
  at: string;
  fields: string[];
  url: string;
  title: string | null;
  sourceName: string | null;
  quote: string | null;
}

export type LiveCountryProfile = CountryProfile & {
  policyStatus: PolicyStatus;
  /** Latest automatic change and the article that justified it. */
  lastChange: ProfileChangeSource | null;
  /** When the profile was last checked against the news, changed or not. */
  checkedAt: string | null;
};

/**
 * Every country with its database profile (kept current by the automatic
 * updater) merged over the built-in starting values in taxonomy.ts.
 */
export async function getAllCountryProfiles(): Promise<LiveCountryProfile[]> {
  const fallback = () =>
    COUNTRIES.map((c) => ({
      ...c,
      policyStatus: policyStatusFor(c),
      lastChange: null,
      checkedAt: null,
    }));
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("country_profiles").select("*");

    if (!data || data.length === 0) return fallback();
    const dbMap = new Map(data.map((d) => [d.country_slug, d]));
    return COUNTRIES.map((c) => {
      const db = dbMap.get(c.slug);
      if (!db) return { ...c, policyStatus: policyStatusFor(c), lastChange: null, checkedAt: null };
      const merged: CountryProfile = {
        ...c,
        blurb: db.blurb ?? c.blurb,
        mandates: Array.isArray(db.mandates)
          ? (db.mandates as { label: string; value: string }[])
          : c.mandates,
        frameworks: db.frameworks?.length ? db.frameworks : c.frameworks,
      };
      const lastChange =
        db.last_change_at && db.last_change_source_url
          ? {
              at: db.last_change_at,
              fields: db.last_change_fields ?? [],
              url: db.last_change_source_url,
              title: db.last_change_source_title ?? null,
              sourceName: db.last_change_source_name ?? null,
              quote: db.last_change_quote ?? null,
            }
          : null;
      return {
        ...merged,
        policyStatus: (db.policy_status as PolicyStatus | null) ?? policyStatusFor(merged),
        lastChange,
        checkedAt: db.last_enriched_at,
      };
    });
  } catch {
    return fallback();
  }
}

export async function getCountryMandates(slug: string): Promise<Mandate[]> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("country_mandates")
      .select("*")
      .eq("country_slug", slug);

    if (data && data.length > 0) {
      return data.map((m) => ({
        id: m.id,
        jurisdiction: m.jurisdiction,
        countrySlug: m.country_slug,
        instrument: m.instrument,
        fuels: m.fuels as Mandate["fuels"],
        status: m.status as Mandate["status"],
        currentObligation: m.current_obligation,
        requirements: m.requirements,
        compliance: m.compliance as Mandate["compliance"],
        timeline: (m.timeline as unknown as Mandate["timeline"]) ?? [],
        sourceName: m.source_name ?? "",
        sourceUrl: m.source_url ?? "",
        officialSites: (m.official_sites as Mandate["officialSites"]) ?? [],
        keywords: m.keywords ?? [],
        lastReviewed: m.last_reviewed ?? "",
      }));
    }
  } catch {
    // fall through to static
  }
  return MANDATES.filter((m) => m.countrySlug === slug);
}

export async function getAllMandates(): Promise<Mandate[]> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("country_mandates")
      .select("*")
      .order("jurisdiction", { ascending: true });

    if (data && data.length > 0) {
      return data.map((m) => ({
        id: m.id,
        jurisdiction: m.jurisdiction,
        countrySlug: m.country_slug,
        instrument: m.instrument,
        fuels: m.fuels as Mandate["fuels"],
        status: m.status as Mandate["status"],
        currentObligation: m.current_obligation,
        requirements: m.requirements,
        compliance: m.compliance as Mandate["compliance"],
        timeline: (m.timeline as unknown as Mandate["timeline"]) ?? [],
        sourceName: m.source_name ?? "",
        sourceUrl: m.source_url ?? "",
        officialSites: (m.official_sites as Mandate["officialSites"]) ?? [],
        keywords: m.keywords ?? [],
        lastReviewed: m.last_reviewed ?? "",
      }));
    }
  } catch {
    // fall through to static
  }
  return MANDATES;
}

export async function getGovernmentSites(slug: string): Promise<{ label: string; url: string }[]> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("country_mandates")
      .select("official_sites")
      .eq("country_slug", slug);

    if (data && data.length > 0) {
      const sites: { label: string; url: string }[] = [];
      for (const row of data) {
        const os = row.official_sites as { label: string; url: string }[] | null;
        if (os) sites.push(...os);
      }
      if (sites.length > 0) return sites;
    }
  } catch {
    // fall through to static
  }
  return GOVERNMENT_SITES[slug] ?? [];
}
