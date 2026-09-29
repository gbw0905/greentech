// Server-only: builds analyst summaries of a heat map's current view.

import { sourcesFor } from "@/shared/data/data-sources";
import type { SummaryRequest } from "@/features/chart-summary/contracts";

const MODEL = "google/gemini-3.7-flash";

function prompt(r: SummaryRequest) {
  const table = r.rows
    .map((row, i) => {
      const bits = [`${i + 1}. ${row.label}`, `${r.measureLabel}: ${row.value}`];
      if (row.sub) bits.push(`detail: ${row.sub}`);
      if (typeof row.price === "number") bits.push(`share price: ${row.price}`);
      if (typeof row.changePct === "number")
        bits.push(`1-day change: ${row.changePct.toFixed(2)}%`);
      return bits.join(" | ");
    })
    .join("\n");

  return [
    `Write a comprehensive 350-450 word analyst summary of the following view of the "${r.panel}" chart on Global Bioenergy Watch.`,
    "",
    `Measure shown: ${r.measureLabel} (${r.unit})`,
    `Filters applied: ${r.filterLabel}`,
    `Entities shown: ${r.shown} of ${r.total} tracked in this panel`,
    "",
    "Ranked rows:",
    table,
    "",
    "Cover: who leads and by how much, the gap to the rest of the field, notable laggards, the 1-day market trend across the listed names (advancers vs decliners, best and worst movers), any country or category concentration visible in the data, and what an analyst should watch next.",
    "",
    "Data sources behind these figures (reference them naturally where relevant, e.g. when noting where capacity or price figures come from):",
    sourcesFor(r.panel)
      .map((s) => `- ${s}`)
      .join("\n"),
    "",
    "Rules: plain prose, no markdown headings, no bullet points, no preamble, 350-450 words.",
    "Use only the figures given above. Do not invent numbers, dates, deals or quotes.",
    "End with one short closing sentence stating that figures are compiled by Global Bioenergy Watch from the sources listed and should be cross-verified.",
  ].join("\n");
}

export async function generateChartSummary(req: SummaryRequest): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this site.");

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
            "You are a senior bioenergy and energy-markets analyst writing concise, factual briefings for industry readers.",
        },
        { role: "user", content: prompt(req) },
      ],
    }),
  });

  if (res.status === 429)
    throw new Error("Too many summary requests right now — please try again in a minute.");
  if (res.status === 402)
    throw new Error("AI credits for this site are exhausted. Please try again later.");
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Summary failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("The summary came back empty — please try again.");
  return text;
}
