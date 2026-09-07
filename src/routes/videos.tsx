import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Video } from "lucide-react";
import { FUEL_TYPES, FUEL_ACCENT, type FuelType } from "@/lib/policy-taxonomy";
import { VideoLibrary } from "@/components/VideoLibrary";
import { LiveMediaFeed } from "@/components/LiveMediaFeed";
import { PageShell, PageHeading } from "@/components/PageShell";
import { useVisitTracker } from "@/hooks/useVisitTracker";

const TITLE = "Video briefing room | Global Bioenergy Watch";
const DESCRIPTION =
  "Watch our explainer and curated YouTube channels and official video hubs on biofuel policy, linked to the countries and fuel types they cover.";

const EXPLAINER = {
  url: "https://globalbioenergywatch.org/videos/explainer.mp4",
  poster: "https://globalbioenergywatch.org/videos/explainer-poster.jpg",
  uploadDate: "2026-09-03",
  duration: "PT23S",
};

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://globalbioenergywatch.org/videos" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://globalbioenergywatch.org/videos" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: "Global Bioenergy Watch — explainer",
          description:
            "A 23-second explainer: how Global Bioenergy Watch tracks worldwide biofuel policy, markets, supply datasets and jobs in one live dashboard.",
          thumbnailUrl: EXPLAINER.poster,
          uploadDate: EXPLAINER.uploadDate,
          duration: EXPLAINER.duration,
          contentUrl: EXPLAINER.url,
          embedUrl: "https://globalbioenergywatch.org/videos",
        }),
      },
    ],
  }),
  component: VideosPage,
});

function VideosPage() {
  useVisitTracker();
  const [fuels, setFuels] = useState<FuelType[]>([]);
  const [country, setCountry] = useState<string | null>(null);

  const toggleFuel = (f: FuelType) =>
    setFuels((list) => (list.includes(f) ? list.filter((v) => v !== f) : [...list, f]));

  return (
    <PageShell>
      <PageHeading
        icon={Video}
        title="Video briefing room"
        subtitle="YouTube channels and official video hubs, linked to the countries and policies they cover."
      />

      <section className="glass-panel overflow-hidden">
        <div className="panel-head">
          <h2 className="label-mono text-muted-foreground">What is Global Bioenergy Watch?</h2>
          <span className="label-mono text-accent">23-second explainer</span>
        </div>
        <video
          controls
          preload="none"
          poster="/videos/explainer-poster.jpg"
          className="aspect-video w-full bg-black"
        >
          <source src="/videos/explainer.mp4" type="video/mp4" />
        </video>
      </section>


      <div className="glass-panel flex flex-wrap items-center gap-2 p-3">
        <span className="label-mono mr-1 text-muted-foreground">Fuel type</span>
        {FUEL_TYPES.map((f) => {
          const active = fuels.includes(f);
          const tint = FUEL_ACCENT[f];
          return (
            <button
              key={f}
              type="button"
              onClick={() => toggleFuel(f)}
              aria-pressed={active}
              className="label-mono inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all hover:-translate-y-0.5"
              style={
                active
                  ? { backgroundColor: tint, borderColor: tint, color: "var(--primary-foreground)" }
                  : {
                      backgroundColor: `color-mix(in oklab, ${tint} 12%, var(--surface))`,
                      borderColor: `color-mix(in oklab, ${tint} 35%, transparent)`,
                      color: tint,
                    }
              }
            >
              {f}
            </button>
          );
        })}
      </div>

      <LiveMediaFeed fuels={fuels} country={country} />

      <VideoLibrary regions={[]} fuels={fuels} country={country} onSelectCountry={setCountry} />
    </PageShell>
  );
}
