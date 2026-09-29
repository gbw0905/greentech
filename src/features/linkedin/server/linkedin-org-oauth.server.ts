import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { SITE_URL } from "./linkedin-draft.server";

// LinkedIn OAuth app flow for direct company-page posting via the
// w_organization_social scope. Reads LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
// and LINKEDIN_OAUTH_STATE_SECRET — never import this module from
// client-reachable code; call it from server routes or server functions only.

export const ORG_OAUTH_SCOPES = [
  "openid",
  "profile",
  "email",
  "w_member_social",
  "r_organization_social",
  "w_organization_social",
].join(" ");

export const ORG_OAUTH_CALLBACK_PATH = "/api/public/linkedin/oauth/callback";

const LINKEDIN_API = "https://api.linkedin.com";
const LINKEDIN_OAUTH = "https://www.linkedin.com/oauth/v2";

interface TokenRow {
  access_token: string;
  access_token_expires_at: string;
  refresh_token: string | null;
  refresh_token_expires_at: string | null;
  scope: string | null;
  person_urn: string | null;
  person_name: string | null;
  org_id: string | null;
  org_name: string | null;
}

export interface OrgConnectionStatus {
  configured: boolean;
  connected: boolean;
  orgId: string | null;
  orgName: string | null;
  connectedBy: string | null;
  accessTokenExpiresAt: string | null;
}

async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export function isCustomAppConfigured(): boolean {
  return Boolean(process.env["LINKEDIN_CLIENT_ID"] && process.env["LINKEDIN_CLIENT_SECRET"]);
}

function appCredentials() {
  const clientId = process.env["LINKEDIN_CLIENT_ID"];
  const clientSecret = process.env["LINKEDIN_CLIENT_SECRET"];
  if (!clientId || !clientSecret) {
    throw new Error(
      "Custom LinkedIn app is not configured yet (LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET missing)",
    );
  }
  return { clientId, clientSecret };
}

export function redirectUri(): string {
  return `${SITE_URL}${ORG_OAUTH_CALLBACK_PATH}`;
}

// --- OAuth state (stateless, HMAC-signed, 10 minute validity) ---

function signState(ts: number, nonce: string): string {
  const secret = process.env["LINKEDIN_OAUTH_STATE_SECRET"] ?? "";
  return createHmac("sha256", secret).update(`${ts}.${nonce}`).digest("hex");
}

export function buildAuthorizeUrl(): string {
  const { clientId } = appCredentials();
  const ts = Date.now();
  const nonce = randomBytes(12).toString("hex");
  const state = `${ts}.${nonce}.${signState(ts, nonce)}`;
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri(),
    scope: ORG_OAUTH_SCOPES,
    state,
  });
  return `${LINKEDIN_OAUTH}/authorization?${params.toString()}`;
}

export function verifyState(state: string): boolean {
  const parts = state.split(".");
  if (parts.length !== 3) return false;
  const [tsRaw, nonce, sig] = parts;
  const ts = Number(tsRaw);
  if (!Number.isFinite(ts) || !nonce || !sig) return false;
  if (Math.abs(Date.now() - ts) > 10 * 60 * 1000) return false;
  const expected = signState(ts, nonce);
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

// --- LinkedIn API calls (direct, using the custom app's tokens) ---

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
}

async function tokenRequest(params: Record<string, string>): Promise<LinkedInTokenResponse> {
  const { clientId, clientSecret } = appCredentials();
  const res = await fetch(`${LINKEDIN_OAUTH}/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      ...params,
    }).toString(),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LinkedIn token request failed [${res.status}]: ${body}`);
  }
  return (await res.json()) as LinkedInTokenResponse;
}

async function fetchPerson(accessToken: string): Promise<{ urn: string; name: string }> {
  const res = await fetch(`${LINKEDIN_API}/v2/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LinkedIn userinfo failed [${res.status}]: ${body}`);
  }
  const data = (await res.json()) as { sub?: string; name?: string };
  if (!data.sub) throw new Error("LinkedIn userinfo returned no member id");
  return { urn: `urn:li:person:${data.sub}`, name: data.name ?? "Unknown member" };
}

