/**
 * Rules for automatic country-profile updates (map colour, mandates, pop-up
 * text). The AI may only change a profile when it quotes, word for word, an
 * article from our trusted news archive that supports the change. Anything it
 * cannot back with a quote is rejected. Pure functions — no I/O — so the rules
 * can be tested on their own.
 */

export const POLICY_STATUSES = [
  "Mandated",
  "Policy framework",
  "In development",
  "No framework",
] as const;
export type ProfileStatus = (typeof POLICY_STATUSES)[number];

export interface ProfileSnapshot {
  slug: string;
  name: string;
  blurb: string | null;
  mandates: Array<{ label: string; value: string }>;
  frameworks: string[];
  policyStatus: string | null;
}

export interface EvidenceArticle {
  /** Short id used in the prompt, e.g. "a3". */
  id: string;
  url: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string | null;
}

export interface ProfileChanges {
  blurb?: string;
  mandates?: Array<{ label: string; value: string }>;
  frameworks?: string[];
  policy_status?: ProfileStatus;
}

export interface AcceptedProposal {
  changes: ProfileChanges;
  article: EvidenceArticle;
  quote: string;
  reason: string;
}

export type ProposalVerdict =
  | { kind: "none" }
  | { kind: "accepted"; proposal: AcceptedProposal }
  | { kind: "rejected"; reason: string };

export function buildProfilePrompt(profile: ProfileSnapshot, articles: EvidenceArticle[]): string {
  const news = articles
    .map(
      (a) =>
        `[${a.id}] ${a.publishedAt?.slice(0, 10) ?? "undated"} · ${a.source}\nTitle: ${a.title}\nSummary: ${a.summary || "(none)"}`,
    )
    .join("\n\n");
  return `You maintain a factual biofuel-policy profile for ${profile.name}. Decide whether the news below proves that the profile is now out of date.

Current profile:
- policy_status: ${profile.policyStatus ?? "(none)"}
- blurb: ${profile.blurb ?? "(none)"}
- mandates: ${JSON.stringify(profile.mandates)}
- frameworks: ${JSON.stringify(profile.frameworks)}

policy_status meanings:
- "Mandated": a binding biofuel blending mandate or obligation is in force.
- "Policy framework": biofuel policy exists (targets, incentives, standards) but no binding blend mandate.
- "In development": a mandate or framework is proposed, drafted or announced but not yet in force.
- "No framework": no national biofuel policy.

News from trusted outlets and government sources (newest first):
${news || "(no recent news)"}

Rules:
1. Change the profile ONLY if one article clearly states a new fact about ${profile.name}'s own national biofuel policy (adopted, enacted, in force, raised, lowered, delayed or repealed).
2. Proposals, consultations, drafts, industry requests, forecasts and opinions do NOT change a mandate value. They may only move "No framework" to "In development".
3. Keep every unchanged mandate exactly as it is. When you return "mandates", return the full updated list.
4. You must copy a supporting quote of at least 8 words, word for word, from that article's Title or Summary above.
5. If nothing qualifies, return {"changes": {}}.

Return JSON only, in this shape:
{"changes": {"policy_status"?: string, "blurb"?: string, "mandates"?: [{"label": string, "value": string}], "frameworks"?: [string]}, "article": "a1", "quote": "exact words", "reason": "one sentence"}`;
}

const norm = (text: string) =>
  text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

const isText = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= max;

/** Check the model's answer against the rules; never trust it blindly. */
export function judgeProposal(
  raw: unknown,
  profile: ProfileSnapshot,
  articles: EvidenceArticle[],
): ProposalVerdict {
  if (!raw || typeof raw !== "object") return { kind: "rejected", reason: "not a JSON object" };
  const answer = raw as Record<string, unknown>;
  const input = (answer["changes"] ?? {}) as Record<string, unknown>;
  if (typeof input !== "object" || Array.isArray(input)) {
    return { kind: "rejected", reason: "changes is not an object" };
  }

  const changes: ProfileChanges = {};
  if (input["policy_status"] !== undefined) {
    const status = input["policy_status"];
    if (!POLICY_STATUSES.includes(status as ProfileStatus)) {
      return { kind: "rejected", reason: `unknown policy_status ${String(status)}` };
    }
    if (status !== profile.policyStatus) changes.policy_status = status as ProfileStatus;
  }
  if (input["blurb"] !== undefined) {
    if (!isText(input["blurb"], 400))
      return { kind: "rejected", reason: "blurb missing or too long" };
    if (input["blurb"] !== profile.blurb) changes.blurb = input["blurb"].trim();
  }
  if (input["mandates"] !== undefined) {
    const list = input["mandates"];
    if (
      !Array.isArray(list) ||
      list.length > 14 ||
      !list.every(
        (m) =>
          m &&
          typeof m === "object" &&
          isText((m as Record<string, unknown>)["label"], 60) &&
          isText((m as Record<string, unknown>)["value"], 200),
      )
    ) {
      return { kind: "rejected", reason: "mandates malformed" };
    }
    const mandates = (list as Array<{ label: string; value: string }>).map((m) => ({
      label: m.label.trim(),
      value: m.value.trim(),
    }));
    if (mandates.length === 0 && profile.mandates.length > 0) {
      return { kind: "rejected", reason: "would delete every mandate" };
    }
    if (JSON.stringify(mandates) !== JSON.stringify(profile.mandates)) changes.mandates = mandates;
  }
  if (input["frameworks"] !== undefined) {
    const list = input["frameworks"];
    if (!Array.isArray(list) || list.length > 14 || !list.every((f) => isText(f, 60))) {
      return { kind: "rejected", reason: "frameworks malformed" };
    }
    const frameworks = (list as string[]).map((f) => f.trim());
    if (JSON.stringify(frameworks) !== JSON.stringify(profile.frameworks)) {
      changes.frameworks = frameworks;
    }
  }

  if (Object.keys(changes).length === 0) return { kind: "none" };

  const article = articles.find((a) => a.id === answer["article"]);
  if (!article) return { kind: "rejected", reason: "no valid article id for the change" };
  const quote = typeof answer["quote"] === "string" ? answer["quote"].trim() : "";
  if (quote.split(/\s+/).length < 8)
    return { kind: "rejected", reason: "supporting quote too short" };
  if (!norm(`${article.title} ${article.summary}`).includes(norm(quote))) {
    return { kind: "rejected", reason: "quote not found in the cited article" };
  }
  const reason = typeof answer["reason"] === "string" ? answer["reason"].slice(0, 300) : "";
  return { kind: "accepted", proposal: { changes, article, quote, reason } };
}
