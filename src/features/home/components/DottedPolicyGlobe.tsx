import { geoContains, geoOrthographic } from "d3-geo";
import { useEffect, useMemo, useRef } from "react";
import { feature } from "topojson-client";
import type { PolicyUpdate } from "@/features/policy/contracts";
import { COUNTRIES, countryBySlug } from "@/features/policy/taxonomy";
import globeGeometry from "../data/globe-points.json";
import globePlaceholder from "../data/globe-placeholder.svg";

type LandFeature = {
  type: "Feature";
  properties?: { name?: string };
  geometry: unknown;
};

type Marker = {
  slug: string;
  name: string;
  longitude: number;
  latitude: number;
  point: [number, number, number];
};

type ProjectedPoint = { x: number; y: number; depth: number };
type PointerStart = { x: number; y: number; dragging: boolean; pointerType: string };
type GlobeRoute = [number, number, number][];

const HUB_SLUGS = [
  "united-arab-emirates",
  "united-states",
  "united-kingdom",
  "brazil",
  "india",
  "indonesia",
  "european-union",
  "canada",
  "argentina",
  "south-africa",
  "australia",
  "japan",
  "kenya",
  "singapore",
];
const CENTROIDS = globeGeometry.centroids as unknown as Record<string, [number, number]>;
const CENTROID_OVERRIDES: Record<string, [number, number]> = {
  "United Arab Emirates": [54, 24],
  "United States of America": [-98, 39],
  "United Kingdom": [-1.5, 53],
  Brazil: [-51, -14],
  India: [78, 21],
  Indonesia: [113, -2],
  Canada: [-106, 56],
  Argentina: [-64, -34],
  "South Africa": [24, -29],
  Australia: [134, -25],
  Japan: [138, 36],
  Kenya: [38, 0],
  Singapore: [103.82, 1.35],
  "European Union": [9, 50],
};
const RADIANS = Math.PI / 180;
const FALLBACK_LOCATION: [number, number] = [54.38, 24.45];
const ROUTE_STEPS = 56;
const ROUTE_DURATION_MS = 1400;
const DRIFT_DEGREES_PER_MS = 0.00155;
// A tilted orbit, with its far half drawn behind the sphere.
const ORBIT_POINTS = Array.from({ length: 181 }, (_, index) =>
  orbitPoint((index / 180) * Math.PI * 2),
);
const COUNTRY_BY_MAP_NAME = new Map(
  COUNTRIES.filter((country) => country.mapName).map((country) => [country.mapName, country]),
);

function unitVector(longitude: number, latitude: number): [number, number, number] {
  const lon = longitude * RADIANS;
  const lat = latitude * RADIANS;
  return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
}

function projectPoint(
  point: readonly number[],
  cosRotation: number,
  sinRotation: number,
  cosTilt: number,
  sinTilt: number,
  centreX: number,
  centreY: number,
  radius: number,
): ProjectedPoint {
  const longitudeX = point[0]! * cosRotation - point[1]! * sinRotation;
  const longitudeY = point[1]! * cosRotation + point[0]! * sinRotation;
  return {
    x: centreX + radius * longitudeY,
    y: centreY - radius * (point[2]! * cosTilt + longitudeX * sinTilt),
    depth: longitudeX * cosTilt - point[2]! * sinTilt,
  };
}

function markerForSlug(slug: string): Marker | null {
  const country = countryBySlug(slug);
  const coordinate = country
    ? (CENTROID_OVERRIDES[country.mapName || country.name] ?? CENTROIDS[country.mapName])
    : null;
  if (!country || !coordinate) return null;
  return {
    slug,
    name: country.name,
    longitude: coordinate[0],
    latitude: coordinate[1],
    point: unitVector(coordinate[0], coordinate[1]),
  };
}

function focusTilt(latitude: number) {
  return -Math.max(-0.1, Math.min(0.65, latitude * RADIANS * 0.55 + 0.18)) / RADIANS;
}

function orbitPoint(angle: number) {
  const x = Math.cos(angle) * 1.34;
  const z = Math.sin(angle) * 1.34;
  const y = -z * Math.sin(1.12);
  return {
    x: x * Math.cos(-0.32) - y * Math.sin(-0.32),
    y: x * Math.sin(-0.32) + y * Math.cos(-0.32),
    depth: z * Math.cos(1.12),
  };
}

