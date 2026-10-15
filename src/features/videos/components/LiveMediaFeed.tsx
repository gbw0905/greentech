import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, useInView, useReducedMotion } from "motion/react";
import { PlayCircle, Newspaper, RefreshCw, ExternalLink } from "lucide-react";
import { getLiveMediaFn } from "@/features/videos/server-functions";
import { COUNTRIES, type FuelType } from "@/features/policy/taxonomy";
import type { LiveVideo } from "../contracts";
import "../videos.css";

const BASE_KEYWORDS = [
  "bioenergy policy",
  "biofuel mandate",
  "sustainable aviation fuel",
  "renewable diesel",
  "biogas biomethane",
];
const FUEL_KEYWORD: Record<FuelType, string> = {
  Ethanol: "ethanol blending policy",
  Biodiesel: "biodiesel mandate",
  "Renewable Diesel": "renewable diesel HVO",
  SAF: "sustainable aviation fuel mandate",
  Biogas: "biomethane biogas policy",
  Feedstock: "biofuel feedstock supply",
};
const nameFor = (slug: string) => COUNTRIES.find((c) => c.slug === slug)?.name ?? slug;

function VideoResults({
  videos,
  selectedVideoId,
  onPlayVideo,
}: {
  videos: LiveVideo[];
  selectedVideoId: string | null;
  onPlayVideo: ((video: LiveVideo) => void) | undefined;
}) {
  const [visibleCount, setVisibleCount] = useState(8);
  const sentinel = useRef<HTMLDivElement>(null);
  const nearEnd = useInView(sentinel, { margin: "0px 0px 300px 0px" });
  const reduced = useReducedMotion();
  const hasMore = visibleCount < videos.length;
  useEffect(() => {
    if (nearEnd && hasMore && !reduced) setVisibleCount((count) => count + 8);
  }, [nearEnd, hasMore, reduced]);
  return (
    <>
      <div className="videos-card-grid">
        {videos.slice(0, visibleCount).map((v, index) => (
          <motion.a
            key={v.id}
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`videos-live-card${selectedVideoId === v.id ? " is-selected" : ""}`}
            aria-current={selectedVideoId === v.id ? "true" : undefined}
            aria-label={onPlayVideo ? `Watch ${v.title}` : undefined}
            onClick={(event) => {
              if (
                !onPlayVideo ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey ||
                !/^[\w-]{11}$/.test(v.id)
              )
                return;
              event.preventDefault();
              event.currentTarget.focus({ preventScroll: true });
              onPlayVideo(v);
            }}
            initial={false}
            whileInView={reduced ? {} : { opacity: [0.55, 1], y: [12, 0] }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.4, delay: (index % 8) * 0.06 }}
          >
            <div className="videos-thumb">
              <img
                src={v.thumbnail}
                alt={v.title}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
              <PlayCircle className="videos-thumb-play" aria-hidden="true" />
              <span className="videos-thumb-source">{v.channel}</span>
              {v.duration && <span className="videos-duration">{v.duration}</span>}
            </div>
            <div className="videos-live-body">
              <h3>{v.title}</h3>
              <p>
                {v.channel}
                {v.published && (
                  <>
                    <span>·</span>
                    {v.published}
                  </>
                )}
              </p>
            </div>
          </motion.a>
        ))}
      </div>
      {hasMore ? (
        <div ref={sentinel} className="videos-load-more">
          <button type="button" onClick={() => setVisibleCount((count) => count + 8)}>
            Load more videos{" "}
            <span>
              {Math.min(visibleCount, videos.length)} / {videos.length}
            </span>
          </button>
        </div>
      ) : (
        <p className="videos-feed-end">You’re up to date · {videos.length} videos in this feed</p>
      )}
    </>
  );
}

