import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { C, DISPLAY, MONO, Label } from "../theme";
import { CornerMark } from "../Shared";

const Beat: React.FC<{
  index: number;
  title: string;
  sub: string;
  accent: string;
  children: React.ReactNode;
}> = ({ index, title, sub, accent, children }) => {
  const frame = useCurrentFrame();
  const s = spring({ frame: frame - 14 - index * 14, fps: 30, config: { damping: 18, stiffness: 140 } });
  return (
    <div
      style={{
        width: 520,
        border: `1px solid ${C.line}`,
        borderTop: `5px solid ${accent}`,
        borderRadius: 8,
        backgroundColor: "rgba(247,245,239,0.04)",
        padding: "36px 34px 30px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [70, 0])}px) scale(${interpolate(s, [0, 1], [0.95, 1])})`,
      }}
    >
      <div style={{ height: 190, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        {children}
      </div>
      <h3
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 34,
          color: C.paper,
          margin: 0,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      <p style={{ fontFamily: MONO, fontSize: 19, color: C.muted, margin: 0, lineHeight: 1.55 }}>{sub}</p>
    </div>
  );
};

const Bars: React.FC = () => {
  const frame = useCurrentFrame();
  const heights = [0.45, 0.7, 0.55, 0.9, 0.65, 1];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 190 }}>
      {heights.map((h, i) => {
        const s = spring({ frame: frame - 24 - i * 5, fps: 30, config: { damping: 14, stiffness: 120 } });
        return (
          <div
            key={i}
            style={{
              width: 44,
              height: 190 * h * s,
              backgroundColor: i % 2 ? C.blue : C.red,
              borderRadius: "4px 4px 0 0",
              opacity: 0.9,
            }}
          />
        );
      })}
    </div>
  );
};

const Envelope: React.FC = () => {
  const frame = useCurrentFrame();
  const s = spring({ frame: frame - 24, fps: 30, config: { damping: 14 } });
  const flap = interpolate(s, [0, 1], [-90, 0]);
  return (
    <div style={{ position: "relative", width: 260, height: 170, transform: `scale(${s})` }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: `3px solid ${C.gold}`,
          borderRadius: 8,
          backgroundColor: "rgba(217,164,65,0.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 85,
          borderBottom: `3px solid ${C.gold}`,
          clipPath: "polygon(0 0, 100% 0, 50% 100%)",
          backgroundColor: "rgba(217,164,65,0.18)",
          transform: `translateY(${flap * 0.3}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 22,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 15,
          letterSpacing: "0.2em",
          color: C.gold,
        }}
      >
        DAILY BRIEF
      </div>
    </div>
  );
};

const PlayCard: React.FC = () => {
  const frame = useCurrentFrame();
  const s = spring({ frame: frame - 24, fps: 30, config: { damping: 14 } });
  const pulse = interpolate(Math.sin(frame / 12), [-1, 1], [1, 1.08]);
  return (
    <div
      style={{
        width: 300,
        height: 170,
        borderRadius: 10,
        border: `3px solid ${C.teal}`,
        backgroundColor: "rgba(46,143,131,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${s})`,
      }}
    >
      <div
        style={{
          width: 0,
          height: 0,
          borderTop: "34px solid transparent",
          borderBottom: "34px solid transparent",
          borderLeft: `56px solid ${C.teal}`,
          marginLeft: 10,
          transform: `scale(${pulse})`,
        }}
      />
    </div>
  );
};

export const FeaturesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const head = spring({ frame: frame - 4, fps: 30, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      <CornerMark />
      <div style={{ position: "absolute", top: 130, left: 0, right: 0, textAlign: "center", opacity: head }}>
        <Label color={C.gold} size={22}>
          What you get
        </Label>
        <h2
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 60,
            color: C.paper,
            margin: "10px 0 0",
            letterSpacing: "-0.02em",
          }}
        >
          Built for people who decide.
        </h2>
      </div>
      <div
        style={{
          position: "absolute",
          top: 330,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 44,
        }}
      >
        <Beat index={0} title="Live charts & heat maps" sub="Prices, producers, airlines, terminals — visualized and exportable." accent={C.blue}>
          <Bars />
        </Beat>
        <Beat index={1} title="Email briefs & alerts" sub="AI-written summaries delivered to your inbox, on your schedule." accent={C.gold}>
          <Envelope />
        </Beat>
        <Beat index={2} title="Video briefing room" sub="Curated channels and live search, linked to countries and policies." accent={C.teal}>
          <PlayCard />
        </Beat>
      </div>
    </AbsoluteFill>
  );
};
