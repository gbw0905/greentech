import { createHash, timingSafeEqual } from "crypto";

// Server-only helpers for the LinkedIn posting settings page.
// Reads LINKEDIN_SETTINGS_ADMIN_KEY and SUPABASE_SERVICE_ROLE_KEY —
// never import this module from client-reachable code.

export type PostingMode = "personal_mention" | "company_page";

export interface LinkedInSettings {
  companyPageUrl: string;
  companyOrgId: string;
  postingMode: PostingMode;
  updatedAt: string;
}

export const DEFAULT_SETTINGS: Omit<LinkedInSettings, "updatedAt"> = {
  companyPageUrl: "https://www.linkedin.com/company/137244598/",
  companyOrgId: "137244598",
  postingMode: "personal_mention",
};

async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Constant-time check of the settings admin key. */
export function verifyAdminKey(key: string): boolean {
  const expected = process.env["LINKEDIN_SETTINGS_ADMIN_KEY"];
  if (!expected || !key) return false;
  const a = createHash("sha256").update(key).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Extract the numeric LinkedIn organization ID from a company page URL. */
export function extractOrgId(url: string): string | null {
  const m = url.match(/company\/(\d+)/);
  return m?.[1] ?? null;
}

export async function getLinkedInSettings(): Promise<LinkedInSettings> {
  const db = await adminDb();
  const { data } = await db
    .from("linkedin_settings")
    .select("company_page_url,company_org_id,posting_mode,updated_at")
    .eq("id", true)
    .maybeSingle();
  if (!data) return { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };
  return {
    companyPageUrl: data.company_page_url,
    companyOrgId: data.company_org_id,
    postingMode: data.posting_mode as PostingMode,
    updatedAt: data.updated_at,
  };
}

export async function saveLinkedInSettings(input: {
  companyPageUrl: string;
  postingMode: PostingMode;
}): Promise<LinkedInSettings> {
  const url = input.companyPageUrl.trim();
  if (!/^https:\/\/(www\.)?linkedin\.com\/company\/[A-Za-z0-9\-_%]+\/?$/.test(url)) {
    throw new Error(
      "Enter a valid LinkedIn company page URL, e.g. https://www.linkedin.com/company/137244598/",
    );
  }
  // Prefer the numeric ID embedded in the URL; keep the previous one otherwise
  // (vanity URLs like /company/globalbioenergywatch carry no digits).
  const current = await getLinkedInSettings();
  const orgId = extractOrgId(url) ?? current.companyOrgId;

  const db = await adminDb();
  const { data, error } = await db
    .from("linkedin_settings")
    .upsert({
      id: true,
      company_page_url: url,
      company_org_id: orgId,
      posting_mode: input.postingMode,
      updated_at: new Date().toISOString(),
    })
    .select("company_page_url,company_org_id,posting_mode,updated_at")
    .single();
  if (error) throw new Error(`Failed to save settings: ${error.message}`);
  return {
    companyPageUrl: data.company_page_url,
    companyOrgId: data.company_org_id,
    postingMode: data.posting_mode as PostingMode,
    updatedAt: data.updated_at,
  };
}

/**
 * Whether the connected LinkedIn account can post to an organization page.
 * Uses the organization admin ACL endpoint — a 403 means the managed app
 * lacks w_organization_social and company-page posting is unavailable.
 */
export async function checkCompanyPostingAvailable(
  linkedInFetch: (path: string, init?: RequestInit) => Promise<Response>,
): Promise<{ available: boolean; detail: string }> {
  const res = await linkedInFetch(
    "/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED",
  );
  if (res.ok) return { available: true, detail: "Organization admin access confirmed." };
  const body = await res.text();
  return { available: false, detail: `LinkedIn denied organization access [${res.status}]: ${body}` };
}
