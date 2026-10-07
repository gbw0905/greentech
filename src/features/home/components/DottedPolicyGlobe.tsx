import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import globeGeometry from "../data/globe-points.json";
import styles from "./DottedPolicyGlobe.module.css";
import { HeroFlow } from "./HeroFlow";

type Vector = readonly [number, number, number];
type Layer = "policy" | "markets" | "prices";
type Layers = Record<Layer, boolean>;
const KEYS: Layer[] = ["policy", "markets", "prices"];
const PHASES: Layers[] = [
  { policy: true, markets: false, prices: false },
  { policy: true, markets: true, prices: false },
  { policy: true, markets: true, prices: true },
];
const ROTATION_SPEED = 0.00029;
const RAD = Math.PI / 180;
const COLORS = { policy: "180,35,60", markets: "37,99,168", prices: "23,138,107" };
const NAMES = { policy: "Policy", markets: "Markets", prices: "Prices" };
const vector = (longitude: number, latitude: number): Vector => [
  Math.cos(latitude * RAD) * Math.cos(longitude * RAD),
  Math.cos(latitude * RAD) * Math.sin(longitude * RAD),
  Math.sin(latitude * RAD),
];
// Illustrative locations only: these are animation geometry, not country data.
const PINS = [
  [54, 24],
  [-98, 39],
  [-1.5, 53],
  [-51, -14],
  [78, 21],
  [113, -2],
  [9, 50],
  [-106, 56],
  [-64, -34],
  [24, -29],
  [134, -25],
  [138, 36],
  [38, 0],
].map(([lon, lat]) => vector(lon!, lat!));
const COLUMNS = [
  [-98, 39, 0.2],
  [-51, -14, 0.22],
  [78, 21, 0.16],
  [113, -2, 0.14],
  [10, 50, 0.18],
  [104, 35, 0.2],
  [-64, -34, 0.1],
  [101, 15, 0.1],
].map(([lon, lat, height]) => ({ point: vector(lon!, lat!), height: height! }));
const ARCS = [
  [
    [-95.3, 29.7],
    [4.5, 51.9],
  ],
  [
    [-46, -23],
    [4.5, 51.9],
  ],
  [
    [103.8, 1.3],
    [73, 19],
  ],
  [
    [-95.3, 29.7],
    [121, 31],
  ],
  [
    [-46, -23],
    [-95.3, 29.7],
  ],
  [
    [4.5, 51.9],
    [55, 25],
  ],
].map(([start, end]) => {
  const a = vector(start![0]!, start![1]!);
  const b = vector(end![0]!, end![1]!);
  const arcHeight = Math.min(0.35, 0.08 + 0.1 * Math.hypot(...a.map((v, axis) => v - b[axis]!)));
  return Array.from({ length: 49 }, (_, index): Vector => {
    const t = index / 48;
    const point = a.map((v, axis) => v * (1 - t) + b[axis]! * t);
    const length = Math.hypot(...point);
    const lift = 1 + arcHeight * Math.sin(Math.PI * t);
    return [(point[0]! / length) * lift, (point[1]! / length) * lift, (point[2]! / length) * lift];
  });
});
const GRID: Vector[][] = [];
for (let lat = -60; lat <= 60; lat += 30) {
  GRID.push(Array.from({ length: 121 }, (_, i) => vector(i * 3, lat)));
}
for (let lon = 0; lon < 360; lon += 30) {
  GRID.push(Array.from({ length: 61 }, (_, i) => vector(lon, -90 + i * 3)));
}

