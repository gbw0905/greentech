import type { Json, TablesUpdate } from "@/integrations/supabase/types";
import { countryBySlug } from "@/features/policy/taxonomy";
import { isOfficialSource, isTrustedOutlet } from "@/features/policy/outlets";
import {
  buildProfilePrompt,
  judgeProposal,
  type EvidenceArticle,
  type ProfileSnapshot,
} from "@/features/policy/profile-update-rules";
import { captureGeminiGeneration } from "@/infrastructure/telemetry/ai-observability.server";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-3.8-flash";
const NEWS_WINDOW_DAYS = 120;

interface EnrichmentResult {
  slug: string;
  ok: boolean;
  fieldsUpdated: string[];
  /** Why a proposed change was refused, if it was. */
  rejected?: string;
  error?: string;
}

async function askGemini(prompt: string): Promise<unknown> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("no GEMINI_API_KEY");
  const startedAt = Date.now();
  const res = await fetch(`${GEMINI_URL}/${MODEL}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const raw: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  await captureGeminiGeneration({
    spanName: "country_profile_enrichment",
    model: MODEL,
    input: prompt,
    output: raw,
    response: json,
    startedAt,
    maxTokens: 8192,
    temperature: 0,
  });
  return JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
}

/**
 * Re-check one country's profile against recent trusted news. A change is only
 * written when the model quotes an article that supports it (see
 * profile-update-rules.ts); the article becomes the change's public source.
 */
export async function enrichCountryProfile(slug: string): Promise<EnrichmentResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();

  const { data: profile } = await supabaseAdmin
    .from("country_profiles")
    .select("*")
    .eq("country_slug", slug)
    .single();
  const meta = countryBySlug(slug);
  if (!profile || !meta) return { slug, ok: false, fieldsUpdated: [], error: "not found" };

  const since = new Date(Date.now() - NEWS_WINDOW_DAYS * 86_400_000).toISOString();
  const { data: rows } = await supabaseAdmin
    .from("policy_updates")
    .select("url,title,summary,source,published_at")
    .eq("country_slug", slug)
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(40);

  // Only trusted outlets and government sources, official ones first.
  const trusted = (rows ?? []).filter((r) => isTrustedOutlet(r.source ?? "", r.url));
  trusted.sort(
    (a, b) =>
      Number(isOfficialSource(b.source ?? "", b.url)) -
      Number(isOfficialSource(a.source ?? "", a.url)),
  );
  const articles: EvidenceArticle[] = trusted.slice(0, 20).map((r, i) => ({
    id: `a${i + 1}`,
    url: r.url,
    title: r.title,
    summary: r.summary ?? "",
    source: r.source ?? "",
    publishedAt: r.published_at,
  }));

  const markChecked = () =>
    supabaseAdmin
      .from("country_profiles")
      .update({ last_enriched_at: now })
      .eq("country_slug", slug)
      .then(() => {});
  const log = (summary: string, extra: { changes?: Json; evidence?: Json } = {}) =>
    supabaseAdmin
      .from("country_enrichment_log")
      .insert({
        country_slug: slug,
        enrichment_type: "profile",
        articles_used: articles.map((a) => a.url),
        result_summary: summary,
        ...extra,
      })
      .then(() => {});

  if (articles.length === 0) {
    await markChecked();
    await log("No trusted news in window; nothing checked");
    return { slug, ok: true, fieldsUpdated: [] };
  }

  const snapshot: ProfileSnapshot = {
    slug,
    name: meta.name,
    blurb: profile.blurb,
    mandates: Array.isArray(profile.mandates)
      ? (profile.mandates as Array<{ label: string; value: string }>)
      : [],
    frameworks: profile.frameworks ?? [],
    policyStatus: profile.policy_status,
  };

  try {
    const verdict = judgeProposal(
      await askGemini(buildProfilePrompt(snapshot, articles)),
      snapshot,
      articles,
    );

    if (verdict.kind === "none") {
      await markChecked();
      await log("No changes needed");
      return { slug, ok: true, fieldsUpdated: [] };
    }
    if (verdict.kind === "rejected") {
      await markChecked();
      await log(`Rejected: ${verdict.reason}`);
      return { slug, ok: true, fieldsUpdated: [], rejected: verdict.reason };
    }

    const { changes, article, quote, reason } = verdict.proposal;
    const fieldsUpdated = Object.keys(changes);
    const patch: TablesUpdate<"country_profiles"> = {
      ...changes,
      updated_at: now,
      last_enriched_at: now,
      last_change_at: now,
      last_change_fields: fieldsUpdated,
      last_change_source_url: article.url,
      last_change_source_title: article.title,
      last_change_source_name: article.source,
      last_change_quote: quote,
    };
    if (changes.blurb) patch.ai_blurb_at = now;
    if (changes.policy_status) patch.ai_status_at = now;

    const { error } = await supabaseAdmin
      .from("country_profiles")
      .update(patch)
      .eq("country_slug", slug);
    if (error) throw new Error(error.message);

    await log(`Updated: ${fieldsUpdated.join(", ")} — ${reason}`, {
      changes: changes as unknown as Json,
      evidence: { url: article.url, title: article.title, source: article.source, quote },
    });
    return { slug, ok: true, fieldsUpdated };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await log(`Error: ${error}`);
    return { slug, ok: false, fieldsUpdated: [], error };
  }
}

/**
 * Countries whose trusted news is newer than their last check go first, so a
 * new mandate is picked up within a day; never-checked countries follow.
 */
export async function enrichStaleProfiles(limit = 10): Promise<EnrichmentResult[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [{ data: profiles }, { data: news }] = await Promise.all([
    supabaseAdmin.from("country_profiles").select("country_slug,last_enriched_at"),
    supabaseAdmin
      .from("policy_updates")
      .select("country_slug,created_at")
      .not("country_slug", "is", null)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);
  if (!profiles?.length) return [];

  const newest = new Map<string, string>();
  for (const row of news ?? []) {
    if (row.country_slug && !newest.has(row.country_slug)) {
      newest.set(row.country_slug, row.created_at);
    }
  }

  const due = profiles
    .map((p) => ({
      slug: p.country_slug,
      checked: p.last_enriched_at,
      latestNews: newest.get(p.country_slug) ?? null,
    }))
    .filter((p) => p.latestNews && (!p.checked || p.latestNews > p.checked))
    .sort((a, b) => (b.latestNews ?? "").localeCompare(a.latestNews ?? ""))
    .slice(0, limit);

  const results: EnrichmentResult[] = [];
  for (const row of due) results.push(await enrichCountryProfile(row.slug));
  return results;
}
