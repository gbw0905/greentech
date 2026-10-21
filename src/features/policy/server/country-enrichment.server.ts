import type { TablesUpdate } from "@/integrations/supabase/types";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface EnrichmentResult {
  slug: string;
  ok: boolean;
  fieldsUpdated: string[];
  error?: string;
}

export async function enrichCountryProfile(
  slug: string,
): Promise<EnrichmentResult> {
  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );

  const { data: profile } = await supabaseAdmin
    .from("country_profiles")
    .select("*")
    .eq("country_slug", slug)
    .single();

  if (!profile) return { slug, ok: false, fieldsUpdated: [], error: "not found" };

  const { data: recentNews } = await supabaseAdmin
    .from("policy_updates")
    .select("title,summary,published_at")
    .eq("country_slug", slug)
    .order("published_at", { ascending: false })
    .limit(15);

  const newsContext = (recentNews ?? [])
    .map((n) => `- ${n.title} (${n.published_at ?? "undated"}): ${n.summary}`)
    .join("\n");

  const articleIds = (recentNews ?? []).map((n) => n.title).slice(0, 10);

  const prompt = `You are a bioenergy policy analyst. Given this country profile and recent news, update the profile fields.

Country slug: ${slug}
Current blurb: ${profile.blurb ?? "(none)"}
Current mandates: ${JSON.stringify(profile.mandates)}
Current frameworks: ${JSON.stringify(profile.frameworks)}
Current policy_status: ${profile.policy_status ?? "(none)"}

Recent news:
${newsContext || "No recent news available."}

Respond with a JSON object containing ONLY the fields that need updating. Possible fields:
- "blurb": string (1-2 sentence summary of the country's biofuel policy landscape)
- "mandates": array of {label, value} objects (key policy markers like "Ethanol blend", "Biodiesel blend", "Program", etc.)
- "frameworks": array of strings (key policy instrument abbreviations)
- "policy_status": one of "Mandated", "Policy framework", "In development", "No framework"

Only include fields that actually changed based on the news. If nothing changed, return {}.
Respond with valid JSON only, no markdown.`;

  try {
    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) return { slug, ok: false, fieldsUpdated: [], error: "no GEMINI_API_KEY" };

    const model = "gemini-3.8-flash";
    const res = await fetch(
      `${GEMINI_URL}/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const updates = JSON.parse(cleaned);

    const fieldsUpdated: string[] = [];
    const patch: TablesUpdate<"country_profiles"> = { updated_at: new Date().toISOString() };

    if (updates.blurb && updates.blurb !== profile.blurb) {
      patch.blurb = updates.blurb;
      patch.ai_blurb_at = new Date().toISOString();
      fieldsUpdated.push("blurb");
    }
    if (updates.mandates && JSON.stringify(updates.mandates) !== JSON.stringify(profile.mandates)) {
      patch.mandates = updates.mandates;
      fieldsUpdated.push("mandates");
    }
    if (updates.frameworks && JSON.stringify(updates.frameworks) !== JSON.stringify(profile.frameworks)) {
      patch.frameworks = updates.frameworks;
      fieldsUpdated.push("frameworks");
    }
    if (updates.policy_status && updates.policy_status !== profile.policy_status) {
      patch.policy_status = updates.policy_status;
      patch.ai_status_at = new Date().toISOString();
      fieldsUpdated.push("policy_status");
    }

    if (fieldsUpdated.length > 0) {
      patch.last_enriched_at = new Date().toISOString();
      const { error } = await supabaseAdmin
        .from("country_profiles")
        .update(patch)
        .eq("country_slug", slug);
      if (error) throw new Error(error.message);
    }

    await supabaseAdmin.from("country_enrichment_log").insert({
      country_slug: slug,
      enrichment_type: "profile",
      articles_used: articleIds,
      result_summary: fieldsUpdated.length > 0
        ? `Updated: ${fieldsUpdated.join(", ")}`
        : "No changes needed",
    });

    return { slug, ok: true, fieldsUpdated };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);

    await supabaseAdmin
      .from("country_enrichment_log")
      .insert({
        country_slug: slug,
        enrichment_type: "profile",
        articles_used: articleIds,
        result_summary: `Error: ${errMsg}`,
      })
      .then(() => {});

    return { slug, ok: false, fieldsUpdated: [], error: errMsg };
  }
}

export async function enrichStaleProfiles(
  maxAge: number = 7 * 24 * 60 * 60 * 1000,
  limit: number = 5,
): Promise<EnrichmentResult[]> {
  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );

  const cutoff = new Date(Date.now() - maxAge).toISOString();

  const { data: stale } = await supabaseAdmin
    .from("country_profiles")
    .select("country_slug")
    .or(`last_enriched_at.is.null,last_enriched_at.lt.${cutoff}`)
    .order("last_enriched_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (!stale || stale.length === 0) return [];

  const results: EnrichmentResult[] = [];
  for (const row of stale) {
    results.push(await enrichCountryProfile(row.country_slug));
  }
  return results;
}
