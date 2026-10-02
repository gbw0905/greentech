import { Link, createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { FUEL_TYPES, type FuelType, type Region } from "@/features/policy/taxonomy";
import { LiveMediaFeed } from "@/features/videos/components/LiveMediaFeed";
import { VideoLibrary } from "@/features/videos/components/VideoLibrary";
import { VideoHero } from "@/features/videos/components/VideoHero";
import { VideoFilters } from "@/features/videos/components/VideoFilters";
import { LiveMarquee } from "@/features/markets/components/LiveMarquee";
import "@/features/videos/videos.css";
import { useVisitTracker } from "@/features/traffic/hooks/useVisitTracker";
import type { LiveVideo } from "@/features/videos/contracts";

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
  const [regions, setRegions] = useState<Region[]>([]);
  const [policies, setPolicies] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<LiveVideo | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const playVideo = (video: LiveVideo) => {
    setSelectedVideo(video);
    playerRef.current?.focus({ preventScroll: true });
    playerRef.current?.scrollIntoView({
      behavior: reducedMotion ? "instant" : "smooth",
      block: "start",
    });
  };
  const toggleFuel = (f: FuelType) =>
    setFuels((list) => (list.includes(f) ? list.filter((v) => v !== f) : [...list, f]));
  const toggleRegion = (r: Region) =>
    setRegions((list) => (list.includes(r) ? list.filter((v) => v !== r) : [...list, r]));
  const togglePolicy = (p: string) =>
    setPolicies((list) => (list.includes(p) ? list.filter((v) => v !== p) : [...list, p]));
  const clearFilters = () => {
    setFuels([]);
    setCountry(null);
    setRegions([]);
    setPolicies([]);
  };
  return (
    <div className="videos-page">
      <LiveMarquee />
      <main className="videos-shell">
        <nav className="videos-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Global Bioenergy Watch</Link>
          <span>/</span>
          <Link to="/" hash="markets">
            Markets
          </Link>
          <span>/</span>
          <span aria-current="page">Video briefing room</span>
        </nav>
        <VideoHero
          selectedVideo={selectedVideo}
          playerRef={playerRef}
          onShowExplainer={() => setSelectedVideo(null)}
        />
        <div className="videos-fuel-bar" role="group" aria-label="Filter videos by fuel type">
          <span>Fuel type</span>
          {FUEL_TYPES.map((f, index) => (
            <button
              key={f}
              type="button"
              aria-pressed={fuels.includes(f)}
              onClick={() => toggleFuel(f)}
              className={`videos-fuel-chip tone-${index % 3}${fuels.includes(f) ? " is-active" : ""}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="videos-layout">
          <VideoFilters
            country={country}
            onCountry={setCountry}
            fuels={fuels}
            onFuel={toggleFuel}
            regions={regions}
            onRegion={toggleRegion}
            policies={policies}
            onPolicy={togglePolicy}
            onClear={clearFilters}
          />
          <LiveMediaFeed
            fuels={fuels}
            country={country}
            selectedVideoId={selectedVideo?.id ?? null}
            onPlayVideo={playVideo}
          />
        </div>
        <VideoLibrary
          regions={regions}
          fuels={fuels}
          country={country}
          policies={policies}
          onSelectCountry={setCountry}
        />
      </main>
    </div>
  );
}
