// Server-only: generates and caches AI briefs for policy/market updates.

const MODEL = "google/gemini-3-flash";

export interface BriefSource {
  id: string;
  title: string;
  summary: string | null;
  source: string | null;
  url: string;
  category: string;
  country_name: string | null;
  region: string | null;
  fuels: string[] | null;
  published_at: string | null;
  ai_brief?: string | null;
}

function prompt(u: BriefSource) {
  return [
    `Write a professional 200-300 word intelligence brief for bioenergy market analysts about the following ${u.category === "market" ? "market" : "government policy"} update.`,
    "",
    `Headline: ${u.title}`,
    `Jurisdiction: ${u.country_name ?? u.region ?? "Global"}`,
    `Fuels: ${(u.fuels ?? []).join(", ") || "not specified"}`,
    `Outlet: ${u.source ?? "unknown"}`,
    `Published: ${u.published_at ?? "unknown"}`,
    `Known description: ${u.summary ?? "(none provided)"}`,
    "",
    "Cover: what changed, the mechanism or instrument involved, who is affected, likely market or compliance impact, and what to watch next.",
    "Rules: plain prose, no markdown headings, no bullet points, no preamble, 200-300 words.",
    "Do not invent specific numbers, dates or quotes that are not implied by the information above.",
  ].join("\n");
}

/** Returns the cached brief when present, otherwise generates and stores one. */
export async function getOrCreateBrief(update: BriefSource): Promise<string> {
  if (update.ai_brief && update.ai_brief.length > 200) return update.ai_brief;

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a senior bioenergy policy analyst writing concise, factual briefs for an industry newsletter.",
        },
        { role: "user", content: prompt(update) },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI brief failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("AI brief returned empty text");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("policy_updates")
    .update({ ai_brief: text, ai_brief_at: new Date().toISOString() })
    .eq("id", update.id);

  return text;
}