export function DottedPolicyGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layers, setLayers] = useState<Layers>(PHASES[0]!);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const controls = useRef({ layers, paused, manualUntil: 0, time: 0 });
  const renderRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    controls.current.layers = layers;
    controls.current.paused = paused;
    renderRef.current?.();
  }, [layers, paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let hasDrawn = false;
    let introTimer: ReturnType<typeof setTimeout> | undefined;
    let inView = true;
    let frame = 0;
    let previous = 0;
    let width = 0;
    let height = 0;
    let radius = 0;
    let rotation = -78 * RAD;
    let tilt = -20 * RAD;
    let velocity = ROTATION_SPEED;
    let phase = 0;
    let pointer: { id: number; x: number; y: number; type: string; dragging: boolean } | null =
      null;
    let ocean: CanvasGradient;
    let glow: CanvasGradient;
    const opacity = { policy: 1, markets: 0, prices: 0 };
    const active = () => !controls.current.paused && !motion.matches;
    const rgba = (layer: Layer, alpha: number) => `rgba(${COLORS[layer]},${alpha})`;
    const circle = (x: number, y: number, size: number) => {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
    };
    function requestRender() {
      if (!disposed && inView && !document.hidden && !frame) frame = requestAnimationFrame(draw);
    }
    const draw = (now: number) => {
      frame = 0;
      if (!inView || document.hidden || !width || !height) return;
      // Limit drawing to 30 fps. Rotation uses elapsed time, so it stays smooth.
      if (active() && previous && now - previous < 30) {
        requestRender();
        return;
      }
      const delta = previous ? Math.min(now - previous, 64) : 33;
      previous = now;
      const state = controls.current;
      if (active()) {
        state.time += delta;
        if (!pointer?.dragging) {
          velocity += (ROTATION_SPEED - velocity) * (1 - Math.exp(-delta / 900));
          rotation += velocity * delta;
        }
        const nextPhase = Math.floor(state.time / 4600) % PHASES.length;
        if (state.time >= state.manualUntil && (nextPhase !== phase || state.manualUntil > 0)) {
          phase = nextPhase;
          state.manualUntil = 0;
          state.layers = PHASES[phase]!;
          setLayers(state.layers);
        }
      }
      let transitioning = false;
      for (const key of KEYS) {
        const target = state.layers[key] ? 1 : 0;
        opacity[key] += (target - opacity[key]) * (motion.matches ? 1 : 1 - Math.exp(-delta / 220));
        if (Math.abs(target - opacity[key]) < 0.005) opacity[key] = target;
        else transitioning = true;
      }
      const cx = width / 2;
      const cy = height / 2 + (active() ? Math.sin(state.time * 0.0007) * radius * 0.009 : 0);
      const cr = Math.cos(rotation),
        sr = Math.sin(rotation),
        ct = Math.cos(tilt),
        st = Math.sin(tilt);
      const project = (point: readonly number[], scale = 1) => {
        const x = point[0]! * cr - point[1]! * sr;
        const y = point[1]! * cr + point[0]! * sr;
        return {
          x: cx + radius * y * scale,
          y: cy - radius * (point[2]! * ct + x * st) * scale,
          depth: x * ct - point[2]! * st,
        };
      };
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = glow;
      circle(cx, cy, radius * 1.15);
      ctx.fill();
      ctx.fillStyle = ocean;
      circle(cx, cy, radius);
      ctx.fill();
      ctx.strokeStyle = "rgba(125,181,172,.17)";
      ctx.lineWidth = 1;
      ctx.stroke();
      const path = (points: readonly Vector[], progress = 1) => {
        ctx.beginPath();
        let pen = false;
        for (let i = 0; i <= Math.floor((points.length - 1) * progress); i++) {
          const p = project(points[i]!);
          if (p.depth > 0.015) {
            if (pen) ctx.lineTo(p.x, p.y);
            else ctx.moveTo(p.x, p.y);
            pen = true;
          } else pen = false;
        }
        ctx.stroke();
      };
      ctx.strokeStyle = "rgba(157,187,204,.25)";
      ctx.lineWidth = 0.65;
      GRID.forEach((points) => path(points));
      ctx.fillStyle = "rgba(29,65,90,.75)";
      ctx.beginPath();
      for (const point of globeGeometry.dots) {
        const p = project(point);
        if (p.depth <= 0.015) continue;
        const size = ((0.55 + p.depth * 0.35) * radius) / 200;
        ctx.moveTo(p.x + size, p.y);
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      }
      ctx.fill();
      if (opacity.policy > 0)
        PINS.forEach((point, i) => {
          const p = project(point);
          if (p.depth <= 0.04) return;
          const size = radius * 0.016 * (0.65 + 0.35 * p.depth);
          const pulse = motion.matches ? 0.25 : (state.time * 0.0006 + i * 0.37) % 1;
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3.2);
          halo.addColorStop(0, rgba("policy", 0.32 * opacity.policy));
          halo.addColorStop(1, rgba("policy", 0));
          ctx.fillStyle = halo;
          circle(p.x, p.y, size * 3.2);
          ctx.fill();
          ctx.strokeStyle = rgba("policy", (1 - pulse) * 0.55 * opacity.policy);
          ctx.lineWidth = Math.max(1, radius * 0.007);
          circle(p.x, p.y, size * (1.3 + pulse * 2.4));
          ctx.stroke();
          ctx.fillStyle = rgba("policy", opacity.policy);
          circle(p.x, p.y, size);
          ctx.fill();
        });
      if (opacity.markets > 0)
        COLUMNS.forEach(({ point, height: columnHeight }, i) => {
          const base = project(point);
          if (base.depth <= 0.04) return;
          const growth = Math.max(0, Math.min(1, opacity.markets * 1.5 - i * 0.07));
          const top = project(point, 1 + columnHeight * (1 - (1 - growth) ** 3));
          const gradient = ctx.createLinearGradient(base.x, base.y, top.x + 0.01, top.y + 0.01);
          gradient.addColorStop(0, `rgba(156,192,234,${opacity.markets})`);
          gradient.addColorStop(1, rgba("markets", opacity.markets));
          ctx.strokeStyle = gradient;
          ctx.lineWidth = radius * 0.033;
          ctx.lineCap = "butt";
          ctx.beginPath();
          ctx.moveTo(base.x, base.y);
          ctx.lineTo(top.x, top.y);
          ctx.stroke();
        });
      if (opacity.prices > 0)
        ARCS.forEach((points, i) => {
          const visible = (p: ReturnType<typeof project>) =>
            p.depth > 0 || Math.hypot(p.x - cx, p.y - cy) > radius * 1.005;
          const progress = 1 - (1 - opacity.prices) ** 3;
          const end = Math.floor((points.length - 1) * progress);
          // Short gradient segments reproduce the mint-to-green 3D trade routes.
          ctx.lineWidth = Math.max(1, radius * 0.005);
          ctx.lineCap = "round";
          for (let j = 1; j <= end; j++) {
            const a = project(points[j - 1]!);
            const b = project(points[j]!);
            // Raised arcs behind the sphere remain visible outside its silhouette.
            if (!visible(a) || !visible(b)) continue;
            const t = j / (points.length - 1);
            ctx.strokeStyle = `rgba(${Math.round(168 - 145 * t)},${Math.round(220 - 82 * t)},${Math.round(200 - 93 * t)},${0.85 * opacity.prices})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
          const comet = motion.matches ? 0.5 : (state.time * 0.00028 + i * 0.17) % 1;
          for (let tail = 2; tail >= 0; tail--) {
            const index = Math.max(0, Math.floor(comet * 48) - tail * 2);
            if (index > end) continue;
            const p = project(points[index]!);
            if (!visible(p)) continue;
            const size = radius * (0.026 - tail * 0.006);
            const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
            halo.addColorStop(0, rgba("prices", opacity.prices * (0.95 - tail * 0.25)));
            halo.addColorStop(0.35, rgba("prices", opacity.prices * (0.45 - tail * 0.12)));
            halo.addColorStop(1, rgba("prices", 0));
            ctx.fillStyle = halo;
            circle(p.x, p.y, size);
            ctx.fill();
          }
        });
      if (!hasDrawn) {
        hasDrawn = true;
        // Crossfade only after a valid frame; never expose an empty canvas.
        if (motion.matches) setReady(true);
        else
          introTimer = setTimeout(() => {
            if (!disposed) setReady(true);
          }, 650);
      }
      if (active() || transitioning) requestRender();
    };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      radius = Math.min(width, height) * 0.405;
      ocean = ctx.createRadialGradient(
        width * 0.36,
        height * 0.32,
        radius * 0.05,
        width / 2,
        height / 2,
        radius * 1.15,
      );
      ocean.addColorStop(0, "#faffff");
      ocean.addColorStop(0.7, "#e5eff6");
      ocean.addColorStop(1, "#b6d9de");
      glow = ctx.createRadialGradient(
        width / 2,
        height / 2,
        radius * 0.94,
        width / 2,
        height / 2,
        radius * 1.15,
      );
      glow.addColorStop(0, "rgba(23,138,107,.24)");
      glow.addColorStop(1, "rgba(23,138,107,0)");
      requestRender();
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pointer = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        type: e.pointerType,
        dragging: false,
      };
    };
    const move = (e: PointerEvent) => {
      if (!pointer || pointer.id !== e.pointerId) return;
      const dx = e.clientX - pointer.x,
        dy = e.clientY - pointer.y;
      if (!pointer.dragging) {
        if (Math.abs(dx) + Math.abs(dy) < 4) return;
        // Leave vertical touch gestures available for scrolling the page.
        if (pointer.type === "touch" && Math.abs(dy) > Math.abs(dx)) return;
        canvas.setPointerCapture(e.pointerId);
        pointer.dragging = true;
        canvas.dataset["dragging"] = "true";
      }
      rotation += dx * 0.005;
      tilt = Math.max(-0.9, Math.min(0.6, tilt - dy * 0.004));
      velocity = Math.max(-0.001, Math.min(0.001, dx * 0.00016));
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      requestRender();
    };
    const release = (e: PointerEvent) => {
      if (pointer?.id !== e.pointerId) return;
      pointer = null;
      canvas.dataset["dragging"] = "false";
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      requestRender();
    };
    const keydown = (e: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      e.preventDefault();
      rotation += e.key === "ArrowLeft" ? -0.15 : e.key === "ArrowRight" ? 0.15 : 0;
      tilt = Math.max(
        -0.9,
        Math.min(0.6, tilt + (e.key === "ArrowUp" ? -0.1 : e.key === "ArrowDown" ? 0.1 : 0)),
      );
      requestRender();
    };
    const visibility = () => {
      previous = 0;
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else requestRender();
    };
    const motionChange = () => {
      if (motion.matches && hasDrawn) {
        clearTimeout(introTimer);
        setReady(true);
      }
      previous = 0;
      requestRender();
    };
    const observer = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false;
      previous = 0;
      if (!inView) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else requestRender();
    });
    observer.observe(canvas);
    intersection.observe(canvas);
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", motionChange);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", release);
    canvas.addEventListener("lostpointercapture", release);
    canvas.addEventListener("keydown", keydown);
    renderRef.current = requestRender;
    resize();
    return () => {
      disposed = true;
      clearTimeout(introTimer);
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      renderRef.current = null;
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", motionChange);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", release);
      canvas.removeEventListener("pointercancel", release);
      canvas.removeEventListener("lostpointercapture", release);
      canvas.removeEventListener("keydown", keydown);
    };
  }, []);

  return (
    <div className={styles["stage"]} data-ready={ready} data-paused={paused}>
      <HeroFlow />
      <canvas
        ref={canvasRef}
        className={styles["canvas"]}
        tabIndex={ready ? 0 : -1}
        role="img"
        aria-label="Illustrative rotating globe. Use arrow keys or drag to rotate."
      >
        Illustrative globe showing policy, markets and prices.
      </canvas>
      <div className={styles["layers"]} role="group" aria-label="Globe animation layers">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            data-layer={key}
            disabled={!ready}
            aria-pressed={layers[key]}
            onClick={() => {
              controls.current.manualUntil = controls.current.time + 8000;
              setLayers((current) => ({ ...current, [key]: !current[key] }));
            }}
          >
            {NAMES[key]}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={styles["pause"]}
        aria-label={paused ? "Resume globe animation" : "Pause globe animation"}
        aria-pressed={paused}
        onClick={() => setPaused((current) => !current)}
      >
        {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
      </button>
    </div>
  );
}
