import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { C, DISPLAY, MONO, Label } from "../theme";
import { CornerMark } from "../Shared";

const HEADLINES = [
  "EU adopts revised RED III transport targets",
  "US EPA updates Renewable Fuel Standard volumes",
  "Brazil raises biodiesel blend to B15",
  "Indonesia moves toward B40 palm mandate",
  "ReFuelEU Aviation sets SAF uplift at 2%",
  "IRS publishes 45Z credit guidance",
  "India advances E20 ethanol roadmap",
  "UK SAF mandate enters into force",
  "Malaysia explores B30 biodiesel rollout",
  "Canada Clean Fuel Regulations expand",
];

const Tile: React.FC<{ text: string; index: number; x: number; y: number; w: number }> = ({
  text,
  index,
  x,
  y,
  w,
}) => {
  const frame = useCurrentFrame();
  const s = spring({ frame: frame - index * 5, fps: 30, config: { damping: 16, stiffness: 160 } });
  const flicker = interpolate(Math.sin(frame / 7 + index * 2.1), [-1, 1], [0.85, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        opacity: s * flicker * 0.55,
        transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
        border: `1px solid ${C.line}`,
        backgroundColor: "rgba(247,245,239,0.04)",
        padding: "14px 18px",
        fontFamily: MONO,
        fontSize: 17,
        color: C.muted,
        borderRadius: 4,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {text}
    </div>
  );
};

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const kicker = spring({ frame: frame - 8, fps: 30, config: { damping: 200 } });
  const line1 = spring({ frame: frame - 20, fps: 30, config: { damping: 20, stiffness: 140 } });
  const line2 = spring({ frame: frame - 34, fps: 30, config: { damping: 20, stiffness: 140 } });

  // scattered tiles: 2 columns x 5 rows
  const tiles = HEADLINES.map((text, i) => ({
    text,
    index: i,
    x: 90 + (i % 2) * 900 + ((i * 37) % 60),
    y: 140 + Math.floor(i / 2) * 165 + ((i * 53) % 40),
    w: 780,
  }));

  const veil = interpolate(frame, [40, 75], [0, 0.78], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <CornerMark />
      {tiles.map((t) => (
        <Tile key={t.text} {...t} />
      ))}
      <AbsoluteFill style={{ backgroundColor: `rgba(8,18,34,${veil})` }} />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 30,
        }}
      >
        <div style={{ opacity: kicker }}>
          <Label color={C.gold} size={24}>
            The problem
          </Label>
        </div>
        <h2
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 88,
            color: C.paper,
            margin: 0,
            textAlign: "center",
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
          }}
        >
          <span
            style={{
              display: "block",
              opacity: line1,
              transform: `translateY(${interpolate(line1, [0, 1], [40, 0])}px)`,
            }}
          >
            Biofuel policy moves fast.
          </span>
          <span
            style={{
              display: "block",
              color: C.muted,
              opacity: line2,
              transform: `translateY(${interpolate(line2, [0, 1], [40, 0])}px)`,
            }}
          >
            And it&apos;s scattered everywhere.
          </span>
        </h2>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
