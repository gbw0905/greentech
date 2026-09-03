import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { C, DISPLAY, MONO, Label } from "../theme";
import { Wordmark } from "../Shared";

export const CloseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const url = spring({ frame: frame - 30, fps: 30, config: { damping: 18, stiffness: 130 } });
  const tag = spring({ frame: frame - 16, fps: 30, config: { damping: 200 } });
  const drift = Math.sin(frame / 40) * 6;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 44 }}>
      <Wordmark scale={0.8} />
      <div
        style={{
          opacity: tag,
          transform: `translateY(${interpolate(tag, [0, 1], [16, 0])}px)`,
          fontFamily: DISPLAY,
          fontWeight: 600,
          fontSize: 38,
          color: C.muted,
          marginTop: -10,
        }}
      >
        Track it all in one place.
      </div>
      <div
        style={{
          opacity: url,
          transform: `translateY(${interpolate(url, [0, 1], [24, 0]) + drift * 0.3}px)`,
          border: `2px solid ${C.gold}`,
          borderRadius: 8,
          padding: "18px 46px",
          fontFamily: MONO,
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: C.gold,
        }}
      >
        globalbioenergywatch.org
      </div>
      <div style={{ position: "absolute", bottom: 60, opacity: url }}>
        <Label size={16}>Policy · Markets · Supply chains — updated continuously</Label>
      </div>
    </AbsoluteFill>
  );
};
