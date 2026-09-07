import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, ExternalLink, Scale, Search } from "lucide-react";
import { PageHeading, PageShell } from "@/components/PageShell";
import { CountryFlag } from "@/components/CountryFlag";
import {
  MANDATES,
  MANDATE_FUELS,
  MANDATE_STATUSES,
  mandateStatusTone,
  type MandateFuel,
  type MandateStatus,
} from "@/lib/mandates";

const TITLE = "Biofuel mandate tracker — every active blending obligation | Global Bioenergy Watch";
const DESCRIPTION =
  "Every active biofuel, SAF and renewable-fuel mandate worldwide: current blending or GHG obligation, phase-in timeline to 2050, legal requirements, compliance mechanism and penalties, with a link to each primary source.";
const URL = "https://globalbioenergywatch.org/mandates";

export const Route = createFileRoute("/mandates")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      {
        name: "keywords",
        content:
          "biofuel mandate tracker, ethanol blending mandate, biodiesel mandate, SAF mandate, RED III, RFS, LCFS, RTFO, RenovaBio",
      },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Biofuel mandate tracker",
          description: DESCRIPTION,
          url: URL,
          isPartOf: { "@type": "WebSite", name: "Global Bioenergy Watch", url: "https://globalbioenergywatch.org" },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: MANDATES.length,
            itemListElement: MANDATES.map((m, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `${m.jurisdiction} — ${m.instrument}`,
              url: m.sourceUrl,
            })),
          },
        }),
      },
    ],
  }),
  component: MandatesPage,
});

