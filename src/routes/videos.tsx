import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { type FuelType } from "@/features/policy/taxonomy";
import { LiveMediaFeed } from "@/features/videos/components/LiveMediaFeed";
import { VideoWatchView } from "@/features/videos/components/VideoWatchView";
import { VideoHistory } from "@/features/videos/components/VideoHistory";
import { useWatchHistory } from "@/features/videos/hooks/useWatchHistory";
import { VideoFilters } from "@/features/videos/components/VideoFilters";
import "@/features/videos/videos.css";
import { useVisitTracker } from "@/features/traffic/hooks/useVisitTracker";
import type { LiveVideo } from "@/features/videos/contracts";

const TITLE = "Video briefing room | Global Bioenergy Watch";
const DESCRIPTION =
  "Browse bioenergy videos from YouTube and official publishers, filter by country and fuel, and watch selected videos and revisit your watch history.";

export const Route = createFileRoute("/videos")({
  validateSearch: (search: Record<string, unknown>): { watch?: string; view?: "history" } => {
    if (typeof search["watch"] === "string" && /^[\w-]{11}$/.test(search["watch"]))
      return { watch: search["watch"] };
    return search["view"] === "history" ? { view: "history" } : {};
  },
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
  }),
  component: VideosPage,
});

function VideosPage() {
  useVisitTracker();
  const [fuels, setFuels] = useState<FuelType[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const { watch, view } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [openedVideo, setOpenedVideo] = useState<LiveVideo | null>(null);
  const [availableVideos, setAvailableVideos] = useState<LiveVideo[]>([]);
  const { history, record, remove, clear } = useWatchHistory();
  const lastVideoTrigger = useRef<HTMLElement | null>(null);
  const listingScroll = useRef(0);
  const lastRecorded = useRef<string | null>(null);
  const selectedVideo = useMemo(
    () =>
      watch
        ? (availableVideos.find((video) => video.id === watch) ??
          history.find((video) => video.id === watch) ??
          (openedVideo?.id === watch ? openedVideo : null) ?? {
            id: watch,
            title: "Bioenergy video",
            channel: "",
            published: "",
            duration: "",
            keyword: "",
            thumbnail: `https://i.ytimg.com/vi/${watch}/hqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${watch}`,
            kind: "youtube" as const,
          })
        : null,
    [watch, availableVideos, history, openedVideo],
  );
  useEffect(() => {
    if (!selectedVideo) {
      lastRecorded.current = null;
      return;
    }
    if (!selectedVideo.channel || lastRecorded.current === selectedVideo.id) return;
    lastRecorded.current = selectedVideo.id;
    record(selectedVideo);
  }, [selectedVideo, record]);
  useEffect(() => {
    if (watch || view === "history" || !lastVideoTrigger.current?.isConnected) return;
    lastVideoTrigger.current.focus({ preventScroll: true });
    window.scrollTo({ top: listingScroll.current, behavior: "instant" });
  }, [watch, view]);
  const playVideo = (video: LiveVideo) => {
    if (!/^[\w-]{11}$/.test(video.id)) return;
    if (!watch && view !== "history") {
      lastVideoTrigger.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      listingScroll.current = window.scrollY;
    }
    setOpenedVideo(video);
    void navigate({ search: { watch: video.id }, resetScroll: true });
  };
  const showHistory = () => {
    void navigate({ search: { view: "history" }, resetScroll: true });
  };
  const showListing = () => {
    void navigate({ search: {}, resetScroll: false });
  };
  const toggleFuel = (f: FuelType) =>
    setFuels((list) => (list.includes(f) ? list.filter((v) => v !== f) : [...list, f]));
  const toggleCountry = (slug: string) =>
    setCountries((list) =>
      list.includes(slug) ? list.filter((value) => value !== slug) : [...list, slug],
    );
  const clearFilters = () => {
    setFuels([]);
    setCountries([]);
  };
  return (
    <div className="videos-page">
      {selectedVideo && (
        <VideoWatchView
          video={selectedVideo}
          related={availableVideos.length ? availableVideos : history}
          onPlay={playVideo}
          onBack={showListing}
          onHistory={showHistory}
        />
      )}
      {view === "history" && (
        <VideoHistory
          history={history}
          onPlay={playVideo}
          onRemove={remove}
          onClear={clear}
          onBack={showListing}
        />
      )}
      <main className="videos-shell" hidden={!!watch || view === "history"}>
        <h1 id="video-page-title" className="sr-only">
          Bioenergy videos
        </h1>
        <div className="videos-layout">
          <VideoFilters
            countries={countries}
            onCountry={toggleCountry}
            fuels={fuels}
            onFuel={toggleFuel}
            onClear={clearFilters}
          />
          <LiveMediaFeed
            fuels={fuels}
            countries={countries}
            selectedVideoId={watch ?? null}
            onPlayVideo={playVideo}
            onVideosChange={setAvailableVideos}
            onHistory={showHistory}
          />
        </div>
      </main>
    </div>
  );
}
