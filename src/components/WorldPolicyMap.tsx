import { geoNaturalEarth1, geoPath, geoGraticule10 } from "d3-geo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, Maximize2 } from "lucide-react";
import {
  COUNTRIES,
  POLICY_STATUS_COLOR,
  policyStatusFor,
  type PolicyStatus,
} from "@/lib/policy-taxonomy";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getCountryIndicesFn } from "@/lib/country-markets.functions";

interface GeoFeature {
  type: "Feature";
  properties: { name: string };
  geometry: unknown;
}

const WIDTH = 900;
const HEIGHT = 400;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function WorldPolicyMap({
  counts,
  activeCountry,
  onSelect,
}: {
  counts: Record<string, number>;
  activeCountry: string | null;
  onSelect: (slug: string | null) => void;
}) {
  const [features, setFeatures] = useState<GeoFeature[] | null>(null);
  const { data: marketData } = useQuery({
    queryKey: ["country-indices"],
    queryFn: () => getCountryIndicesFn(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    gcTime: Infinity,
  });
  const indices = marketData?.indices ?? {};
  const [hover, setHover] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const moved = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/world-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        if (cancelled) return;
        const geo = feature(topo, topo.objects.countries) as unknown as {
          features: GeoFeature[];
        };
        setFeatures(geo.features);
      })
      .catch(() => setFeatures([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const { path, graticule } = useMemo(() => {
    const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], { type: "Sphere" });
    const p = geoPath(projection);
    return { path: p, graticule: p(geoGraticule10()) ?? "" };
  }, []);

  const byMapName = useMemo(() => {
    const m = new Map<string, (typeof COUNTRIES)[number]>();
    for (const c of COUNTRIES) if (c.mapName) m.set(c.mapName, c);
    return m;
  }, []);

  const zoomAt = useCallback((factor: number, px?: number, py?: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = px ?? rect.width / 2;
    const cy = py ?? rect.height / 2;
    setView((v) => {
      const next = clamp(v.z * factor, MIN_ZOOM, MAX_ZOOM);
      const k = next / v.z;
      return { z: next, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k };
    });
  }, []);

  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const rect = el.getBoundingClientRect();
      zoomAtRef.current(Math.exp(-dy * 0.0018), e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const hovered = hover ? byMapName.get(hover) : null;
  const hoveredIndex = hovered ? indices[hovered.slug] : undefined;
  const zoomed = view.z > 1.01 || view.x !== 0 || view.y !== 0;

  return (
    <div className="flex h-full flex-col">
      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 cursor-grab overflow-hidden rounded-[var(--radius)] border border-border bg-surface-2/40 active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          drag.current = { px: e.clientX, py: e.clientY, ox: view.x, oy: view.y };
          moved.current = false;
        }}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.px;
          const dy = e.clientY - d.py;
          if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
          setView((v) => ({ ...v, x: d.ox + dx, y: d.oy + dy }));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerLeave={() => {
          drag.current = null;
          setHover(null);
          setTip(null);
        }}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-full w-full select-none"
          role="img"
          aria-label="World map of biofuel policy activity"
        >
          <g transform={`translate(${view.x},${view.y}) scale(${view.z})`}>
            <path d={graticule} fill="none" stroke="var(--grid)" strokeWidth={0.4} opacity={0.5} />
            {features?.map((f, i) => {
              const country = byMapName.get(f.properties.name);
              const count = country ? (counts[country.slug] ?? 0) : 0;
              const isActive = country && country.slug === activeCountry;
              const isHover = Boolean(country) && f.properties.name === hover;
              const hasActivity = country && count > 0;
              const status = country ? policyStatusFor(country) : null;
              return (
                <path
                  key={i}
                  d={path(f as never) ?? ""}
                  fill={status ? POLICY_STATUS_COLOR[status] : "var(--muted)"}
                  fillOpacity={
                    country
                      ? isHover
                        ? 0.95
                        : hasActivity
                          ? Math.min(0.7 + count * 0.04, 0.95)
                          : 0.55
                      : 1
                  }
                  stroke={
                    isActive ? "var(--primary)" : isHover ? "var(--foreground)" : "var(--muted-foreground)"
                  }
                  strokeWidth={(isActive ? 1.6 : isHover ? 1 : 0.6) / view.z}
                  className={
                    country
                      ? "cursor-pointer transition-[fill-opacity] duration-200"
                      : "pointer-events-none"
                  }
                  onMouseEnter={() => country && setHover(f.properties.name)}
                  onClick={() => {
                    if (moved.current || !country) return;
                    onSelect(country.slug === activeCountry ? null : country.slug);
                  }}
                />
              );
            })}
          </g>
        </svg>

        {hovered && tip && (
          <div
            className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-md border border-border bg-surface px-2.5 py-1.5 shadow-[var(--shadow-lift)]"
            style={{ left: tip.x, top: tip.y }}
          >
            <div className="font-display text-xs font-semibold whitespace-nowrap">
              {hovered.name}
            </div>
            <div className="label-mono text-primary">
              {counts[hovered.slug] ?? 0} updates
            </div>
            <dl className="mt-1.5 space-y-1 border-t border-border pt-1.5 font-mono text-[10px] text-muted-foreground">
              <div className="flex items-baseline justify-between gap-2">
                <dt>Index</dt>
                <dd className="truncate text-right text-foreground">
                  {hoveredIndex?.index ?? "—"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt>Last</dt>
                <dd className="text-right text-foreground">
                  {hoveredIndex
                    ? `${hoveredIndex.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${hoveredIndex.currency}`
                    : "loading…"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt>1D</dt>
                <dd
                  className="text-right"
                  style={{
                    color: hoveredIndex
                      ? hoveredIndex.changePct >= 0
                        ? "var(--success, oklch(0.65 0.18 150))"
                        : "var(--destructive)"
                      : undefined,
                  }}
                >
                  {hoveredIndex
                    ? `${hoveredIndex.changePct >= 0 ? "▲" : "▼"} ${Math.abs(hoveredIndex.changePct).toFixed(2)}%`
                    : "—"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt>Region</dt>
                <dd className="truncate text-right text-foreground">{hovered.region}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {[
            { icon: Plus, label: "Zoom in", run: () => zoomAt(1.4) },
            { icon: Minus, label: "Zoom out", run: () => zoomAt(1 / 1.4) },
          ].map(({ icon: Icon, label, run }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={run}
              className="grid size-7 place-items-center rounded-md border border-border bg-surface/90 text-muted-foreground backdrop-blur transition-colors hover:text-primary"
            >
              <Icon className="size-3.5" />
            </button>
          ))}
          {zoomed && (
            <button
              type="button"
              aria-label="Reset view"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setView({ z: 1, x: 0, y: 0 })}
              className="grid size-7 place-items-center rounded-md border border-border bg-surface/90 text-muted-foreground backdrop-blur transition-colors hover:text-primary"
            >
              <Maximize2 className="size-3.5" />
            </button>
          )}
        </div>

        {!features && (
          <div className="label-mono absolute inset-0 flex items-center justify-center text-muted-foreground">
            Loading map…
          </div>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <div className="label-mono flex items-center gap-2 text-muted-foreground">
          <span
            className="size-2.5 rounded-[3px] border border-border"
            style={{ background: "var(--primary)" }}
          />
          Policy activity intensity
        </div>
        {hovered ? (
          <div className="label-mono text-foreground">
            {hovered.name} ·{" "}
            <Link
              to="/countries/$slug"
              params={{ slug: hovered.slug }}
              className="text-primary underline-offset-4 hover:underline"
            >
              full profile page
            </Link>
          </div>
        ) : (
          <div className="label-mono text-muted-foreground">
            Scroll to zoom · drag to pan · click a country to load its profile below
          </div>
        )}
        {hoveredIndex && (
          <div className="label-mono font-mono text-muted-foreground">
            {hoveredIndex.index} {hoveredIndex.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        )}
        <div className="label-mono font-mono text-muted-foreground">{view.z.toFixed(1)}×</div>
      </div>
    </div>
  );
}