// Server-only: generates the daily LinkedIn flyer image using the user's
// own Google Gemini API key. Never import from client components.

import type { Json } from "@/integrations/supabase/types";

export interface FlyerItem {
  title: string;
  url: string;
  summary: string;
  source: string;
  countryName: string | null;
  fuels: string[];
}

const MODEL = "gemini-3.1-flash-image";
const SITE_URL = "https://globalbioenergywatch.org";

async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Top 5 updates from the last 48 hours, falling back to the freshest five. */
async function topItems(): Promise<FlyerItem[]> {
  const db = await adminDb();
  const select = "url,title,summary,source,country_name,fuels,published_at,created_at";
  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

  const fresh = await db
    .from("policy_updates")
    .select(select)
    .gte("created_at", since)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(5);

  const rows = fresh.data?.length
    ? fresh.data
    : (
        await db
          .from("policy_updates")
          .select(select)
          .order("published_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(5)
      ).data;

  return (rows ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    summary: r.summary ?? "",
    source: r.source ?? "",
    countryName: r.country_name,
    fuels: r.fuels ?? [],
  }));
}

function buildPrompt(items: FlyerItem[], dateLabel: string): string {
  const headlines = items
    .map(
      (it, i) =>
        `${i + 1}. ${it.title} — ${it.source}${it.countryName ? ` (${it.countryName})` : ""}`,
    )
    .join("\n");

  return [
    "Generate a professional, square LinkedIn-ready infographic for a bioenergy policy tracker.",
    "",
    "Brand and layout:",
    "- Title at top: 'Global Bioenergy Watch' in a bold, modern sans-serif font.",
    "- Subtitle: 'Daily global bioenergy policy flyer — " + dateLabel + "'.",
    "- Dark navy / editorial gradient background (#0b1220 to #16213e) with subtle teal and blue accent lines.",
    "- Five clean numbered headline cards stacked vertically. Each card shows the number, the headline title, and a small source/country tag.",
    "- Footer line: 'globalbioenergywatch.org' and a small 'AI-generated — cross-verify' disclaimer.",
    "- Modern, high-contrast, readable, minimalist, no clutter, no photos of people.",
    "",
    "Use these exact headlines as the content of the five cards:",
    headlines,
    "",
    "Output a single square PNG image. Render text clearly and legibly.",
  ].join("\n");
}

function extractImageBase64(responseBody: unknown): string | null {
  const body = responseBody as Record<string, unknown>;

  // New "interactions" endpoint returns the last generated image directly.
  const outputImage = body?.["output_image"];
  if (outputImage && typeof (outputImage as Record<string, unknown>)?.["data"] === "string") {
    return (outputImage as { data: string }).data;
  }

  // Fallback to legacy generateContent candidate shape.
  const candidates = body?.["candidates"];
  if (!Array.isArray(candidates)) return null;
  for (const candidate of candidates) {
    const content = (candidate as Record<string, unknown>)?.["content"];
    const parts = (content as Record<string, unknown> | undefined)?.["parts"];
    if (!Array.isArray(parts)) continue;
    for (const part of parts) {
      const inlineData = (part as Record<string, unknown>)?.["inlineData"];
      if (inlineData && typeof (inlineData as Record<string, unknown>)?.["data"] === "string") {
        return (inlineData as { data: string }).data;
      }
    }
  }
  return null;
}


/** Fallback: Lovable AI Gateway image model, used when the user's Gemini key is unavailable. */
async function generateViaGateway(prompt: string): Promise<{ data?: string; error?: string }> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { error: "no gateway key" };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { error: `Gateway failed [${res.status}]: ${body.slice(0, 300)}` };
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }>;
  };
  const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  const b64 = url?.split(",")[1];
  return b64 ? { data: b64 } : { error: "Gateway response had no image" };
}

export type GenerateResult =
  | {
      ok: true;
      dayKey: string;
      imageUrl: string;
      items: FlyerItem[];
      alreadyExisted: boolean;
    }
  | {
      ok: false;
      error: string;
    };


export async function generateFlyerImage(force = false): Promise<GenerateResult> {
  const apiKey = process.env["GEMINI_API_KEY"];


  const db = await adminDb();
  const dayKey = new Date().toISOString().slice(0, 10);

  if (!force) {
    const existing = await db
      .from("flyer_generations")
      .select("image_base64, items_json")
      .eq("day_key", dayKey)
      .maybeSingle();
    if (existing.data?.image_base64) {
      return {
        ok: true,
        dayKey,
        imageUrl: `${SITE_URL}/api/public/flyer-image?day=${dayKey}`,
        items: ((existing.data.items_json as unknown) as FlyerItem[] | undefined) ?? [],
        alreadyExisted: true,
      };
    }

  }

  const items = await topItems();
  if (items.length === 0) {
    return { ok: false, error: "No policy updates available to compose a flyer" };
  }

  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const prompt = buildPrompt(items, dateLabel);

  let imageBase64: string | null = null;
  let lastError = "";

  if (apiKey) {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: MODEL,
        input: [{ type: "text", text: prompt }],
      }),
    });
    if (res.ok) {
      imageBase64 = extractImageBase64((await res.json()) as unknown);
      if (!imageBase64) lastError = "Gemini response did not contain an image";
    } else {
      const body = await res.text().catch(() => "");
      lastError = `Gemini API failed [${res.status}]: ${body.slice(0, 300)}`;
    }
  } else {
    lastError = "GEMINI_API_KEY is not configured";
  }

  if (!imageBase64) {
    const fallback = await generateViaGateway(prompt);
    if (fallback.data) imageBase64 = fallback.data;
    else lastError = `${lastError}; fallback: ${fallback.error}`;
  }

  if (!imageBase64) {
    return { ok: false, error: lastError };
  }

  const upsert = await db
    .from("flyer_generations")
    .upsert(
      {
        day_key: dayKey,
        image_base64: imageBase64,
        prompt,
        items_json: items as unknown as Json,
      },
      { onConflict: "day_key" },
    )
    .select("items_json")
    .single();

  if (upsert.error) {
    return { ok: false, error: `Failed to save flyer: ${upsert.error.message}` };
  }

  return {
    ok: true,
    dayKey,
    imageUrl: `${SITE_URL}/api/public/flyer-image?day=${dayKey}`,
    items: ((upsert.data?.items_json as unknown) as FlyerItem[] | undefined) ?? items,
    alreadyExisted: false,
  };

}

export async function emailFlyer(recipient: string): Promise<{
  ok: true;
  emailed: boolean;
  suppressed: boolean;
  imageUrl: string;
  dayKey: string;
} | { ok: false; error: string }> {
  const generated = await generateFlyerImage();
  if (!generated.ok) return generated;

  const { sendTemplateEmail } = await import("./email-templates/send-email");
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const result = await sendTemplateEmail("gemini-flyer", recipient, {
    idempotencyKey: `gemini-flyer-${generated.dayKey}`,
    templateData: {
      dateLabel,
      imageUrl: generated.imageUrl,
      items: generated.items,
    },
  });

  const db = await adminDb();
  await db
    .from("flyer_generations")
    .update({ emailed_to: recipient, emailed_at: new Date().toISOString() })
    .eq("day_key", generated.dayKey);

  return {
    ok: true,
    emailed: result.sent,
    suppressed: !result.sent,
    imageUrl: generated.imageUrl,
    dayKey: generated.dayKey,
  };
}
