import { ArrowLeft, History, Trash2, X } from "lucide-react";
import type { LiveVideo } from "../contracts";
import type { WatchedVideo } from "../watch-history";

export function VideoHistory({
  history,
  onPlay,
  onRemove,
  onClear,
  onBack,
}: {
  history: WatchedVideo[];
  onPlay: (video: LiveVideo) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onBack: () => void;
}) {
  const groups = new Map<string, WatchedVideo[]>();
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  for (const video of history) {
    const date = new Date(video.watchedAt);
    const label =
      date.toDateString() === today
        ? "Today"
        : date.toDateString() === yesterday.toDateString()
          ? "Yesterday"
          : date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    groups.set(label, [...(groups.get(label) ?? []), video]);
  }
  return (
    <main className="video-history-shell" aria-labelledby="video-history-title">
      <div className="video-watch-toolbar">
        <button type="button" onClick={onBack}>
          <ArrowLeft size={17} aria-hidden="true" /> All videos
        </button>
      </div>
      <header className="video-history-heading">
        <div>
          <h1 id="video-history-title">Watch history</h1>
          <p>Videos you opened on this browser.</p>
        </div>
        {history.length > 0 && (
          <button type="button" onClick={onClear}>
            <Trash2 size={16} aria-hidden="true" /> Clear history
          </button>
        )}
      </header>
      {!history.length && (
        <div className="video-history-empty">
          <History size={36} aria-hidden="true" />
          <h2>Your history starts here</h2>
          <p>Open a video and it will appear here for you to watch again.</p>
          <button type="button" onClick={onBack}>
            Browse videos
          </button>
        </div>
      )}
      {[...groups].map(([label, videos]) => (
        <section className="video-history-group" key={label} aria-label={label}>
          <h2>{label}</h2>
          {videos.map((video) => (
            <div className="video-history-row" key={video.id}>
              <button
                type="button"
                className="video-history-video"
                onClick={() => onPlay(video)}
                aria-label={`Watch again: ${video.title}`}
              >
                <span className="video-watch-thumbnail">
                  <img src={video.thumbnail} alt="" loading="lazy" />
                  {video.duration && <small>{video.duration}</small>}
                </span>
                <span>
                  <strong>{video.title}</strong>
                  <span>{video.channel}</span>
                  <time dateTime={new Date(video.watchedAt).toISOString()}>
                    Opened{" "}
                    {new Date(video.watchedAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </time>
                </span>
              </button>
              <button
                className="video-history-remove"
                type="button"
                onClick={() => onRemove(video.id)}
                aria-label={`Remove ${video.title} from history`}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