function routesFrom(active: Marker, markers: Marker[]): GlobeRoute[] {
  const hubs = HUB_SLUGS.map((slug) => markers.find((marker) => marker.slug === slug)).filter(
    (marker): marker is Marker => Boolean(marker),
  );
  const activeIndex = hubs.findIndex((marker) => marker.slug === active.slug);
  const targets =
    activeIndex >= 0
      ? [3, 6, 9].map((offset) => hubs[(activeIndex + offset) % hubs.length]!)
      : [2, 3, 10].map((index) => hubs[index]!);

  return targets
    .filter((target) => target && target.slug !== active.slug)
    .map((target) => {
      const from = active.point;
      const to = target.point;
      const angle = Math.acos(
        Math.max(-1, Math.min(1, from[0] * to[0] + from[1] * to[1] + from[2] * to[2])),
      );
      const sine = Math.sin(angle);
      return Array.from({ length: ROUTE_STEPS + 1 }, (_, index) => {
        const t = index / ROUTE_STEPS;
        const a = sine > 0.00001 ? Math.sin((1 - t) * angle) / sine : 1 - t;
        const b = sine > 0.00001 ? Math.sin(t * angle) / sine : t;
        const lift = 1 + 0.24 * Math.sin(Math.PI * t);
        return [
          (from[0] * a + to[0] * b) * lift,
          (from[1] * a + to[1] * b) * lift,
          (from[2] * a + to[2] * b) * lift,
        ];
      });
    });
}

