import { createHash, randomBytes } from "crypto";
import type { Json } from "@/integrations/supabase/types";
import { sendTemplateEmail } from "./email-templates/send-email";

// Server-only helpers for the daily LinkedIn draft → one-click publish flow.
// Reads LOVABLE_API_KEY, LINKEDIN_API_KEY and SUPABASE_SERVICE_ROLE_KEY —
// never import this module from client-reachable code.

const GATEWAY = "https://connector-gateway.lovable.dev/linkedin";
const MODEL = "google/gemini-3-flash-preview";
export const SITE_URL = "https://globalbioenergywatch.org";

export interface DraftItem {
  title: string;
  url: string;
  summary: string;
  source: string;
  countryName: string | null;
  fuels: string[];
}

interface DraftRow {
  id: string;
  day_key: string;
  post_text: string;
  items: DraftItem[];
  status: "pending" | "published";
  publish_token_hash: string;
  linkedin_post_urn: string | null;
  emailed_at: string | null;
  published_at: string | null;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Top 5 updates from the last 48 hours, falling back to the freshest five. */
async function topItems(): Promise<DraftItem[]> {
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

function buildPrompt(items: DraftItem[]) {
  const list = items
    .map(
      (it, i) =>
        `${i + 1}. ${it.title} — ${it.source}${it.countryName ? ` (${it.countryName})` : ""}\n   Summary: ${it.summary || "n/a"}`,
    )
    .join("\n");
  return [
    "You are the editorial voice of Global Bioenergy Watch, an independent tracker of worldwide biofuel and bioenergy policy.",
    "Write ONE LinkedIn post (900–1400 characters) covering today's most important global bioenergy policy and market developments, based on these verified headlines:",
    "",
    list,
    "",
    "Rules:",
    "- Plain text only (LinkedIn renders no markdown). No **, no [links](url).",
    "- Open with one strong hook line, then a blank line.",
    "- Then 4–5 short lines, one per development, in the form: '• <country> — <what happened> (<outlet>)'. Keep each under 120 characters.",
    "- Close with one takeaway sentence for fuel producers, traders and policymakers.",
    "- End with a line of 4–6 hashtags such as #biofuels #bioenergy #SAF #ethanol #policy.",
    "- Very last line exactly: Full tracker: https://globalbioenergywatch.org",
    "- Neutral, precise, analyst tone. Do not invent facts beyond the headlines.",
    "Output ONLY the post text.",
  ].join("\n");
}

async function composePost(items: DraftItem[]): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: buildPrompt(items) }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway failed [${res.status}]: ${body}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("AI gateway returned no content");
  return text;
}

export type DraftResult =
  | { ok: true; emailed: boolean; suppressed: boolean; items: number }
  | { ok: true; skipped: "already-published" };

/**
 * Build today's draft (idempotent per day), store it with a single-use
 * publish token, and email the review copy to the owner.
 */
export async function createAndEmailDraft(recipient: string): Promise<DraftResult> {
  const db = await adminDb();
  const dayKey = new Date().toISOString().slice(0, 10);

  const existing = await db
    .from("linkedin_drafts")
    .select("*")
    .eq("day_key", dayKey)
    .maybeSingle();
  const existingRow = (existing.data ?? null) as DraftRow | null;
  if (existingRow?.status === "published") return { ok: true, skipped: "already-published" };

  const items = await topItems();
  if (items.length === 0) throw new Error("No policy updates available to compose a post");
  const postText = await composePost(items);

  let tokenHash: string;
  let tokenForEmail: string | null = null;
  if (existingRow) {
    // Keep the already-emailed token valid when refreshing the draft text.
    tokenHash = existingRow.publish_token_hash;
    await db
      .from("linkedin_drafts")
      .update({ post_text: postText, items: items as unknown as Json })
      .eq("id", existingRow.id);
  } else {
    tokenForEmail = randomBytes(24).toString("hex");
    tokenHash = hashToken(tokenForEmail);
    const { error } = await db.from("linkedin_drafts").insert({
      day_key: dayKey,
      post_text: postText,
      items: items as unknown as Json,
      publish_token_hash: tokenHash,
    });
    if (error) throw new Error(error.message);
  }

  // Email is sent once per day (the token is only known on first creation).
  if (!tokenForEmail || existingRow?.emailed_at) {
    return { ok: true, emailed: false, suppressed: false, items: items.length };
  }

  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const publishUrl = `${SITE_URL}/api/public/linkedin-publish?token=${tokenForEmail}`;

  const result = await sendTemplateEmail("linkedin-draft", recipient, {
    idempotencyKey: `linkedin-draft-${dayKey}`,
    templateData: { dateLabel, postText, publishUrl, items },
  });

  if (result.sent) {
    await db.from("linkedin_drafts").update({ emailed_at: new Date().toISOString() }).eq("day_key", dayKey);
  }
  return {
    ok: true,
    emailed: result.sent,
    suppressed: !result.sent,
    items: items.length,
  };
}

export interface DraftPreview {
  dayKey: string;
  postText: string;
  status: "pending" | "published";
  linkedinPostUrn: string | null;
}

async function findDraftByToken(token: string): Promise<DraftRow | null> {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const db = await adminDb();
  const { data } = await db
    .from("linkedin_drafts")
    .select("*")
    .eq("publish_token_hash", hashToken(token))
    .maybeSingle();
  return (data ?? null) as DraftRow | null;
}

export async function previewDraftByToken(token: string): Promise<DraftPreview | null> {
  const row = await findDraftByToken(token);
  if (!row) return null;
  return {
    dayKey: row.day_key,
    postText: row.post_text,
    status: row.status,
    linkedinPostUrn: row.linkedin_post_urn,
  };
}

async function linkedInFetch(path: string, init?: RequestInit): Promise<Response> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["LINKEDIN_API_KEY"];
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!connectionKey) throw new Error("LINKEDIN_API_KEY is not configured");
  return fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
      "X-Restli-Protocol-Version": "2.0.0",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

export type PublishResult =
  | { ok: true; urn: string; already: boolean }
  | { ok: false; reason: "invalid-token" | "provider-error"; detail?: string };

/** Publish a pending draft to the connected LinkedIn member profile. */
export async function publishDraftByToken(token: string): Promise<PublishResult> {
  const row = await findDraftByToken(token);
  if (!row) return { ok: false, reason: "invalid-token" };
  if (row.status === "published" && row.linkedin_post_urn) {
    return { ok: true, urn: row.linkedin_post_urn, already: true };
  }

  const me = await linkedInFetch("/v2/userinfo");
  if (!me.ok) {
    const body = await me.text();
    console.error(`LinkedIn userinfo failed [${me.status}]: ${body}`);
    return { ok: false, reason: "provider-error", detail: `userinfo ${me.status}: ${body}` };
  }
  const { sub } = (await me.json()) as { sub: string };

  const res = await linkedInFetch("/v2/ugcPosts", {
    method: "POST",
    body: JSON.stringify({
      author: `urn:li:person:${sub}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: row.post_text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`LinkedIn ugcPosts failed [${res.status}]: ${body}`);
    return { ok: false, reason: "provider-error", detail: `${res.status}: ${body}` };
  }
  const { id } = (await res.json()) as { id: string };

  const db = await adminDb();
  await db
    .from("linkedin_drafts")
    .update({ status: "published", linkedin_post_urn: id, published_at: new Date().toISOString() })
    .eq("id", row.id)
    .eq("status", "pending");

  return { ok: true, urn: id, already: false };
}
