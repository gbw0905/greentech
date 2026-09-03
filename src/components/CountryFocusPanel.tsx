import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Flag, Layers, MousePointerClick, Video } from "lucide-react";
import { feedQuery } from "@/lib/feed-query";
import {
  COUNTRIES,
  countryBySlug,
  REGION_ACCENT,
  POLICY_STATUS_COLOR,
  policyStatusFor,
  flagFor,
  type FuelType,
} from "@/lib/policy-taxonomy";
import { UpdateCard } from "@/components/UpdateCard";
import { CountryFlag } from "@/components/CountryFlag";
import { VideoLibrary } from "@/components/VideoLibrary";
import { LiveMediaFeed } from "@/components/LiveMediaFeed";

type Tab = "profile" | "updates" | "videos";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "profile", label: "Country profile", icon: Flag },
  { id: "updates", label: "Policy & market updates", icon: Layers },
  { id: "videos", label: "Videos & media", icon: Video },
];

export function CountryFocusPanel({
  country,
  fuels,
  onSelectCountry,
}: {
  country: string | null;
  fuels: FuelType[];
  onSelectCountry: (slug: string | null) => void;
}) {
  const [tab, setTab] = useState<Tab>("updates");
  const { data: feed, isFetching } = useQuery(feedQuery);
  const profile = country ? countryBySlug(country) : null;
  const updates = feed?.updates ?? [];

  const matched = useMemo(() => {
    const keywords = (profile?.updateKeywords ?? []).map((k) => k.toLowerCase());
    return updates
      .filter((u) => (fuels.length === 0 || u.fuels.some((f) => fuels.includes(f))))
      .filter((u) => {
        if (!country) return true;
        if (u.countrySlug === country) return true;
        if (keywords.length === 0) return false;
        const text = ` ${`${u.title} ${u.summary ?? ""}`.toLowerCase()} `;
        return keywords.some((k) =>
          k.length <= 4
            ? new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text)
            : text.includes(k),
        );
      })
      .sort((a, b) => {
        const aDate = a.publishedAt ?? a.createdAt;
        const bDate = b.publishedAt ?? b.createdAt;
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
  }, [updates, country, fuels, profile]);

  const status = profile ? policyStatusFor(profile) : null;

  if (!profile) {
    return (
      <div className="glass-panel rise mt-4 px-5 py-6">
        <p className="label-mono inline-flex items-center gap-1.5 text-muted-foreground">
          <MousePointerClick className="size-3.5" />
          Select a jurisdiction
        </p>
        <h3 className="mt-1 font-display text-xl font-bold">
          Click a country on the map to load its updates
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          You&apos;ll get that country&apos;s policy &amp; market updates, mandates and video
          briefings — all filtered to the selected jurisdiction.
        </p>
        <div className="mt-3">
          <select
            value=""
            onChange={(e) => onSelectCountry(e.target.value || null)}
            aria-label="Select a country"
            className="label-mono rounded-full border border-border bg-surface-2 px-3 py-1.5 text-foreground"
          >
            <option value="">Or pick a country…</option>
            {COUNTRIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {flagFor(c.slug)} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rise mt-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div className="min-w-0">
          <p className="label-mono inline-flex items-center gap-1.5 text-muted-foreground">
            <MousePointerClick className="size-3.5" />
            Selected on the map
          </p>
          <h3 className="mt-1 flex items-center gap-2.5 font-display text-2xl font-bold">
            <CountryFlag slug={profile.slug} />
            {profile.name}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="label-mono" style={{ color: REGION_ACCENT[profile.region] }}>
              {profile.region}
            </span>
            {status && (
              <span className="label-mono" style={{ color: POLICY_STATUS_COLOR[status] }}>
                {status}
              </span>
            )}
            <span className="label-mono text-muted-foreground">{matched.length} updates</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={country ?? ""}
            onChange={(e) => onSelectCountry(e.target.value || null)}
            aria-label="Select a country"
            className="label-mono rounded-full border border-border bg-surface-2 px-3 py-1.5 text-foreground"
          >
            <option value="">Clear selection</option>
            {COUNTRIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {flagFor(c.slug)} {c.name}
              </option>
            ))}
          </select>
          <Link
            to="/countries/$slug"
            params={{ slug: profile.slug }}
            className="label-mono inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-primary transition-transform hover:-translate-y-0.5"
          >
            Full page <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border/70 px-5 py-3">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={active}
              className={`label-mono inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 transition-all hover:-translate-y-0.5 ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface-2 text-muted-foreground"
              }`}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {tab === "profile" &&
          (
            <div className="space-y-5">
              <p className="max-w-3xl text-sm text-muted-foreground">{profile.blurb}</p>
              <div className="flex flex-wrap gap-2">
                {profile.frameworks.map((f) => (
                  <span
                    key={f}
                    className="label-mono rounded-full bg-surface-2 px-3 py-1 shadow-[var(--shadow-frost)]"
                  >
                    {f}
                  </span>
                ))}
              </div>
              <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {profile.mandates.map((m) => (
                  <div key={m.label} className="glass-panel lift p-4">
                    <dt className="label-mono text-muted-foreground">{m.label}</dt>
                    <dd className="mt-1 font-mono text-sm text-foreground">{m.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

        {tab === "updates" && (
          <div className="space-y-3">
            {matched.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {isFetching ? "Scanning global sources…" : "No updates match this selection yet."}
              </p>
            )}
            {matched.slice(0, 40).map((u) => (
              <UpdateCard key={u.id} update={u} />
            ))}
          </div>
        )}

        {tab === "videos" && (
          <div className="space-y-5">
            <LiveMediaFeed fuels={fuels} country={country} />
            <VideoLibrary
              regions={[]}
              fuels={fuels}
              country={country}
              onSelectCountry={onSelectCountry}
            />
          </div>
        )}
      </div>
    </div>
  );
}