export function LiveMediaFeed({
  fuels,
  countries,
  selectedVideoId = null,
  onPlayVideo,
  onVideosChange,
}: {
  fuels: FuelType[];
  countries: string[];
  selectedVideoId?: string | null;
  onPlayVideo?: (video: LiveVideo) => void;
  onVideosChange?: (videos: LiveVideo[]) => void;
}) {
  const keywords = useMemo(() => {
    const topics = fuels.length ? fuels.map((f) => FUEL_KEYWORD[f]) : BASE_KEYWORDS;
    const prefixes = countries.length ? countries.map((slug) => `${nameFor(slug)} `) : [""];
    return Array.from(
      new Set(prefixes.flatMap((prefix) => topics.map((topic) => `${prefix}${topic}`))),
    );
  }, [fuels, countries]);
  const fetchMedia = useServerFn(getLiveMediaFn);
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["live-media", keywords],
    queryFn: async () => {
      // Keep every selected country in the search while respecting the API batch limit.
      const batches = Array.from({ length: Math.ceil(keywords.length / 12) }, (_, index) =>
        keywords.slice(index * 12, index * 12 + 12),
      );
      const results = [];
      for (const batch of batches) results.push(await fetchMedia({ data: { keywords: batch } }));
      return {
        videos: [
          ...new Map(
            results.flatMap((result) => result.videos).map((video) => [video.id, video]),
          ).values(),
        ],
        articles: [
          ...new Map(
            results.flatMap((result) => result.articles).map((article) => [article.url, article]),
          ).values(),
        ],
      };
    },
    staleTime: 15 * 60_000,
  });
  useEffect(() => {
    if (data?.videos) onVideosChange?.(data.videos);
  }, [data?.videos, onVideosChange]);
  const videos = data?.videos ?? [];
  const articles = data?.articles ?? [];
  const reduced = useReducedMotion();
  return (
    <section className="videos-feed" aria-labelledby="video-live-title" aria-busy={isFetching}>
      <header className="videos-section-head">
        <div>
          <h2 id="video-live-title" tabIndex={-1}>
            Live search — YouTube &amp; web
          </h2>
          <p>Fresh results for: {keywords.join(" · ")}</p>
        </div>
        <button
          type="button"
          className="videos-refresh"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={14} className={isFetching ? "videos-spinning" : ""} aria-hidden="true" />
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </header>
      {isFetching && videos.length === 0 && articles.length === 0 && (
        <div role="status">
          <p className="videos-loading-label">Searching YouTube and the web…</p>
          <div className="videos-card-grid" aria-hidden="true">
            {Array.from({ length: 8 }, (_, i) => (
              <div className="videos-skeleton" key={i}>
                <div className="videos-skeleton-thumb" />
                <div className="videos-skeleton-line" />
                <div className="videos-skeleton-line short" />
              </div>
            ))}
          </div>
        </div>
      )}
      {videos.length > 0 && (
        <VideoResults
          key={keywords.join("|")}
          videos={videos}
          selectedVideoId={selectedVideoId}
          onPlayVideo={onPlayVideo}
        />
      )}
      {articles.length > 0 && (
        <section className="videos-web-coverage" aria-labelledby="video-web-title">
          <h3 id="video-web-title">
            <Newspaper size={16} aria-hidden="true" />
            Web coverage
          </h3>
          <div className="videos-article-grid">
            {articles.slice(0, 18).map((a, index) => (
              <motion.a
                key={a.url}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="videos-article-card"
                initial={false}
                whileInView={reduced ? {} : { opacity: [0.55, 1], y: [12, 0] }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.4, delay: (index % 4) * 0.06 }}
              >
                <h4>{a.title}</h4>
                <p>
                  {a.source}
                  {a.published ? ` · ${new Date(a.published).toLocaleDateString()}` : ""}
                  <ExternalLink size={12} aria-hidden="true" />
                </p>
              </motion.a>
            ))}
          </div>
        </section>
      )}
      {!isFetching && videos.length === 0 && articles.length === 0 && (
        <p className="videos-empty" role="status">
          {isError
            ? "Live search is unavailable right now. Try Refresh, or explore the official hubs below."
            : "No live results right now — the curated hubs below still apply."}
        </p>
      )}
    </section>
  );
}
