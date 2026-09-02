import { createServerFn } from "@tanstack/react-start";

export interface MarketOutlookPoint {
  t: number;
  c: number;
}

export interface MarketOutlookInput {
  label: string;
  symbol: string;
  unit: string;
  price: number;
  change: number;
  changePct: number;
  prevClose: number;
  series: MarketOutlookPoint[];
}

function valid(input: MarketOutlookInput): MarketOutlookInput {
  if (!input || typeof input.symbol !== "string" || typeof input.price !== "number") {
    throw new Error("Invalid market data");
  }
  return { ...input, series: (input.series ?? []).slice(0, 45) };
}

export const marketOutlookFn = createServerFn({ method: "POST" })
  .inputValidator(valid)
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured for this site.");

    const first = data.series[0]?.c ?? data.price;
    const last = data.series[data.series.length - 1]?.c ?? data.price;
    const periodPct = first ? ((last - first) / first) * 100 : 0;
    const lo = data.series.length ? Math.min(...data.series.map((p) => p.c)) : data.price;
    const hi = data.series.length ? Math.max(...data.series.map((p) => p.c)) : data.price;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a senior energy and macro markets analyst writing concise, factual outlooks for industry readers of Global Bioenergy Watch.",
          },
          {
            role: "user",
            content: [
              `Write a ~150 word market outlook for ${data.label} (${data.symbol}).`,
              "",
              `Latest level: ${data.price} ${data.unit === "index" ? "points" : "USD " + data.unit}`,
              `1-day change: ${data.change >= 0 ? "+" : ""}${data.change} (${data.changePct >= 0 ? "+" : ""}${data.changePct.toFixed(2)}%)`,
              `Previous close: ${data.prevClose}`,
              `30-day change: ${periodPct >= 0 ? "+" : ""}${periodPct.toFixed(2)}%`,
              `30-day range: ${lo.toFixed(2)} – ${hi.toFixed(2)}`,
              "",
              "Cover: the current trend direction, what the 30-day range suggests about volatility, the near-term drivers a bioenergy market reader should watch, and how this benchmark typically relates to biofuel and feedstock economics.",
              "Rules: plain prose, no markdown, no headings, no bullets, no preamble. Use only the figures given above — do not invent numbers, dates or events. About 150 words.",
            ].join("\n"),
          },
        ],
      }),
    });

    if (res.status === 429)
      throw new Error("Too many requests right now — please try again in a minute.");
    if (res.status === 402)
      throw new Error("AI credits for this site are exhausted. Please try again later.");
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Outlook failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("The outlook came back empty — please try again.");
    return { outlook: text };
  });
