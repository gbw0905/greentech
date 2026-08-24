import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  KeyRound,
  Link2,
  Linkedin,
  Loader2,
  Lock,
  Unlink,
  UserRound,
} from "lucide-react";
import { PageShell, PageHeading } from "@/components/PageShell";
import {
  getLinkedInSettingsFn,
  saveLinkedInSettingsFn,
  startLinkedInOrgConnectFn,
  disconnectLinkedInOrgFn,
} from "@/lib/linkedin.functions";

type PostingMode = "personal_mention" | "company_page";

interface SettingsState {
  companyPageUrl: string;
  companyOrgId: string;
  postingMode: PostingMode;
  updatedAt: string;
}

interface OrgConnectionState {
  configured: boolean;
  connected: boolean;
  orgId: string | null;
  orgName: string | null;
  connectedBy: string | null;
  accessTokenExpiresAt: string | null;
}

const TITLE = "LinkedIn posting settings | Global Bioenergy Watch";

export const Route = createFileRoute("/settings/linkedin")({
  validateSearch: (search: Record<string, unknown>) => ({
    org: typeof search["org"] === "string" ? (search["org"] as string) : undefined,
    orgName: typeof search["orgName"] === "string" ? (search["orgName"] as string) : undefined,
    person: typeof search["person"] === "string" ? (search["person"] as string) : undefined,
    detail: typeof search["detail"] === "string" ? (search["detail"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: "Owner settings for the daily LinkedIn posting automation." },
      { property: "og:title", content: TITLE },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LinkedInSettingsPage,
});

function LinkedInSettingsPage() {
  const search = Route.useSearch();
  const loadSettings = useServerFn(getLinkedInSettingsFn);
  const saveSettings = useServerFn(saveLinkedInSettingsFn);
  const startConnect = useServerFn(startLinkedInOrgConnectFn);
  const disconnect = useServerFn(disconnectLinkedInOrgFn);

  const [adminKey, setAdminKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [companyPosting, setCompanyPosting] = useState<{ available: boolean; detail: string } | null>(null);
  const [orgConnection, setOrgConnection] = useState<OrgConnectionState | null>(null);
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<PostingMode>("personal_mention");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function unlock() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await loadSettings({ data: { adminKey } });
      setSettings(res.settings);
      setCompanyPosting(res.companyPosting);
      setOrgConnection(res.orgConnection);
      setUrl(res.settings.companyPageUrl);
      setMode(res.settings.postingMode);
      setUnlocked(true);
    } catch (e) {
      setMessage({ kind: "err", text: e instanceof Error ? e.message : "Could not load settings" });
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await saveSettings({ data: { adminKey, companyPageUrl: url, postingMode: mode } });
      setSettings(res.settings);
      setMessage({ kind: "ok", text: "Settings saved. The next daily post will use them." });
    } catch (e) {
      setMessage({ kind: "err", text: e instanceof Error ? e.message : "Could not save settings" });
    } finally {
      setBusy(false);
    }
  }

  async function connectOrg() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await startConnect({ data: { adminKey } });
      window.location.href = res.url; // leaves the page; busy state stays
    } catch (e) {
      setMessage({ kind: "err", text: e instanceof Error ? e.message : "Could not start connection" });
      setBusy(false);
    }
  }

  async function disconnectOrg() {
    setBusy(true);
    setMessage(null);
    try {
      await disconnect({ data: { adminKey } });
      const res = await loadSettings({ data: { adminKey } });
      setOrgConnection(res.orgConnection);
      setCompanyPosting(res.companyPosting);
      if (mode === "company_page") setMode("personal_mention");
      setMessage({ kind: "ok", text: "Custom app disconnected. Posts now use the managed connection." });
    } catch (e) {
      setMessage({ kind: "err", text: e instanceof Error ? e.message : "Could not disconnect" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <PageHeading
        icon={Linkedin}
        title="LinkedIn posting settings"
        subtitle="Choose where the daily Global Bioenergy Watch digest is published and which company page it promotes."
      />

      {!unlocked ? (
        <section className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-foreground">
            <Lock className="size-4 text-primary" />
            <h2 className="font-display text-lg font-extrabold">Owner access</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the admin key (stored in project secrets as LINKEDIN_SETTINGS_ADMIN_KEY) to manage
            posting settings.
          </p>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void unlock();
            }}
          >
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin key"
              autoComplete="off"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={busy || !adminKey}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-ink-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
              Unlock settings
            </button>
          </form>
          {message?.kind === "err" && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
              {message.text}
            </p>
          )}
        </section>
      ) : (
        <section className="mx-auto max-w-2xl space-y-5">
          {/* Result banner after the OAuth round-trip */}
          {search.org === "connected" && (
            <p className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>
                Connected to <strong>{search.orgName ?? "your company page"}</strong>
                {search.person ? <> as {search.person}</> : null}. Select "Company page" below and
                save to publish directly to the page.
              </span>
            </p>
          )}
          {search.org === "error" && (
            <p className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>Connection failed: {search.detail ?? "unknown error"}</span>
            </p>
          )}

          {/* Company page */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-extrabold text-foreground">Company page</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The LinkedIn page daily posts promote — used for mention tagging and, when the custom
              app is connected, as the posting destination.
            </p>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.linkedin.com/company/137244598/"
              className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {settings && (
              <p className="label-mono mt-2 text-xs text-muted-foreground">
                Organization ID: {settings.companyOrgId} · Last saved{" "}
                {new Date(settings.updatedAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Custom LinkedIn app connection */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-extrabold text-foreground">
              Custom LinkedIn app (company-page posting)
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your own LinkedIn app with the <span className="label-mono">w_organization_social</span>{" "}
              scope lets posts publish directly as the organization. The sign-in must be done by an
              admin of the company page.
            </p>

            {!orgConnection?.configured ? (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
                <p className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="size-4" /> App credentials not stored yet
                </p>
                <p className="mt-1.5 text-xs/relaxed">
                  Create the app in the LinkedIn Developer Portal (products: "Share on LinkedIn" and
                  "Marketing Developer Platform"; redirect URL{" "}
                  <span className="label-mono break-all">
                    https://globalbioenergywatch.org/api/public/linkedin/oauth/callback
                  </span>
                  ), then store LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in this project's
                  secrets.
                </p>
              </div>
            ) : orgConnection.connected ? (
              <div className="mt-4 space-y-3">
                <p className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  <span>
                    Connected to <strong>{orgConnection.orgName ?? "company page"}</strong> (ID{" "}
                    {orgConnection.orgId}) as {orgConnection.connectedBy}. Access token valid until{" "}
                    {orgConnection.accessTokenExpiresAt
                      ? new Date(orgConnection.accessTokenExpiresAt).toLocaleDateString()
                      : "—"}
                    ; it refreshes automatically.
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void connectOrg()}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary/40 disabled:opacity-50"
                  >
                    <Link2 className="size-4" /> Reconnect
                  </button>
                  <button
                    type="button"
                    onClick={() => void disconnectOrg()}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2 text-sm font-bold text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Unlink className="size-4" /> Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => void connectOrg()}
                disabled={busy}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0a66c2] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Linkedin className="size-4" />}
                Connect with LinkedIn
              </button>
            )}
          </div>

          {/* Posting mode */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-extrabold text-foreground">Posting destination</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode("personal_mention")}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  mode === "personal_mention"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserRound className="size-4 text-primary" />
                  <span className="text-sm font-extrabold text-foreground">Personal + page tag</span>
                </div>
                <p className="mt-2 text-xs/relaxed text-muted-foreground">
                  Posts appear on your personal profile and tag the company page as a mention, so
                  every post links back to it. Works with the managed LinkedIn connection.
                </p>
              </button>

              <button
                type="button"
                onClick={() => companyPosting?.available && setMode("company_page")}
                disabled={!companyPosting?.available}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  mode === "company_page"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border"
                } ${companyPosting?.available ? "hover:border-primary/40" : "cursor-not-allowed opacity-60"}`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-primary" />
                  <span className="text-sm font-extrabold text-foreground">Company page</span>
                </div>
                <p className="mt-2 text-xs/relaxed text-muted-foreground">
                  Posts publish directly as the organization via your custom LinkedIn app
                  (w_organization_social).
                </p>
                {companyPosting && (
                  <p
                    className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold ${
                      companyPosting.available
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-amber-500/10 text-amber-700"
                    }`}
                  >
                    {companyPosting.available ? (
                      <>
                        <CheckCircle2 className="size-3" /> Available — custom app connected
                      </>
                    ) : (
                      "Not available — connect the custom app above to enable"
                    )}
                  </p>
                )}
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              If company-page posting is selected but the direct post fails at publish time, the
              post automatically falls back to your personal profile with the mention tag.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void save()}
            disabled={busy || !url}
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-bold text-ink-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Save settings
          </button>

          {message && (
            <p
              className={`rounded-lg border px-3 py-2 text-sm ${
                message.kind === "ok"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                  : "border-red-500/30 bg-red-500/10 text-red-700"
              }`}
            >
              {message.text}
            </p>
          )}
        </section>
      )}
    </PageShell>
  );
}
