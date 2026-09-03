import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { C, DISPLAY, MONO, Label } from "./theme";

/** Persistent dark navy backdrop with drifting grid + glow. */
export const PersistentBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 60) * 12;
  const glowX = 60 + Math.sin(frame / 90) * 8;
  return (
    <AbsoluteFill style={{ backgroundColor: C.navy }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(1100px 700px at ${glowX}% 20%, rgba(47,127,224,0.14), transparent 60%),
            radial-gradient(900px 600px at 20% 90%, rgba(217,164,65,0.08), transparent 60%),
            linear-gradient(180deg, ${C.navyDeep} 0%, ${C.navy} 45%, ${C.navyDeep} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
          backgroundSize: "96px 96px",
          transform: `translate(${drift}px, ${drift * 0.6}px)`,
          opacity: 0.35,
        }}
      />
      {/* frame hairline */}
      <AbsoluteFill
        style={{
          border: `1px solid rgba(247,245,239,0.08)`,
          margin: 28,
        }}
      />
    </AbsoluteFill>
  );
};

/** Small "GLOBAL BIOENERGY WATCH" corner mark shown on most scenes. */
export const CornerMark: React.FC<{ show?: boolean }> = ({ show = true }) => {
  const frame = useCurrentFrame();
  const o = show ? interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }) : 0;
  return (
    <div
      style={{
        position: "absolute",
        top: 52,
        left: 64,
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: o,
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          backgroundColor: C.gold,
          transform: "rotate(45deg)",
        }}
      />
      <span
        style={{
          fontFamily: MONO,
          fontSize: 18,
          letterSpacing: "0.3em",
          color: C.muted,
          textTransform: "uppercase",
        }}
      >
        Global Bioenergy Watch
      </span>
    </div>
  );
};

/** Wordmark used in hook + close. */
export const Wordmark: React.FC<{ scale?: number }> = ({ scale = 1 }) => {
  const frame = useCurrentFrame();
  const s = spring({ frame, fps: 30, config: { damping: 18, stiffness: 120 } });
  const sub = spring({ frame: frame - 14, fps: 30, config: { damping: 200 } });
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 26,
        transform: `scale(${scale * interpolate(s, [0, 1], [0.92, 1])})`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 22, opacity: s }}>
        <div
          style={{
            width: 26,
            height: 26,
            backgroundColor: C.gold,
            transform: `rotate(${45 + s * 90}deg)`,
          }}
        />
        <h1
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 92,
            color: C.paper,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Global Bioenergy Watch
        </h1>
      </div>
      <div style={{ opacity: sub, transform: `translateY(${interpolate(sub, [0, 1], [18, 0])}px)` }}>
        <Label color={C.gold} size={26}>
          AI-powered global bioenergy outlook
        </Label>
      </div>
    </div>
  );
};
