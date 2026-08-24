import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Building2, CheckCircle2, KeyRound, Linkedin, Loader2, Lock, UserRound } from "lucide-react";
import { PageShell, PageHeading } from "@/components/PageShell";
import { getLinkedInSettingsFn, saveLinkedInSettingsFn } from "@/lib/linkedin.functions";

type PostingMode = "personal_mention" | "company_page";

interface SettingsState {
  companyPageUrl: string;
  companyOrgId: string;
  postingMode: PostingMode;
  updatedAt: string;
}

const TITLE = "LinkedIn posting settings | Global Bioenergy Watch";

export const Route = createFileRoute("/settings/linkedin")({
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
  const loadSettings = useServerFn(getLinkedInSettingsFn);
  const saveSettings = useServerFn(saveLinkedInSettingsFn);

  const [adminKey, setAdminKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [companyPosting, setCompanyPosting] = useState<{ available: boolean; detail: string } | null>(null);
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
          {/* Company page */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-lg font-extrabold text-foreground">Company page</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The LinkedIn page daily posts promote — used for mention tagging and, when available,
              as the posting destination.
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
                  every post links back to it. Works with the current LinkedIn connection.
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
                  Posts publish directly as the organization. Requires LinkedIn's organization
                  posting permission (w_organization_social).
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
                        <CheckCircle2 className="size-3" /> Available on this connection
                      </>
                    ) : (
                      "Not available — reconnect with organization scope to enable"
                    )}
                  </p>
                )}
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              If company-page posting is selected but LinkedIn rejects it at publish time, the post
              automatically falls back to your personal profile with the mention tag.
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
