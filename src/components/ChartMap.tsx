import { useEffect, useMemo, useState } from "react";
import { geoNaturalEarth1, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { heatColor } from "@/components/chart-kit";
import type { NewsTarget } from "@/components/chart-kit";

export type MapPoint = {
  key: string;
  label: string;
  /** Country as stored in the dataset. */
  country: string;
  value: number;
  sub?: string | undefined;
  newsTarget?: NewsTarget | undefined;
};

interface GeoFeature {
  type: "Feature";
  properties: { name: string };
  geometry: unknown;
}

const WIDTH = 900;
const HEIGHT = 460;

/** Dataset country names that differ from the Natural Earth map names. */
const MAP_ALIAS: Record<string, string> = {
  "United States": "United States of America",
  USA: "United States of America",
  UK: "United Kingdom",
  Czechia: "Czech Republic",
  "Ivory Coast": "Côte d'Ivoire",
  "Republic of Korea": "South Korea",
  Korea: "South Korea",
  "South Korea": "South Korea",
  "Hong Kong": "China",
  Taiwan: "Taiwan",
  Serbia: "Republic of Serbia",
  Tanzania: "United Republic of Tanzania",
  Bosnia: "Bosnia and Herzegovina",
  Eswatini: "eSwatini",
  "North Macedonia": "Macedonia",
  Myanmar: "Myanmar",
  UAE: "United Arab Emirates",
  Singapore: "Singapore",
};

/** Deterministic pseudo-random in [0,1) from a string, so markers never jump. */
function hash01(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Country-level facility map. Entities are plotted on the jurisdiction they
 * operate from; when the panel is filtered to a single country the map zooms
 * into that country and spreads its entities so each one is clickable.
 */
export function ChartMap({
  points,
  measureLabel,
  unitLabel,
  format,
  onSelect,
}: {
  points: MapPoint[];
  measureLabel: string;
  unitLabel: string;
  format: (n: number) => string;
  onSelect?: (t: NewsTarget) => void;
}) {
  const [features, setFeatures] = useState<GeoFeature[] | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; p: MapPoint } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/world-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        if (cancelled) return;
        const geo = feature(topo, topo.objects.countries) as unknown as { features: GeoFeature[] };
        setFeatures(geo.features);
      })
      .catch(() => setFeatures([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const countries = useMemo(
    () => [...new Set(points.map((p) => p.country).filter(Boolean))],
    [points],
  );
  const focus = countries.length === 1 ? countries[0]! : null;

  const byName = useMemo(() => {
    const m = new Map<string, GeoFeature>();
    for (const f of features ?? []) m.set(f.properties.name, f);
    return m;
  }, [features]);

  const featureFor = (country: string) =>
    byName.get(MAP_ALIAS[country] ?? country) ?? byName.get(country);

  const focusFeature = focus ? featureFor(focus) : undefined;

  const { path, projection } = useMemo(() => {
    if (focusFeature) {
      const proj = geoMercator().fitExtent(
        [
          [28, 28],
          [WIDTH - 28, HEIGHT - 28],
        ],
        focusFeature as never,
      );
      return { path: geoPath(proj), projection: proj };
    }
    const proj = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], { type: "Sphere" });
    return { path: geoPath(proj), projection: proj };
  }, [focusFeature]);

  const max = Math.max(...points.map((p) => p.value), 0) || 1;

  const placed = useMemo(() => {
    const perCountry = new Map<string, MapPoint[]>();
    for (const p of points) {
      const list = perCountry.get(p.country) ?? [];
      list.push(p);
      perCountry.set(p.country, list);
    }
    const out: { p: MapPoint; x: number; y: number; r: number }[] = [];
    for (const [country, list] of perCountry) {
      const f = featureFor(country);
      if (!f) continue;
      const c = path.centroid(f as never);
      if (!Number.isFinite(c[0]) || !Number.isFinite(c[1])) continue;
      const bounds = path.bounds(f as never);
      const spread = Math.min(
        Math.max((bounds[1][0] - bounds[0][0]) * 0.28, 14),
        focus ? 150 : 34,
      );
      list.forEach((p, i) => {
        if (list.length === 1) {
          out.push({ p, x: c[0], y: c[1], r: 6 + 12 * Math.sqrt(p.value / max) });
          return;
        }
        const angle = (i / list.length) * Math.PI * 2 + hash01(p.key) * 0.9;
        const ring = 0.45 + 0.55 * hash01(p.key + country);
        out.push({
          p,
          x: c[0] + Math.cos(angle) * spread * ring,
          y: c[1] + Math.sin(angle) * spread * ring * 0.7,
          r: 5 + 11 * Math.sqrt(p.value / max),
        });
      });
    }
    return out.sort((a, b) => b.r - a.r);
  }, [points, path, max, focus, byName]);

  if (!features) {
    return <p className="text-sm text-muted-foreground">Loading map…</p>;
  }

  return (
    <div className="min-w-0">
      <div className="relative w-full overflow-hidden rounded-[var(--radius)] border border-border bg-surface-2/40">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Map of ${points.length} entities by ${measureLabel}`}
        >
          {features.map((f, i) => {
            const isFocus = focus ? f.properties.name === (MAP_ALIAS[focus] ?? focus) : false;
            return (
              <path
                key={`${f.properties.name}-${i}`}
                d={path(f as never) ?? ""}
                fill={isFocus ? "color-mix(in oklab, var(--primary) 16%, var(--card))" : "var(--muted)"}
                stroke="var(--border)"
                strokeWidth={0.6}
              />
            );
          })}

          {placed.map(({ p, x, y, r }) => (
            <g
              key={p.key}
              className={p.newsTarget ? "cursor-pointer" : ""}
              onMouseEnter={() => setHover({ x, y, p })}
              onMouseLeave={() => setHover(null)}
              onClick={() => p.newsTarget && onSelect?.(p.newsTarget)}
            >
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={heatColor(p.value / max)}
                fillOpacity={0.82}
                stroke="var(--card)"
                strokeWidth={1.4}
              />
              {focus ? (
                <text
                  x={x}
                  y={y - r - 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="var(--foreground)"
                >
                  {p.label}
                </text>
              ) : null}
            </g>
          ))}
        </svg>

        {hover ? (
          <div
            className="pointer-events-none absolute z-10 max-w-56 rounded-sm border border-border bg-card p-2 shadow-md"
            style={{
              left: `${(hover.x / WIDTH) * 100}%`,
              top: `${(hover.y / HEIGHT) * 100}%`,
              transform: "translate(-50%, -120%)",
            }}
          >
            <div className="chart-label text-foreground">{hover.p.label}</div>
            <div className="chart-sub">{hover.p.country}</div>
            <div className="chart-value text-foreground">
              {format(hover.p.value)} <span className="chart-sub">{unitLabel}</span>
            </div>
            {hover.p.sub ? <div className="chart-sub mt-0.5 line-clamp-2">{hover.p.sub}</div> : null}
          </div>
        ) : null}
      </div>

      <p className="chart-sub mt-2">
        {focus
          ? `Showing ${points.length} entit${points.length === 1 ? "y" : "ies"} operating in ${focus}, sized by ${measureLabel.toLowerCase()}.`
          : "Pick a country in the filter bar above to zoom into that jurisdiction."}{" "}
        Markers are placed on the jurisdiction each entity operates from — the datasets record
        country, not individual site coordinates, so positions within a country are indicative.
      </p>
    </div>
  );
}