function MandatesPage() {
  const [fuel, setFuel] = useState<MandateFuel | "all">("all");
  const [status, setStatus] = useState<MandateStatus | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MANDATES.filter((m) => {
      if (fuel !== "all" && !m.fuels.includes(fuel)) return false;
      if (status !== "all" && m.status !== status) return false;
      if (!q) return true;
      return (
        m.jurisdiction.toLowerCase().includes(q) ||
        m.instrument.toLowerCase().includes(q) ||
        m.currentObligation.toLowerCase().includes(q)
      );
    });
  }, [fuel, status, query]);

  const counts = useMemo(() => {
    const byStatus = new Map<MandateStatus, number>();
    for (const m of MANDATES) byStatus.set(m.status, (byStatus.get(m.status) ?? 0) + 1);
    return byStatus;
  }, []);

  return (
    <PageShell>
      <PageHeading
        icon={Scale}
        title="Biofuel mandate tracker"
        subtitle="Every active blending, greenhouse-gas and renewable-fuel obligation we track — with its phase-in timeline, legal requirements, compliance mechanism and the primary document behind it."
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {MANDATE_STATUSES.map((s) => (
          <div key={s} className={`rounded-lg border p-4 shadow-sm ${mandateStatusTone(s)}`}>
            <div className="label-mono text-xs font-bold">{s}</div>
            <div className="font-display mt-1 text-2xl font-extrabold tracking-tight">
              {counts.get(s) ?? 0}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative flex w-full items-center lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <span className="sr-only">Search mandates</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jurisdiction or instrument"
              className="w-full rounded-md border border-border bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-foreground"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <FilterPills
              label="Fuel"
              value={fuel}
              options={MANDATE_FUELS}
              onChange={(v) => setFuel(v as MandateFuel | "all")}
              tone="bg-sky-50 border-sky-200 text-sky-900"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <FilterPills
            label="Status"
            value={status}
            options={MANDATE_STATUSES}
            onChange={(v) => setStatus(v as MandateStatus | "all")}
            tone="bg-emerald-50 border-emerald-200 text-emerald-900"
          />
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Showing {filtered.length} of {MANDATES.length} tracked mandates. Percentages are the
          obligation as written in law — always verify against the primary document before using them
          in a compliance decision.
        </p>
      </section>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-border bg-white p-6 text-sm text-muted-foreground shadow-sm">
          No mandate matches these filters.
        </p>
      ) : (
        <div className="space-y-5">
          {filtered.map((m) => (
            <article
              key={m.id}
              className="card-motion rounded-lg border border-border bg-white p-5 shadow-sm sm:p-6"
            >
              <header className="border-b border-border pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`label-mono rounded-sm border px-2 py-0.5 text-[0.65rem] font-bold ${mandateStatusTone(m.status)}`}
                  >
                    {m.status}
                  </span>
                  {m.fuels.map((f) => (
                    <span
                      key={f}
                      className="label-mono rounded-sm border border-border bg-muted px-2 py-0.5 text-[0.65rem] font-bold text-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <h2 className="font-display mt-2 flex flex-wrap items-center gap-2 text-lg font-extrabold tracking-tight sm:text-xl">
                  <CountryFlag slug={m.countrySlug} className="text-xl" />
                  {m.jurisdiction}
                </h2>
                <p className="mt-1 text-sm font-semibold text-foreground">{m.instrument}</p>
                <p className="mt-2 text-sm/relaxed text-muted-foreground">{m.currentObligation}</p>
                {m.countrySlug ? (
                  <Link
                    to="/countries/$slug"
                    params={{ slug: m.countrySlug }}
                    className="label-mono mt-2 inline-block text-xs font-bold text-primary underline underline-offset-4"
                  >
                    Open jurisdiction profile
                  </Link>
                ) : null}
              </header>

              <div className="grid gap-5 pt-4 lg:grid-cols-3">
                <div>
                  <h3 className="label-mono text-xs font-bold text-muted-foreground">Timeline</h3>
                  <ol className="mt-3 space-y-3">
                    {m.timeline.map((t) => (
                      <li key={`${m.id}-${t.period}`} className="flex gap-2.5">
                        {t.reached ? (
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                        ) : (
                          <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0">
                          <div className="label-mono text-xs font-bold text-foreground">{t.period}</div>
                          <p className="text-xs/relaxed text-muted-foreground">{t.target}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h3 className="label-mono text-xs font-bold text-muted-foreground">Requirements</h3>
                  <ul className="mt-3 list-disc space-y-2 pl-4 text-xs/relaxed text-muted-foreground">
                    {m.requirements.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="label-mono text-xs font-bold text-muted-foreground">
                    Compliance status &amp; enforcement
                  </h3>
                  <dl className="mt-3 space-y-2 text-xs/relaxed">
                    <Row label="Administrator" value={m.compliance.administrator} />
                    <Row label="How compliance is shown" value={m.compliance.mechanism} />
                    <Row label="Penalty for shortfall" value={m.compliance.penalty} />
                    <Row
                      label="Tradable unit"
                      value={m.compliance.unit ?? "None — physical blend obligation"}
                    />
                  </dl>
                </div>
              </div>

              <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <a
                  href={m.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label-mono inline-flex items-center gap-1.5 text-xs font-bold text-primary underline underline-offset-4"
                >
                  {m.sourceName}
                  <ExternalLink className="size-3.5" />
                </a>
                <span className="label-mono text-[0.65rem] text-muted-foreground">
                  Last reviewed {m.lastReviewed}
                </span>
              </footer>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-mono text-[0.65rem] font-bold text-foreground">{label}</dt>
      <dd className="text-muted-foreground">{value}</dd>
    </div>
  );
}

function FilterPills({
  label,
  value,
  options,
  onChange,
  tone,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  tone: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="label-mono text-[0.65rem] font-bold text-muted-foreground">{label}</span>
      {["all", ...options].map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={active}
            className={`label-mono rounded-full border px-2.5 py-1 text-[0.65rem] font-bold transition-colors ${
              active ? "border-foreground bg-foreground text-background" : `${tone} hover:border-foreground`
            }`}
          >
            {opt === "all" ? "All" : opt}
          </button>
        );
      })}
    </div>
  );
}
