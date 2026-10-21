import type { Json } from "@/integrations/supabase/types";
import type { TablesInsert } from "@/integrations/supabase/types";
import { COUNTRIES, policyStatusFor } from "@/features/policy/taxonomy";
import { MANDATES } from "@/features/countries/mandates";

export async function seedCountryProfiles() {
  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );

  const profiles: TablesInsert<"country_profiles">[] = COUNTRIES.map((c) => ({
    country_slug: c.slug,
    blurb: c.blurb,
    mandates: JSON.parse(JSON.stringify(c.mandates)) as Json,
    frameworks: c.frameworks,
    policy_status: policyStatusFor(c),
  }));

  const { error: profileError } = await supabaseAdmin
    .from("country_profiles")
    .upsert(profiles, { onConflict: "country_slug" });

  if (profileError) throw new Error(`seed profiles: ${profileError.message}`);

  const mandateRows: TablesInsert<"country_mandates">[] = MANDATES.map((m) => ({
    id: m.id,
    country_slug: m.countrySlug,
    jurisdiction: m.jurisdiction,
    instrument: m.instrument,
    fuels: m.fuels as string[],
    status: m.status as string,
    current_obligation: m.currentObligation,
    requirements: m.requirements,
    compliance: JSON.parse(JSON.stringify(m.compliance)) as Json,
    timeline: JSON.parse(JSON.stringify(m.timeline)) as Json,
    source_name: m.sourceName,
    source_url: m.sourceUrl,
    official_sites: JSON.parse(JSON.stringify(m.officialSites ?? [])) as Json,
    keywords: m.keywords ?? [],
    last_reviewed: m.lastReviewed,
  }));

  const { error: mandateError } = await supabaseAdmin
    .from("country_mandates")
    .upsert(mandateRows, { onConflict: "id" });

  if (mandateError) throw new Error(`seed mandates: ${mandateError.message}`);

  return { profiles: profiles.length, mandates: mandateRows.length };
}
