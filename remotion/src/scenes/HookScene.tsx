import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { C, Label } from "../theme";
import { Wordmark } from "../Shared";

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const lineW = interpolate(frame, [10, 50], [0, 560], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const meta = interpolate(frame, [45, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Wordmark />
      <div
        style={{
          position: "absolute",
          bottom: 300,
          height: 2,
          width: lineW,
          backgroundColor: C.gold,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 236,
          display: "flex",
          gap: 40,
          opacity: meta,
        }}
      >
        <Label size={18}>Mandates</Label>
        <Label size={18}>·</Label>
        <Label size={18}>Markets</Label>
        <Label size={18}>·</Label>
        <Label size={18}>Supply chains</Label>
        <Label size={18}>·</Label>
        <Label size={18}>One tracker</Label>
      </div>
    </AbsoluteFill>
  );
};
