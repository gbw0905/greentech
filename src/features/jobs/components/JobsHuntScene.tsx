import { useEffect, useRef } from "react";
import { EMPLOYERS, JOB_BOARDS, JOB_CATEGORIES } from "@/features/jobs/data";

type Point = { x: number; y: number; z: number };
type Projection = Point & { scale: number };
const TONES = ["#178a6b", "#2563a8", "#b4233c"];

/** Decorative search scene. Existing directory data supplies labels and counts. */
export function JobsHuntScene() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!stage || !canvas || !ctx) return;

    // Stable composition across mounts; no random content in server-rendered HTML.
    let seed = 73;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const cards = Array.from({ length: 26 }, (_, index) => ({
      x: (random() - 0.5) * 3.2,
      y: (random() - 0.5) * 2.4,
      z: (random() - 0.5) * 3,
      vx: (random() - 0.5) * 0.072,
      vy: (random() - 0.5) * 0.072,
      vz: 0.054 + random() * 0.042,
      rotation: (random() - 0.5) * 0.8,
      phase: random() * Math.PI * 2,
      hit: 0,
      label: JOB_CATEGORIES[index % JOB_CATEGORIES.length]!,
      color: TONES[index % TONES.length]!,
    }));
    const dust = Array.from({ length: 60 }, () => ({
      x: (random() - 0.5) * 4,
      y: (random() - 0.5) * 3,
      z: (random() - 0.5) * 3,
      radius: 0.5 + random() * 1.2,
    }));
    let width = 0;
    let height = 0;
    let scale = 0;
    let rotationX = 0;
    let rotationY = 0;
    let targetX = 0;
    let targetY = 0;
    let elapsed = 0;
    let lastTime = 0;
    let frame: number | null = null;
    let visible = false;
    let dragging = false;
    let pointerX = 0;
    let pointerY = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function project(point: Point): Projection {
      const x = point.x * Math.cos(rotationY) + point.z * Math.sin(rotationY);
      const z = -point.x * Math.sin(rotationY) + point.z * Math.cos(rotationY);
      const y = point.y * Math.cos(rotationX) - z * Math.sin(rotationX);
      const depth = point.y * Math.sin(rotationX) + z * Math.cos(rotationX);
      const perspective = 4 / (4 + depth);
      return {
        x: width / 2 + x * scale * perspective,
        y: height / 2 + y * scale * perspective,
        z: depth,
        scale: perspective,
      };
    }

    function draw(delta: number) {
      if (!width || !height) return;
      const context = ctx!;
      elapsed += delta;
      const smoothing = 1 - Math.exp(-delta * 4);
      rotationX += (targetX - rotationX) * smoothing;
      rotationY += (targetY - rotationY) * smoothing + delta * 0.05;
      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(14,42,67,.06)";
      for (let x = 16; x < width; x += 32) {
        for (let y = 16; y < height; y += 32) {
          context.beginPath();
          context.arc(x, y, 0.8, 0, Math.PI * 2);
          context.fill();
        }
      }
      const lensWorld = {
        x: Math.cos(elapsed * 0.6) * 0.55,
        y: Math.sin(elapsed * 1.1) * 0.35,
        z: Math.sin(elapsed * 0.9) * 0.25,
      };
      const lens = project(lensWorld);
      const radius = scale * 1.05 * lens.scale;
      const beam = context.createRadialGradient(lens.x, lens.y, 0, lens.x, lens.y, scale * 1.1);
      beam.addColorStop(0, "rgba(23,138,107,.20)");
      beam.addColorStop(0.6, "rgba(23,138,107,.05)");
      beam.addColorStop(1, "rgba(23,138,107,0)");
      context.fillStyle = beam;
      context.fillRect(0, 0, width, height);
      for (const particle of dust) {
        particle.z += delta * 0.15;
        if (particle.z > 1.8) particle.z = -1.8;
        const p = project(particle);
        context.beginPath();
        context.arc(p.x, p.y, particle.radius * p.scale, 0, Math.PI * 2);
        context.fillStyle = "rgba(23,138,107,.22)";
        context.fill();
      }
      const projected = cards
        .map((card) => {
          card.x += card.vx * delta;
          card.y += card.vy * delta;
          card.z += card.vz * delta;
          if (card.z > 2.2) {
            card.z = -2.2;
            card.x = (random() - 0.5) * 3.2;
            card.y = (random() - 0.5) * 2.4;
          }
          if (Math.abs(card.x) > 1.8) card.vx *= -1;
          if (Math.abs(card.y) > 1.4) card.vy *= -1;
          card.phase += delta * 0.6;
          const distance = Math.hypot(
            card.x - lensWorld.x,
            card.y - lensWorld.y,
            card.z - lensWorld.z,
          );
          card.hit += ((distance < 1.1 ? 1 : 0) - card.hit) * (1 - Math.exp(-delta * 9));
          return { card, point: project(card) };
        })
        .sort((a, b) => b.point.z - a.point.z);

      function drawCard({ card, point }: (typeof projected)[number]) {
        const w = 62 * point.scale;
        const h = 40 * point.scale;
        context.save();
        context.translate(point.x, point.y);
        context.rotate(card.rotation + Math.sin(card.phase + elapsed * 0.4) * 0.05);
        context.globalAlpha = 0.25 + Math.min(1, Math.max(0, (card.z + 2) / 4)) * 0.7;
        context.shadowColor = "rgba(14,42,67,.16)";
        context.shadowBlur = 10 * point.scale;
        context.shadowOffsetY = 4 * point.scale;
        context.beginPath();
        context.roundRect(-w / 2, -h / 2, w, h, 5 * point.scale);
        context.fillStyle = "#fff";
        context.fill();
        context.shadowBlur = 0;
        context.shadowOffsetY = 0;
        context.strokeStyle = "rgba(14,42,67,.15)";
        context.lineWidth = 1;
        context.stroke();
        context.fillStyle = card.color + "18";
        context.beginPath();
        context.roundRect(-w * 0.4, -h * 0.36, w * 0.8, h * 0.28, 3 * point.scale);
        context.fill();
        context.fillStyle = card.color;
        context.font = `600 ${7 * point.scale}px 'Instrument Sans', sans-serif`;
        context.fillText(card.label, -w * 0.35, -h * 0.16, w * 0.7);
        context.fillStyle = "rgba(14,42,67,.12)";
        for (let i = 0; i < 3; i++) {
          context.fillRect(
            -w * 0.37,
            h * (0.06 + i * 0.14),
            w * (0.65 - i * 0.12),
            2 * point.scale,
          );
        }
        if (card.hit > 0.01) {
          context.strokeStyle = `rgba(23,138,107,${card.hit * 0.65})`;
          context.lineWidth = 2;
          context.beginPath();
          context.roundRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 6 * point.scale);
          context.stroke();
        }
        context.restore();
      }

      projected.filter(({ point }) => point.z > lens.z).forEach(drawCard);
      const glow = context.createRadialGradient(
        lens.x,
        lens.y,
        radius * 0.6,
        lens.x,
        lens.y,
        radius * 1.6,
      );
      glow.addColorStop(0, "rgba(23,138,107,.22)");
      glow.addColorStop(1, "rgba(23,138,107,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
      const glass = context.createRadialGradient(
        lens.x - radius * 0.4,
        lens.y - radius * 0.4,
        0,
        lens.x,
        lens.y,
        radius,
      );
      glass.addColorStop(0, "rgba(255,255,255,.55)");
      glass.addColorStop(0.6, "rgba(23,138,107,.06)");
      glass.addColorStop(1, "rgba(255,255,255,.05)");
      context.beginPath();
      context.arc(lens.x, lens.y, radius, 0, Math.PI * 2);
      context.fillStyle = glass;
      context.fill();
      context.strokeStyle = "rgba(14,42,67,.9)";
      context.lineWidth = 5;
      context.stroke();
      context.beginPath();
      context.arc(lens.x, lens.y, radius - 3.5, 0, Math.PI * 2);
      context.strokeStyle = "rgba(23,138,107,.9)";
      context.lineWidth = 1.5;
      context.stroke();
      const handleAngle = Math.PI * 0.75;
      context.beginPath();
      context.moveTo(
        lens.x + Math.cos(handleAngle) * radius,
        lens.y + Math.sin(handleAngle) * radius,
      );
      context.lineTo(
        lens.x + Math.cos(handleAngle) * (radius + scale * 0.32),
        lens.y + Math.sin(handleAngle) * (radius + scale * 0.32),
      );
      context.lineCap = "round";
      context.strokeStyle = "#0e2a43";
      context.lineWidth = 12;
      context.stroke();
      context.strokeStyle = "rgba(23,138,107,.65)";
      context.lineWidth = 6;
      context.stroke();
      context.lineCap = "butt";
      const pulse = (elapsed / 2) % 1;
      context.beginPath();
      context.arc(lens.x, lens.y, radius * (1 + pulse * 2.2), 0, Math.PI * 2);
      context.strokeStyle = `rgba(23,138,107,${0.35 * (1 - pulse)})`;
      context.lineWidth = 2;
      context.stroke();
      projected.filter(({ point }) => point.z <= lens.z).forEach(drawCard);
    }

    function animate(now: number) {
      frame = null;
      draw(lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0);
      lastTime = now;
      frame = requestAnimationFrame(animate);
    }
    function syncAnimation() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      lastTime = 0;
      const running = visible && !document.hidden && !reducedMotion.matches;
      stage!.dataset["running"] = String(running);
      if (running) frame = requestAnimationFrame(animate);
      else draw(0);
    }
    function resize() {
      width = stage!.clientWidth;
      height = stage!.clientHeight;
      scale = Math.min(width, height) * 0.42;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(0);
    }
    function pointerDown(event: PointerEvent) {
      if (event.button !== 0 || reducedMotion.matches) return;
      dragging = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      canvas!.setPointerCapture(event.pointerId);
    }
    function pointerMove(event: PointerEvent) {
      if (reducedMotion.matches) return;
      if (dragging) {
        targetY += (event.clientX - pointerX) * 0.006;
        targetX = Math.max(-0.5, Math.min(0.5, targetX + (event.clientY - pointerY) * 0.005));
        pointerX = event.clientX;
        pointerY = event.clientY;
      } else {
        const rect = canvas!.getBoundingClientRect();
        targetY = ((event.clientX - rect.left) / rect.width - 0.5) * 0.7;
        targetX = ((event.clientY - rect.top) / rect.height - 0.5) * 0.5;
      }
    }
    function pointerUp(event: PointerEvent) {
      dragging = false;
      if (canvas!.hasPointerCapture(event.pointerId))
        canvas!.releasePointerCapture(event.pointerId);
    }
    function pointerLeave() {
      if (!dragging) {
        targetX = 0;
        targetY = 0;
      }
    }
    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      syncAnimation();
    });
    resize();
    resizeObserver.observe(stage);
    intersectionObserver.observe(stage);
    document.addEventListener("visibilitychange", syncAnimation);
    reducedMotion.addEventListener("change", syncAnimation);
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    canvas.addEventListener("lostpointercapture", pointerUp);
    canvas.addEventListener("pointerleave", pointerLeave);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", syncAnimation);
      reducedMotion.removeEventListener("change", syncAnimation);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
      canvas.removeEventListener("lostpointercapture", pointerUp);
      canvas.removeEventListener("pointerleave", pointerLeave);
    };
  }, []);

  return (
    <div ref={stageRef} className="jobs-discovery" data-running="false">
      <canvas ref={canvasRef} className="jobs-hunt-canvas" aria-hidden="true" />
      <span className="jobs-discovery-label jobs-discovery-label-top">
        <i />
        Global opportunities
      </span>
      <span className="jobs-discovery-label jobs-discovery-label-right">
        <i />
        {EMPLOYERS.length} employers
      </span>
      <span className="jobs-discovery-label jobs-discovery-label-left">
        <i />
        {JOB_BOARDS.length} trusted sources
      </span>
      <span className="jobs-discovery-label jobs-discovery-label-bottom">
        <i />
        Hiring news feed
      </span>
    </div>
  );
}
