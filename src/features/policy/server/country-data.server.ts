import type { CountryProfile, PolicyStatus } from "@/features/policy/taxonomy";
import { COUNTRIES, policyStatusFor, countryBySlug } from "@/features/policy/taxonomy";
import { MANDATES, GOVERNMENT_SITES } from "@/features/countries/mandates";
import type { Mandate } from "@/features/countries/mandates";

export async function getCountryProfile(
  slug: string,
): Promise<CountryProfile | undefined> {
  const staticCountry = countryBySlug(slug);
  if (!staticCountry) return undefined;

  try {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
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

export async function getAllCountryProfiles(): Promise<
  (CountryProfile & { policyStatus: PolicyStatus })[]
> {
  try {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data } = await supabaseAdmin
      .from("country_profiles")
      .select("*");

    if (data && data.length > 0) {
      const dbMap = new Map(data.map((d) => [d.country_slug, d]));
      return COUNTRIES.map((c) => {
        const db = dbMap.get(c.slug);
        if (db) {
          const merged: CountryProfile = {
            ...c,
            blurb: db.blurb ?? c.blurb,
            mandates: (db.mandates as { label: string; value: string }[]) ?? c.mandates,
            frameworks: db.frameworks?.length ? db.frameworks : c.frameworks,
          };
          return {
            ...merged,
            policyStatus: (db.policy_status as PolicyStatus) ?? policyStatusFor(merged),
          };
        }
        return { ...c, policyStatus: policyStatusFor(c) };
      });
    }
  } catch {
    // fall through to static
  }
  return COUNTRIES.map((c) => ({ ...c, policyStatus: policyStatusFor(c) }));
}

export async function getCountryMandates(slug: string): Promise<Mandate[]> {
  try {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
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

export async function getGovernmentSites(
  slug: string,
): Promise<{ label: string; url: string }[]> {
  try {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
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