async function fetchAdminOrgs(accessToken: string): Promise<{ orgId: string; orgName: string }[]> {
  const url =
    `${LINKEDIN_API}/v2/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED` +
    `&projection=(elements*(organizationalTarget~(id,localizedName)))`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LinkedIn organization lookup failed [${res.status}]: ${body}`);
  }
  const data = (await res.json()) as {
    elements?: {
      organizationalTarget?: string;
      "organizationalTarget~"?: { id?: number; localizedName?: string };
    }[];
  };
  return (data.elements ?? [])
    .map((el) => {
      const urn = el.organizationalTarget ?? "";
      const orgId =
        el["organizationalTarget~"]?.id?.toString() ?? urn.replace("urn:li:organization:", "");
      const orgName = el["organizationalTarget~"]?.localizedName ?? `Organization ${orgId}`;
      return { orgId, orgName };
    })
    .filter((o) => /^\d+$/.test(o.orgId));
}

// --- Connection lifecycle ---

/**
 * Complete the OAuth round-trip: exchange the code, verify the member is an
 * admin of the configured company page, then store the token set. Storing is
 * refused for any other organization so a stranger completing the flow can
 * never hijack the publishing identity.
 */
export async function completeOrgConnect(
  code: string,
  expectedOrgId: string,
): Promise<{ orgName: string; personName: string }> {
  const tokens = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
  });
  const [person, orgs] = await Promise.all([
    fetchPerson(tokens.access_token),
    fetchAdminOrgs(tokens.access_token),
  ]);

  const org = orgs.find((o) => o.orgId === expectedOrgId);
  if (!org) {
    throw new Error(
      orgs.length === 0
        ? "This LinkedIn account is not an administrator of any organization page. Make the account an admin of the Global Bioenergy Watch page, then connect again."
        : `This account does not administer the configured page (ID ${expectedOrgId}). Pages it administers: ${orgs
            .map((o) => `${o.orgName} (${o.orgId})`)
            .join(", ")}.`,
    );
  }

  const now = Date.now();
  const db = await adminDb();
  const { error } = await db.from("linkedin_org_connections").upsert({
    id: true,
    access_token: tokens.access_token,
    access_token_expires_at: new Date(now + tokens.expires_in * 1000).toISOString(),
    refresh_token: tokens.refresh_token ?? null,
    refresh_token_expires_at: tokens.refresh_token_expires_in
      ? new Date(now + tokens.refresh_token_expires_in * 1000).toISOString()
      : null,
    scope: tokens.scope ?? ORG_OAUTH_SCOPES,
    person_urn: person.urn,
    person_name: person.name,
    org_id: org.orgId,
    org_name: org.orgName,
    connected_at: new Date(now).toISOString(),
    updated_at: new Date(now).toISOString(),
  });
  if (error) throw new Error(`Failed to store the LinkedIn connection: ${error.message}`);
  return { orgName: org.orgName, personName: person.name };
}

export async function getOrgConnectionStatus(): Promise<OrgConnectionStatus> {
  const configured = isCustomAppConfigured();
  const base: OrgConnectionStatus = {
    configured,
    connected: false,
    orgId: null,
    orgName: null,
    connectedBy: null,
    accessTokenExpiresAt: null,
  };
  const db = await adminDb();
  const { data } = await db
    .from("linkedin_org_connections")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  const row = (data ?? null) as TokenRow | null;
  if (!row) return base;
  return {
    configured,
    connected: true,
    orgId: row.org_id,
    orgName: row.org_name,
    connectedBy: row.person_name,
    accessTokenExpiresAt: row.access_token_expires_at,
  };
}

export async function disconnectOrg(): Promise<void> {
  const db = await adminDb();
  await db.from("linkedin_org_connections").delete().eq("id", true);
}

/**
 * A usable organization access token: the stored one, refreshed automatically
 * when it has under a week left. Returns null when there is no connection or
 * the token is expired and cannot be refreshed.
 */
export async function getValidOrgAccessToken(): Promise<string | null> {
  if (!isCustomAppConfigured()) return null;
  const db = await adminDb();
  const { data } = await db
    .from("linkedin_org_connections")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  const row = (data ?? null) as TokenRow | null;
  if (!row) return null;

  const expiresAt = new Date(row.access_token_expires_at).getTime();
  if (expiresAt - Date.now() > 7 * 24 * 3600 * 1000) return row.access_token;

  if (row.refresh_token) {
    const refreshValid =
      !row.refresh_token_expires_at ||
      new Date(row.refresh_token_expires_at).getTime() > Date.now();
    if (refreshValid) {
      try {
        const tokens = await tokenRequest({
          grant_type: "refresh_token",
          refresh_token: row.refresh_token,
        });
        const now = Date.now();
        await db
          .from("linkedin_org_connections")
          .update({
            access_token: tokens.access_token,
            access_token_expires_at: new Date(now + tokens.expires_in * 1000).toISOString(),
            refresh_token: tokens.refresh_token ?? row.refresh_token,
            refresh_token_expires_at: tokens.refresh_token_expires_in
              ? new Date(now + tokens.refresh_token_expires_in * 1000).toISOString()
              : row.refresh_token_expires_at,
            updated_at: new Date(now).toISOString(),
          })
          .eq("id", true);
        return tokens.access_token;
      } catch (e) {
        console.error(
          "LinkedIn custom-app token refresh failed:",
          e instanceof Error ? e.message : e,
        );
      }
    }
  }

  // Still technically valid but close to expiry and not refreshable — use it
  // while it lasts rather than silently falling back.
  return expiresAt > Date.now() ? row.access_token : null;
}

/**
 * Publish a text post directly as the organization page using the custom
 * app's token. Returns ok:false with a detail string so the caller can fall
 * back to the managed connection.
 */
export async function postViaCustomOrgApp(
  orgId: string,
  text: string,
): Promise<{ ok: true; urn: string } | { ok: false; detail: string }> {
  const token = await getValidOrgAccessToken();
  if (!token) {
    return {
      ok: false,
      detail: "No valid custom-app organization token (not connected or expired)",
    };
  }
  const res = await fetch(`${LINKEDIN_API}/v2/ugcPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      author: `urn:li:organization:${orgId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { ok: false, detail: `LinkedIn org post failed [${res.status}]: ${body}` };
  }
  const data = (await res.json()) as { id?: string };
  if (!data.id) return { ok: false, detail: "LinkedIn returned no post id" };
  return { ok: true, urn: data.id };
}
