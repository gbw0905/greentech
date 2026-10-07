import { useId, type CSSProperties } from "react";
import styles from "./DottedPolicyGlobe.module.css";

const NODES = [
  {
    name: "Feedstock",
    x: 260,
    y: 60,
    color: "#178a6b",
    icon: "M0 10V-2M0-2c-9 0-11-9-11-9 8-1 11 4 11 9M0 3c7 0 9-7 9-7-6-1-9 3-9 7",
  },
  {
    name: "Refining",
    x: 460,
    y: 260,
    color: "#2563a8",
    icon: "M-4-11h8M-2.5-11v8L-10 10h20L2.5-3v-8",
  },
  {
    name: "Fuel",
    x: 260,
    y: 460,
    color: "#0e2a43",
    icon: "M0-11c6 8 9 12 9 16a9 9 0 0 1-18 0c0-4 3-8 9-16z",
  },
  {
    name: "Policy",
    x: 60,
    y: 260,
    color: "#b4233c",
    icon: "M0-11l10 4v6c0 7-4 10-10 12-6-2-10-5-10-12v-6z",
  },
];

// Visible from the first server-rendered paint, and retained if canvas is unavailable.
export function HeroFlow() {
  const gradient = useId();
  return (
    <div className={styles["flow"]} aria-hidden="true">
      <svg viewBox="0 0 520 540" focusable="false">
        <defs>
          <radialGradient id={gradient}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="260" cy="260" r="255" fill={`url(#${gradient})`} />
        <circle className={styles["flowTrack"]} cx="260" cy="260" r="200" />
        <circle className={styles["flowRing"]} cx="260" cy="260" r="140" />
        <circle className={styles["flowRing"]} cx="260" cy="260" r="80" fill="#e3f4ee" />
        <g className={styles["flowPackets"]}>
          <circle cx="260" cy="60" r="6" fill="#178a6b" />
          <circle cx="224" cy="63" r="4.5" fill="#178a6b" opacity=".55" />
          <circle cx="190" cy="73" r="3" fill="#178a6b" opacity=".3" />
        </g>
        {NODES.map((node, index) => (
          <g
            key={node.name}
            transform={`translate(${node.x} ${node.y})`}
            className={styles["flowNode"]}
            style={{ "--node-color": node.color, "--delay": `${index * 3}s` } as CSSProperties}
          >
            <circle className={styles["flowPulse"]} r="32" />
            <circle className={styles["flowDisc"]} r="32" />
            <path d={node.icon} className={styles["flowIcon"]} />
            <text y="56">{node.name}</text>
          </g>
        ))}
        <text className={styles["flowCaption"]} x="260" y="240">
          Now tracking
        </text>
        {["Ethanol", "Biodiesel", "Aviation fuel", "Biogas"].map((word, index) => (
          <text
            key={word}
            data-first={index === 0}
            className={styles["flowWord"]}
            x="260"
            y="282"
            style={{ "--delay": `${index * 3}s` } as CSSProperties}
          >
            {word}
          </text>
        ))}
      </svg>
    </div>
  );
}
