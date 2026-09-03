// Shared theme + tiny primitives for the explainer video.
import React from "react";
import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { loadFont as loadPlex } from "@remotion/google-fonts/IBMPlexMono";

export const { fontFamily: DISPLAY } = loadSora("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});
export const { fontFamily: MONO } = loadPlex("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const C = {
  navy: "#0c1a2e",
  navyDeep: "#081222",
  ink: "#12233c",
  paper: "#f7f5ef",
  cream: "#efe9dc",
  line: "rgba(247,245,239,0.14)",
  red: "#e0453a",
  blue: "#2f7fe0",
  gold: "#d9a441",
  teal: "#2e8f83",
  muted: "rgba(247,245,239,0.62)",
  faint: "rgba(247,245,239,0.38)",
};

export const Label: React.FC<{
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({ children, color = C.muted, size = 22, style }) => (
  <span
    style={{
      fontFamily: MONO,
      fontSize: size,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      color,
      fontWeight: 500,
      ...style,
    }}
  >
    {children}
  </span>
);

export const Badge: React.FC<{ kind: "policy" | "market"; style?: React.CSSProperties }> = ({
  kind,
  style,
}) => (
  <span
    style={{
      fontFamily: MONO,
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: "0.14em",
      color: C.paper,
      backgroundColor: kind === "policy" ? C.red : C.blue,
      padding: "4px 12px",
      borderRadius: 3,
      ...style,
    }}
  >
    {kind === "policy" ? "POLICY" : "MARKET"}
  </span>
);
