import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flag, Search } from "lucide-react";
import { COUNTRIES, REGION_ACCENT, flagFor } from "@/lib/policy-taxonomy";
import { PageShell, PageHeading } from "@/components/PageShell";
import { useVisitTracker } from "@/hooks/useVisitTracker";

const TITLE = "Country policy profiles | Global Bioenergy Watch";
const DESCRIPTION =
  "Headline biofuel mandates and blending obligations for every tracked jurisdiction, from the EU and US to Brazil, India and Indonesia.";

export const Route = createFileRoute("/profiles")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://globalbioenergywatch.org/profiles" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/profiles" }],
  }),
  component: ProfilesPage,
});

function ProfilesPage() {
  useVisitTracker();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(term)) : COUNTRIES;
  }, [q]);

  return (
    <PageShell>
      <PageHeading
        icon={Flag}
        title="Country policy profiles"
        subtitle="Headline mandate for each tracked jurisdiction — open a profile for full detail."
      />

      <label className="glass-panel flex items-center gap-2 p-3">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search jurisdictions…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((c) => (
          <Link
            key={c.slug}
            to="/countries/$slug"
            params={{ slug: c.slug }}
            className="glass-panel lift group p-4"
          >
            <div className="label-mono" style={{ color: REGION_ACCENT[c.region] }}>
              {c.region}
            </div>
            <div className="mt-1 font-display font-semibold transition-colors group-hover:text-primary">
              <span className="mr-1.5" aria-hidden>
                {flagFor(c.slug)}
              </span>
              {c.name}
            </div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">{c.mandates[0]?.value}</div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
