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

  let tokenForEmail: string | null = null;
  if (existingRow?.emailed_at) {
    // Draft already delivered: refresh content, keep the emailed token valid.
    await db
      .from("linkedin_drafts")
      .update({ post_text: postText, items: items as unknown as Json })
      .eq("id", existingRow.id);
    return { ok: true, emailed: false, suppressed: false, items: items.length };
  }

  // First attempt (or a retry after a failed/suppressed send): mint a fresh
  // single-use token. Only the hash is stored; the raw token lives solely in
  // the email link.
  tokenForEmail = randomBytes(24).toString("hex");
  const tokenHash = hashToken(tokenForEmail);
  if (existingRow) {
    await db
      .from("linkedin_drafts")
      .update({
        post_text: postText,
        items: items as unknown as Json,
        publish_token_hash: tokenHash,
      })
      .eq("id", existingRow.id);
  } else {
    const { error } = await db.from("linkedin_drafts").insert({
      day_key: dayKey,
      post_text: postText,
      items: items as unknown as Json,
      publish_token_hash: tokenHash,
    });
    if (error) throw new Error(error.message);
  }

  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const publishUrl = `${SITE_URL}/api/public/linkedin-publish?token=${tokenForEmail}`;

  let result;
  try {
    result = await sendTemplateEmail("linkedin-draft", recipient, {
      idempotencyKey: `linkedin-draft-${dayKey}`,
      templateData: { dateLabel, postText, publishUrl, items },
    });
  } catch (e) {
    // A previous failed send with the same key returns 409 — retry once fresh.
    if (!(e instanceof Error) || !e.message.includes("409")) throw e;
    result = await sendTemplateEmail("linkedin-draft", recipient, {
      idempotencyKey: `linkedin-draft-${dayKey}-${randomBytes(3).toString("hex")}`,
      templateData: { dateLabel, postText, publishUrl, items },
    });
  }

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

export async function linkedInFetch(path: string, init?: RequestInit): Promise<Response> {
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

/**
 * Publish a pending draft. Destination follows the saved LinkedIn settings:
 * - company_page  → post as the organization (requires w_organization_social);
 *                   falls back to personal + mention if LinkedIn denies it.
 * - personal_mention → post to the member profile with a company mention tag.
 */
export async function publishDraftByToken(token: string): Promise<PublishResult> {
  const row = await findDraftByToken(token);
  if (!row) return { ok: false, reason: "invalid-token" };
  if (row.status === "published" && row.linkedin_post_urn) {
    return { ok: true, urn: row.linkedin_post_urn, already: true };
  }

  const { getLinkedInSettings } = await import("./linkedin-settings.server");
  const settings = await getLinkedInSettings();

  const me = await linkedInFetch("/v2/userinfo");
  if (!me.ok) {
    const body = await me.text();
    console.error(`LinkedIn userinfo failed [${me.status}]: ${body}`);
    return { ok: false, reason: "provider-error", detail: `userinfo ${me.status}: ${body}` };
  }
  const { sub } = (await me.json()) as { sub: string };

  const COMPANY_NAME = "Global Bioenergy Watch";
  const companyUrn = `urn:li:organization:${settings.companyOrgId}`;

  // Personal posts tag the company page via a mention annotation so every
  // post still links back to the page even without org posting rights.
  const text = row.post_text.includes(COMPANY_NAME)
    ? row.post_text
    : `${row.post_text}\n\nFollow ${COMPANY_NAME} for daily updates.`;
  const mentionStart = text.lastIndexOf(COMPANY_NAME);
  const shareCommentary: Record<string, unknown> = {
    text,
    attributes:
      mentionStart >= 0
        ? [
            {
              start: mentionStart,
              length: COMPANY_NAME.length,
              value: {
                "com.linkedin.common.CompanyAttributedEntity": {
                  company: companyUrn,
                },
              },
            },
          ]
        : [],
  };

  const postUgc = (author: string, isOrg: boolean) =>
    linkedInFetch("/v2/ugcPosts", {
      method: "POST",
      body: JSON.stringify({
        author,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: isOrg ? { text: row.post_text } : shareCommentary,
            shareMediaCategory: "NONE",
          },
        },
        // LinkedIn uses MemberNetworkVisibility PUBLIC for org posts too.
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });

  let res: Response;
  if (settings.postingMode === "company_page") {
    res = await postUgc(companyUrn, true);
    if (!res.ok) {
      // Org posting unavailable (missing w_organization_social or the account
      // is not a page admin) — fall back to personal posting with mention.
      const body = await res.text();
      console.warn(
        `LinkedIn org post failed [${res.status}], falling back to personal profile: ${body}`,
      );
      res = await postUgc(`urn:li:person:${sub}`, false);
    }
  } else {
    res = await postUgc(`urn:li:person:${sub}`, false);
  }
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