export function DottedPolicyGlobe({
  focusKey,
  countrySlug,
  countryName,
  updates,
  onSelectCountry,
}: {
  focusKey: string | null;
  countrySlug: string | null;
  countryName: string | null;
  updates: PolicyUpdate[];
  onSelectCountry: (slug: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const featuresRef = useRef<LandFeature[]>([]);
  const markersRef = useRef<Marker[]>([]);
  const activeRef = useRef<{ slug: string | null; name: string | null }>({
    slug: countrySlug,
    name: countryName,
  });
  const focusKeyRef = useRef(focusKey);
  const selectRef = useRef(onSelectCountry);
  const requestRenderRef = useRef<(() => void) | null>(null);

  const markers = useMemo(() => {
    const slugs = new Set(HUB_SLUGS);
    for (const update of updates) if (update.countrySlug) slugs.add(update.countrySlug);
    return [...slugs].map(markerForSlug).filter((marker): marker is Marker => marker !== null);
  }, [updates]);

  useEffect(() => {
    markersRef.current = markers;
    focusKeyRef.current = focusKey;
    activeRef.current = { slug: countrySlug, name: countryName };
    selectRef.current = onSelectCountry;
    requestRenderRef.current?.();
  }, [markers, focusKey, countrySlug, countryName, onSelectCountry]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let disposed = false;
    fetch("/world-110m.json")
      .then((response) => response.json())
      .then((topology) => {
        if (disposed) return;
        featuresRef.current = (
          feature(topology, topology.objects.countries) as unknown as { features: LandFeature[] }
        ).features;
      })
      .catch(() => {
        featuresRef.current = [];
      });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let visible = true;
    let width = 0;
    let height = 0;
    let radius = 0;
    let ocean: CanvasGradient;
    let glow: CanvasGradient;
    let shade: CanvasGradient;
    let rotation = -FALLBACK_LOCATION[0];
    let tilt = focusTilt(FALLBACK_LOCATION[1]);
    let holdUntil = 0;
    let lastFrameAt = 0;
    let pointer: PointerStart | null = null;
    let hoverPoint: { x: number; y: number } | null = null;
    let focusedSlug = activeRef.current.slug;
    let focusedKey = focusKeyRef.current;
    let arcStartedAt = performance.now();
    let animationTime = 0;

    const initialMarker = markersRef.current.find(
      (marker) => marker.slug === activeRef.current.slug,
    );
    if (initialMarker) {
      rotation = -initialMarker.longitude;
      tilt = focusTilt(initialMarker.latitude);
    }
    let targetRotation = rotation;
    let targetTilt = tilt;
    let routes = initialMarker ? routesFrom(initialMarker, markersRef.current) : [];

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = bounds.width;
      height = bounds.height;
      radius = Math.min(width, height) * 0.36;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      ocean = context.createRadialGradient(
        width / 2 - radius * 0.3,
        height / 2 - radius * 0.35,
        radius * 0.08,
        width / 2,
        height / 2,
        radius,
      );
      ocean.addColorStop(0, "#ffffff");
      ocean.addColorStop(1, "#dbe8f1");
      glow = context.createRadialGradient(
        width / 2,
        height / 2,
        radius * 0.98,
        width / 2,
        height / 2,
        radius * 1.3,
      );
      glow.addColorStop(0, "rgba(23,138,107,.13)");
      glow.addColorStop(1, "rgba(23,138,107,0)");
      shade = context.createRadialGradient(
        width / 2 - radius * 0.3,
        height / 2 - radius * 0.35,
        radius * 0.4,
        width / 2,
        height / 2,
        radius * 1.02,
      );
      shade.addColorStop(0, "rgba(14,42,67,0)");
      shade.addColorStop(1, "rgba(14,42,67,.13)");
      draw(performance.now());
    };

    const drawOrbit = (front: boolean, centreX: number, centreY: number) => {
      context.lineWidth = 1;
      context.strokeStyle = front ? "rgba(14,42,67,.20)" : "rgba(14,42,67,.09)";
      context.beginPath();
      let pen = false;
      for (const point of ORBIT_POINTS) {
        if (point.depth >= 0 === front) {
          const x = centreX + radius * point.x;
          const y = centreY - radius * point.y;
          if (pen) context.lineTo(x, y);
          else context.moveTo(x, y);
          pen = true;
        } else pen = false;
      }
      context.stroke();
      const dot = orbitPoint(animationTime * 0.00022);
      if (dot.depth >= 0 !== front) return;
      context.fillStyle = "rgba(23,138,107,.18)";
      context.beginPath();
      context.arc(
        centreX + radius * dot.x,
        centreY - radius * dot.y,
        front ? 8 : 6,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.fillStyle = "#178a6b";
      context.beginPath();
      context.arc(
        centreX + radius * dot.x,
        centreY - radius * dot.y,
        front ? 3.4 : 2.6,
        0,
        Math.PI * 2,
      );
      context.fill();
    };

    const draw = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || !width || !height) return;
      if (!reducedMotion && now - lastFrameAt < 30) {
        requestRender();
        return;
      }
      const delta = lastFrameAt ? Math.min(now - lastFrameAt, 50) : 16;
      lastFrameAt = now;
      if (!reducedMotion) animationTime += delta;

      const active = markersRef.current.find((marker) => marker.slug === activeRef.current.slug);
      if (focusedSlug !== activeRef.current.slug || focusedKey !== focusKeyRef.current) {
        focusedSlug = activeRef.current.slug;
        focusedKey = focusKeyRef.current;
        if (active) {
          targetRotation = rotation + ((((-active.longitude - rotation) % 360) + 540) % 360) - 180;
          targetTilt = focusTilt(active.latitude);
        }
        routes = active ? routesFrom(active, markersRef.current) : [];
        arcStartedAt = now;
        holdUntil = 0;
      }
      if (!pointer?.dragging && now > holdUntil) {
        if (!reducedMotion) targetRotation += delta * DRIFT_DEGREES_PER_MS;
        const shortestTurn = ((((targetRotation - rotation) % 360) + 540) % 360) - 180;
        const ease = reducedMotion ? 1 : 1 - Math.exp(-delta / 460);
        rotation += shortestTurn * ease;
        tilt += (targetTilt - tilt) * ease;
      }

      const centreX = width / 2;
      const centreY = height / 2;
      const cosRotation = Math.cos(rotation * RADIANS);
      const sinRotation = Math.sin(rotation * RADIANS);
      const cosTilt = Math.cos(tilt * RADIANS);
      const sinTilt = Math.sin(tilt * RADIANS);
      const project = (point: readonly number[]) =>
        projectPoint(point, cosRotation, sinRotation, cosTilt, sinTilt, centreX, centreY, radius);

      context.clearRect(0, 0, width, height);
      context.fillStyle = glow;
      context.beginPath();
      context.arc(centreX, centreY, radius * 1.3, 0, Math.PI * 2);
      context.fill();
      drawOrbit(false, centreX, centreY);

      context.fillStyle = ocean;
      context.beginPath();
      context.arc(centreX, centreY, radius, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "rgba(14,42,67,.10)";
      context.lineWidth = 1;
      context.stroke();

      context.fillStyle = "rgba(20,68,98,.85)";
      context.beginPath();
      for (const point of globeGeometry.dots) {
        const pointX = point[0]!;
        const pointY = point[1]!;
        const pointZ = point[2]!;
        const longitudeX = pointX * cosRotation - pointY * sinRotation;
        const depth = longitudeX * cosTilt - pointZ * sinTilt;
        if (depth <= 0.025) continue;
        const longitudeY = pointY * cosRotation + pointX * sinRotation;
        const x = centreX + radius * longitudeY;
        const y = centreY - radius * (pointZ * cosTilt + longitudeX * sinTilt);
        const size = (0.9 + depth) * (radius / 210) * 1.25;
        context.moveTo(x + size, y);
        context.arc(x, y, size, 0, Math.PI * 2);
      }
      context.fill();
      context.fillStyle = shade;
      context.beginPath();
      context.arc(centreX, centreY, radius, 0, Math.PI * 2);
      context.fill();

      const visibleMarkers = markersRef.current
        .map((marker) => ({ marker, position: project(marker.point) }))
        .filter(({ position }) => position.depth > 0.12);
      const activePosition = visibleMarkers.find(
        ({ marker }) => marker.slug === active?.slug,
      )?.position;

      const routeProgress = reducedMotion
        ? 1
        : Math.min(1, (now - arcStartedAt) / ROUTE_DURATION_MS);
      const routeEase = 1 - (1 - routeProgress) ** 3;
      routes.forEach((route, index) => {
        const progress = Math.min(1, Math.max(0, routeEase * 1.25 - index * 0.12));
        if (!progress) return;
        context.strokeStyle = "rgba(23,138,107,.55)";
        context.lineWidth = 1.3;
        context.beginPath();
        let pen = false;
        let end: ProjectedPoint | null = null;
        for (let step = 0; step <= Math.floor(ROUTE_STEPS * progress); step++) {
          const point = project(route[step]!);
          const outsideSphere = Math.hypot(point.x - centreX, point.y - centreY) > radius;
          if ((point.depth > 0 || outsideSphere) && point.depth > -0.05) {
            if (pen) context.lineTo(point.x, point.y);
            else context.moveTo(point.x, point.y);
            pen = true;
            end = point;
          } else pen = false;
        }
        context.stroke();
        if (end && progress < 1) {
          context.fillStyle = "#178a6b";
          context.beginPath();
          context.arc(end.x, end.y, 2.6, 0, Math.PI * 2);
          context.fill();
        }
      });

      for (const { marker, position } of visibleMarkers) {
        const selected = marker.slug === active?.slug;
        const size = (selected ? 5.5 : 3.6) * (0.75 + 0.25 * position.depth);
        if (!reducedMotion) {
          const pulse = (animationTime * 0.0007 + marker.longitude / 360 + 1) % 1;
          context.strokeStyle = `rgba(23,138,107,${0.45 * (1 - pulse)})`;
          context.lineWidth = 1.2;
          context.beginPath();
          context.arc(position.x, position.y, size + pulse * (selected ? 17 : 11), 0, Math.PI * 2);
          context.stroke();
        }
        context.fillStyle = "#178a6b";
        context.beginPath();
        context.arc(position.x, position.y, size, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = "rgba(255,255,255,.96)";
        context.lineWidth = 1.6;
        context.stroke();
      }

      const hovered =
        !pointer?.dragging && hoverPoint
          ? visibleMarkers.find(
              ({ position }) =>
                Math.hypot(position.x - hoverPoint!.x, position.y - hoverPoint!.y) < 16,
            )
          : null;
      const labelPosition = hovered?.position ?? activePosition;
      const labelMarker = hovered?.marker ?? active;
      if (labelPosition && labelMarker) {
        const label = hovered ? hovered.marker.name : activeRef.current.name || labelMarker.name;
        context.font = '600 13px "Instrument Sans", sans-serif';
        const labelWidth = context.measureText(label).width + 22;
        const labelX = Math.max(8, Math.min(width - labelWidth - 8, labelPosition.x + 15));
        const labelY = Math.max(8, Math.min(height - 36, labelPosition.y - 34));
        context.fillStyle = "rgba(255,255,255,.96)";
        context.beginPath();
        context.roundRect(labelX, labelY, labelWidth, 28, 14);
        context.fill();
        context.strokeStyle = "rgba(214,225,234,.95)";
        context.lineWidth = 1;
        context.stroke();
        context.fillStyle = "#0e2a43";
        context.textBaseline = "middle";
        context.fillText(label, labelX + 11, labelY + 14);
      }

      drawOrbit(true, centreX, centreY);

      canvas.dataset["ready"] = "true";
      if (!reducedMotion) requestRender();
    };

    function requestRender() {
      if (!disposed && visible && !document.hidden && !frame) {
        frame = requestAnimationFrame(draw);
      }
    }
    requestRenderRef.current = requestRender;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      pointer = {
        x: event.clientX,
        y: event.clientY,
        dragging: false,
        pointerType: event.pointerType,
      };
    };
    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      hoverPoint = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      if (!pointer) {
        const distance = Math.hypot(
          event.clientX - bounds.left - width / 2,
          event.clientY - bounds.top - height / 2,
        );
        canvas.style.cursor = distance <= radius ? "pointer" : "grab";
        requestRender();
        return;
      }
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      if (!pointer.dragging) {
        if (Math.abs(dx) + Math.abs(dy) < 6) return;
        if (pointer.pointerType === "touch" && Math.abs(dy) > Math.abs(dx)) return;
        pointer.dragging = true;
        canvas.setPointerCapture(event.pointerId);
        canvas.style.cursor = "grabbing";
      }
      rotation += dx * 0.28;
      tilt = Math.max(-55, Math.min(55, tilt - dy * 0.2));
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      requestRender();
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!pointer) return;
      const wasDragging = pointer.dragging;
      pointer = null;
      canvas.style.cursor = "grab";
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (wasDragging) {
        holdUntil = performance.now() + 7000;
        return;
      }
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const nearest = markersRef.current
        .map((marker) => ({
          marker,
          projected: projectPoint(
            marker.point,
            Math.cos(rotation * RADIANS),
            Math.sin(rotation * RADIANS),
            Math.cos(tilt * RADIANS),
            Math.sin(tilt * RADIANS),
            width / 2,
            height / 2,
            radius,
          ),
        }))
        .find(
          ({ projected }) =>
            projected.depth > 0 && Math.hypot(projected.x - x, projected.y - y) < 14,
        );
      if (nearest) {
        selectRef.current(nearest.marker.slug);
        return;
      }
      if (Math.hypot(x - width / 2, y - height / 2) > radius || !featuresRef.current.length) {
        return;
      }
      const coordinates = geoOrthographic()
        .translate([width / 2, height / 2])
        .scale(radius)
        .rotate([rotation, tilt])
        .invert?.([x, y]);
      if (!coordinates) return;
      const country = featuresRef.current.find((item) => geoContains(item as never, coordinates));
      const slug = country?.properties?.name
        ? COUNTRY_BY_MAP_NAME.get(country.properties.name)?.slug
        : null;
      if (slug) selectRef.current(slug);
    };
    const onPointerCancel = () => {
      pointer = null;
      hoverPoint = null;
      canvas.style.cursor = "grab";
    };
    const onPointerLeave = () => {
      hoverPoint = null;
      if (pointer && !pointer.dragging) pointer = null;
      requestRender();
    };
    const onVisibilityChange = () => {
      if (document.hidden && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        requestRender();
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) requestRender();
        else if (frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      },
      { rootMargin: "80px" },
    );

    observer.observe(canvas);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("pointerleave", onPointerLeave);
    resize();

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      requestRenderRef.current = null;
      observer.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="home-policy-globe absolute inset-0 size-full touch-pan-y"
        role="button"
        tabIndex={0}
        aria-label={
          countrySlug
            ? `Interactive policy globe focused on ${countryName ?? "selected country"}. Press Enter to open its profile.`
            : "Interactive policy globe. Drag to explore countries."
        }
        onKeyDown={(event) => {
          if (countrySlug && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onSelectCountry(countrySlug);
          }
        }}
      />
      <img
        src={globePlaceholder}
        alt=""
        aria-hidden="true"
        width={600}
        height={600}
        className="home-globe-placeholder pointer-events-none absolute inset-0 size-full"
      />
    </>
  );
}
