import { useEffect, useMemo, useRef } from "react";
import { ArrowLeft, ExternalLink, History, Play, Loader2 } from "lucide-react";
import type { LiveVideo } from "../contracts";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getVideoRecommendationsFn } from "../server-functions";

export function VideoWatchView({
  video,
  related,
  onPlay,
  onBack,
  onHistory,
}: {
  video: LiveVideo;
  related: LiveVideo[];
  onPlay: (video: LiveVideo) => void;
  onBack: () => void;
  onHistory: () => void;
}) {
  const keyword = video.keyword || "bioenergy policy";
  const recommendations = useInfiniteQuery({
    queryKey: ["video-recommendations", keyword],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      getVideoRecommendationsFn({ data: { keyword, ...(pageParam ? { cursor: pageParam } : {}) } }),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    staleTime: 10 * 60_000,
    retry: 1,
  });
  const nextVideos = useMemo(() => {
    const unique = new Map<string, LiveVideo>();
    for (const item of [
      ...related,
      ...(recommendations.data?.pages.flatMap((page) => page.videos) ?? []),
    ]) {
      if (item.id !== video.id && !unique.has(item.id)) unique.set(item.id, item);
    }
    return [...unique.values()];
  }, [related, recommendations.data, video.id]);
  const scrollRoot = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetching, isError, fetchNextPage } = recommendations;
  useEffect(() => {
    if (!scrollRoot.current || !sentinel.current || !hasNextPage || isFetching || isError) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void fetchNextPage();
      },
      { root: scrollRoot.current, rootMargin: "0px 0px 180px 0px" },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, isError, fetchNextPage, nextVideos.length]);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, [video.id]);
  return (
    <main className="video-watch-shell" aria-labelledby="watch-video-title">
      <div className="video-watch-toolbar">
        <button type="button" onClick={onBack}>
          <ArrowLeft size={17} aria-hidden="true" /> All videos
        </button>
        <button type="button" onClick={onHistory}>
          <History size={17} aria-hidden="true" /> History
        </button>
      </div>
      <div className="video-watch-layout">
        <article className="video-watch-main">
          <div className="video-watch-player">
            <iframe
              key={video.id}
              src={`https://www.youtube.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0`}
              title={video.title}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <h1 id="watch-video-title" ref={title} tabIndex={-1}>
            {video.title}
          </h1>
          <div className="video-watch-details">
            <div className="video-watch-channel">
              <span aria-hidden="true">{(video.channel || "Y").slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{video.channel || "YouTube"}</strong>
                <p>{[video.published, video.duration].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
            <a href={video.url} target="_blank" rel="noopener noreferrer">
              Open on YouTube <ExternalLink size={15} aria-hidden="true" />
            </a>
          </div>
        </article>
        <aside className="video-watch-related" aria-labelledby="watch-related-title">
          <h2 id="watch-related-title">More to watch</h2>
          <div
            className="video-watch-scroll"
            ref={scrollRoot}
            tabIndex={0}
            aria-label="More videos — scroll for recommendations"
          >
            {nextVideos.length ? (
              nextVideos.map((item) => (
                <button
                  className="video-watch-next"
                  key={item.id}
                  type="button"
                  onClick={() => onPlay(item)}
                  aria-label={`Watch ${item.title}`}
                >
                  <span className="video-watch-thumbnail">
                    <img src={item.thumbnail} alt="" loading="lazy" />
                    {item.duration && <small>{item.duration}</small>}
                    <Play size={20} aria-hidden="true" />
                  </span>
                  <span className="video-watch-next-info">
                    <strong>{item.title}</strong>
                    <span>{item.channel}</span>
                    <span>{item.published}</span>
                  </span>
                </button>
              ))
            ) : (
              <p>Browse all videos to find more to watch.</p>
            )}
            <div className="video-watch-load" ref={sentinel} aria-live="polite">
              {isFetching ? (
                <span>
                  <Loader2 size={16} className="animate-spin" aria-hidden /> Loading more videos…
                </span>
              ) : isError ? (
                <>
                  <p>More videos could not be loaded.</p>
                  <button
                    type="button"
                    onClick={() =>
                      recommendations.data ? void fetchNextPage() : void recommendations.refetch()
                    }
                  >
                    Try again
                  </button>
                </>
              ) : hasNextPage ? (
                <button type="button" onClick={() => void fetchNextPage()}>
                  Load more videos
                </button>
              ) : (
                <span>You're all caught up. Explore another topic in All videos.</span>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
