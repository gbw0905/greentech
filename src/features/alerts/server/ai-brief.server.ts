// Generates and caches AI briefs for policy/market updates.

import type { BriefSource } from "@/features/alerts/contracts";

const MODEL = "gemini-2.5-flash";

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

  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "You are a senior bioenergy policy analyst writing concise, factual briefs for an industry newsletter.",
            },
          ],
        },
        contents: [{ role: "user", parts: [{ text: prompt(update) }] }],
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI brief failed (${res.status}): ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("AI brief returned empty text");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("policy_updates")
    .update({ ai_brief: text, ai_brief_at: new Date().toISOString() })
    .eq("id", update.id);

  return text;
}
