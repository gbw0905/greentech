import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useRef, useState, type RefObject } from "react";
import { Play } from "lucide-react";
import type { LiveVideo } from "../contracts";

function ExplainerPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPlay, setShowPlay] = useState(true);
  const [replay, setReplay] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);
  const startPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    setPlaybackError(false);
    video.focus({ preventScroll: true });
    void video.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShowPlay(true);
      setPlaybackError(true);
    });
  };
  return (
    <>
      <video
        ref={videoRef}
        controls
        playsInline
        tabIndex={0}
        preload="none"
        poster="/videos/explainer-poster.jpg"
        aria-label="What is Global Bioenergy Watch? 23-second explainer"
        onPlay={() => {
          setShowPlay(false);
          setReplay(false);
          setPlaybackError(false);
        }}
        onPause={() => setShowPlay(true)}
        onEnded={() => {
          setShowPlay(true);
          setReplay(true);
        }}
        onError={() => {
          setShowPlay(true);
          setPlaybackError(true);
        }}
      >
        <source src="/videos/explainer.mp4" type="video/mp4" />
      </video>
      {showPlay && (
        <button
          type="button"
          className="videos-explainer-play"
          aria-label={replay ? "Replay explainer video" : "Play explainer video"}
          onClick={startPlayback}
        >
          <span>
            <Play aria-hidden="true" fill="currentColor" />
          </span>
        </button>
      )}
      {playbackError && (
        <p className="videos-playback-error" role="alert">
          The explainer could not start. Press Play to try again.
        </p>
      )}
    </>
  );
}

export function VideoHero({
  selectedVideo,
  playerRef,
  onShowExplainer,
}: {
  selectedVideo: LiveVideo | null;
  playerRef: RefObject<HTMLDivElement | null>;
  onShowExplainer: () => void;
}) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(x, { stiffness: 150, damping: 24 });
  const rotateY = useSpring(y, { stiffness: 150, damping: 24 });
  return (
    <div className="videos-hero-perspective">
      <motion.section
        className="videos-hero"
        aria-labelledby="video-page-title"
        style={reduced || selectedVideo ? { rotateX: 0, rotateY: 0 } : { rotateX, rotateY }}
        onPointerMove={(event) => {
          if (reduced || selectedVideo || event.pointerType !== "mouse") return;
          if ((event.target as HTMLElement).closest(".videos-explainer")) {
            x.set(0);
            y.set(0);
            return;
          }
          const bounds = event.currentTarget.getBoundingClientRect();
          x.set(-((event.clientY - bounds.top) / bounds.height - 0.5) * 5);
          y.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 5);
        }}
        onPointerLeave={() => {
          x.set(0);
          y.set(0);
        }}
      >
        <span className="videos-hero-chip">
          <i />
          Global Bioenergy Watch
        </span>
        <h1 id="video-page-title">Video briefing room</h1>
        <p className="videos-hero-sub">
          YouTube channels and official video hubs, linked to the countries and policies they cover.
          Every hub is tagged to the same jurisdictions, fuels and policy instruments as the rest of
          the desk.
        </p>
        <div
          id="video-player"
          ref={playerRef}
          tabIndex={-1}
          aria-label={
            selectedVideo ? `Video player: ${selectedVideo.title}` : "Explainer video player"
          }
          className={`videos-explainer${selectedVideo ? " is-youtube" : ""}`}
        >
          {selectedVideo ? (
            <iframe
              key={selectedVideo.id}
              src={`https://www.youtube.com/embed/${encodeURIComponent(selectedVideo.id)}?autoplay=1&playsinline=1&rel=0`}
              title={selectedVideo.title}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <ExplainerPlayer />
          )}
        </div>
        {selectedVideo ? (
          <div className="videos-selected-caption">
            <div aria-live="polite">
              <strong>{selectedVideo.title}</strong>
              <p>
                {selectedVideo.channel}
                {selectedVideo.duration ? ` · ${selectedVideo.duration}` : ""}
              </p>
            </div>
            <div className="videos-player-actions">
              <a href={selectedVideo.url} target="_blank" rel="noopener noreferrer">
                Watch on YouTube ↗
              </a>
              <button type="button" onClick={onShowExplainer}>
                Back to explainer
              </button>
            </div>
          </div>
        ) : (
          <p className="videos-explainer-caption">
            What is Global Bioenergy Watch?<span>23-second explainer</span>
          </p>
        )}
      </motion.section>
    </div>
  );
}
