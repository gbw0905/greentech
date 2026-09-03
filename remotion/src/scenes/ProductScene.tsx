import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from "remotion";
import { C, DISPLAY, MONO, Label, Badge } from "../theme";
import { CornerMark } from "../Shared";

const UPDATES = [
  { kind: "policy" as const, flag: "EU", title: "RED III: member states transpose 42.5% renewables target", age: "2h" },
  { kind: "market" as const, flag: "US", title: "Renewable diesel margins widen as LCFS credits rally", age: "5h" },
  { kind: "policy" as const, flag: "BR", title: "Brazil's CNPE confirms B15 biodiesel blend schedule", age: "9h" },
  { kind: "market" as const, flag: "SG", title: "Singapore marine biofuel bunkering volumes hit record", age: "14h" },
];

const DOTS: { x: number; y: number }[] = [
  { x: 24, y: 34 }, { x: 28, y: 48 }, { x: 47, y: 26 }, { x: 50, y: 40 },
  { x: 56, y: 30 }, { x: 62, y: 44 }, { x: 70, y: 62 }, { x: 78, y: 38 },
  { x: 84, y: 52 }, { x: 30, y: 66 }, { x: 52, y: 58 }, { x: 66, y: 24 },
];

const UpdateRow: React.FC<{ u: (typeof UPDATES)[number]; i: number }> = ({ u, i }) => {
  const frame = useCurrentFrame();
  const s = spring({ frame: frame - 30 - i * 12, fps: 30, config: { damping: 18, stiffness: 150 } });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        backgroundColor: "rgba(247,245,239,0.05)",
        border: `1px solid ${C.line}`,
        borderLeft: `4px solid ${u.kind === "policy" ? C.red : C.blue}`,
        borderRadius: 6,
        padding: "20px 26px",
        opacity: s,
        transform: `translateX(${interpolate(s, [0, 1], [-70, 0])}px)`,
      }}
    >
      <Badge kind={u.kind} />
      <span
        style={{
          fontFamily: MONO,
          fontSize: 17,
          color: C.gold,
          fontWeight: 600,
          width: 44,
        }}
      >
        {u.flag}
      </span>
      <span style={{ fontFamily: DISPLAY, fontSize: 23, fontWeight: 600, color: C.paper, flex: 1 }}>
        {u.title}
      </span>
      <span style={{ fontFamily: MONO, fontSize: 16, color: C.faint }}>{u.age} ago</span>
    </div>
  );
};

const Counter: React.FC<{ value: number; label: string; delay: number; suffix?: string }> = ({
  value,
  label,
  delay,
  suffix = "",
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - p, 3);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span
        style={{
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: 74,
          color: C.paper,
          letterSpacing: "-0.02em",
        }}
      >
        {Math.round(value * eased)}
        {suffix}
      </span>
      <Label size={18}>{label}</Label>
    </div>
  );
};

export const ProductScene: React.FC = () => {
  const frame = useCurrentFrame();
  const head = spring({ frame: frame - 6, fps: 30, config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <CornerMark />
      <div style={{ position: "absolute", top: 110, left: 90, opacity: head }}>
        <Label color={C.gold} size={22}>
          One tracker
        </Label>
        <h2
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 62,
            color: C.paper,
            margin: "10px 0 0",
            letterSpacing: "-0.02em",
          }}
        >
          Every mandate and market move,
          <br />
          as it lands.
        </h2>
      </div>

      {/* left: update feed */}
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 340,
          width: 1010,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {UPDATES.map((u, i) => (
          <UpdateRow key={u.title} u={u} i={i} />
        ))}
      </div>

      {/* right: map dot field */}
      <div
        style={{
          position: "absolute",
          right: 90,
          top: 340,
          width: 620,
          height: 420,
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          backgroundColor: "rgba(247,245,239,0.03)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`,
            backgroundSize: "62px 62px",
            opacity: 0.5,
          }}
        />
        {DOTS.map((d, i) => {
          const s = spring({ frame: frame - 45 - i * 4, fps: 30, config: { damping: 12 } });
          const pulse = interpolate(Math.sin(frame / 10 + i), [-1, 1], [0.7, 1]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${d.x}%`,
                top: `${d.y}%`,
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: i % 3 === 0 ? C.red : i % 3 === 1 ? C.blue : C.gold,
                opacity: s * pulse,
                transform: `scale(${s})`,
                boxShadow: `0 0 18px ${i % 3 === 0 ? C.red : i % 3 === 1 ? C.blue : C.gold}`,
              }}
            />
          );
        })}
        <div style={{ position: "absolute", bottom: 16, left: 20 }}>
          <Label size={16}>Jurisdiction activity map</Label>
        </div>
      </div>

      {/* counters */}
      <div
        style={{
          position: "absolute",
          right: 90,
          bottom: 90,
          width: 620,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Counter value={25} suffix="+" label="Jurisdictions" delay={70} />
        <Counter value={60} suffix="+" label="Sources scanned" delay={82} />
        <Counter value={24} suffix="/7" label="Always on" delay={94} />
      </div>
    </AbsoluteFill>
  );
};
