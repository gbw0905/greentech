import { useEffect, useMemo, useState } from "react";
import { geoNaturalEarth1, geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { heatColor } from "@/components/chart-kit";
import type { NewsTarget } from "@/lib/open-news";

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

/** Dataset country names that differ from the Natural Earth 110m map names. */
const MAP_ALIAS: Record<string, string> = {
  "United States": "United States of America",
  "United States of America": "United States of America",
  USA: "United States of America",
  US: "United States of America",
  UK: "United Kingdom",
  "Great Britain": "United Kingdom",
  "Czech Republic": "Czechia",
  "Ivory Coast": "Côte d'Ivoire",
  "Republic of Korea": "South Korea",
  Korea: "South Korea",
  "Hong Kong": "China",
  Macau: "China",
  Türkiye: "Turkey",
  Turkiye: "Turkey",
  Bosnia: "Bosnia and Herz.",
  "Bosnia and Herzegovina": "Bosnia and Herz.",
  Eswatini: "eSwatini",
  Swaziland: "eSwatini",
  "North Macedonia": "Macedonia",
  "Democratic Republic of the Congo": "Dem. Rep. Congo",
  "DR Congo": "Dem. Rep. Congo",
  "Dominican Republic": "Dominican Rep.",
  "South Sudan": "S. Sudan",
  "Central African Republic": "Central African Rep.",
  "Equatorial Guinea": "Eq. Guinea",
  "Timor Leste": "Timor-Leste",
  UAE: "United Arab Emirates",
  "Western Sahara": "W. Sahara",
  Burma: "Myanmar",
  Laos: "Laos",
  Russia: "Russia",
  "Russian Federation": "Russia",
};

/**
 * Representative land coordinates [lon, lat] for placing markers. Polygon
 * centroids are unreliable for countries with distant overseas territories
 * (France, Norway, the United States, the Netherlands) and for micro-states
 * that the 110m basemap omits entirely (Singapore, Gibraltar, Malta).
 */
const COUNTRY_LATLON: Record<string, [number, number]> = {
  "United States": [-98.5, 39.5],
  Canada: [-106, 56],
  Mexico: [-102, 23.5],
  Brazil: [-51, -11],
  Argentina: [-64, -35],
  Chile: [-71, -35],
  Colombia: [-74, 4.5],
  Peru: [-75.5, -9.5],
  Ecuador: [-78.5, -1.5],
  Bolivia: [-64.5, -16.5],
  Paraguay: [-58, -23.4],
  Uruguay: [-56, -32.8],
  "United Kingdom": [-1.8, 53],
  Ireland: [-8, 53.2],
  France: [2.4, 46.6],
  Germany: [10.4, 51.2],
  Netherlands: [5.5, 52.2],
  Belgium: [4.6, 50.6],
  Luxembourg: [6.1, 49.8],
  Spain: [-3.7, 40.3],
  Portugal: [-8.2, 39.6],
  Italy: [12.5, 42.8],
  Switzerland: [8.2, 46.8],
  Austria: [14.1, 47.6],
  Poland: [19.4, 52],
  Czechia: [15.4, 49.8],
  Slovakia: [19.5, 48.7],
  Hungary: [19.4, 47.1],
  Romania: [25, 45.9],
  Bulgaria: [25.3, 42.7],
  Greece: [22.5, 39.2],
  Denmark: [9.5, 56],
  Norway: [9.5, 61.3],
  Sweden: [15.5, 62],
  Finland: [26, 63.5],
  Estonia: [25.5, 58.7],
  Latvia: [24.8, 56.9],
  Lithuania: [23.9, 55.3],
  Ukraine: [31.5, 49],
  Russia: [55, 57],
  Turkey: [35.3, 39],
  Türkiye: [35.3, 39],
  Serbia: [20.8, 44],
  Croatia: [16.4, 45.2],
  Slovenia: [14.8, 46.1],
  Iceland: [-18.5, 64.9],
  Gibraltar: [-5.35, 36.14],
  Malta: [14.4, 35.9],
  Cyprus: [33.2, 35],
  China: [104, 35],
  "Hong Kong": [114.17, 22.32],
  Taiwan: [121, 23.7],
  Japan: [138, 36.5],
  "South Korea": [127.8, 36.5],
  India: [79, 22],
  Pakistan: [69.5, 30],
  Bangladesh: [90.3, 23.8],
  "Sri Lanka": [80.7, 7.6],
  Nepal: [84.2, 28.3],
  Thailand: [101, 15.3],
  Vietnam: [106.5, 16],
  Malaysia: [102.3, 3.9],
  Singapore: [103.82, 1.35],
  Indonesia: [113, -2.5],
  Philippines: [122, 12],
  Cambodia: [105, 12.6],
  Laos: [103.8, 18.5],
  Myanmar: [96.5, 20.5],
  Kazakhstan: [67, 48],
  Uzbekistan: [64, 41.5],
  Mongolia: [104, 46.8],
  "Saudi Arabia": [45, 24],
  "United Arab Emirates": [54.3, 24.2],
  UAE: [54.3, 24.2],
  Qatar: [51.2, 25.3],
  Kuwait: [47.7, 29.3],
  Oman: [56.5, 21.5],
  Bahrain: [50.6, 26.1],
  Israel: [35, 31.4],
  Jordan: [36.5, 31.3],
  Iraq: [43.7, 33.2],
  Iran: [53.5, 32.5],
  Egypt: [30.5, 27],
  Morocco: [-6.5, 32],
  Algeria: [2.8, 28.2],
  Tunisia: [9.6, 34.5],
  Libya: [17.5, 27],
  Sudan: [30.2, 15.5],
  Ethiopia: [39.5, 9.2],
  Kenya: [37.8, 0.3],
  Uganda: [32.4, 1.3],
  Tanzania: [34.9, -6.4],
  Rwanda: [29.9, -1.95],
  Nigeria: [8.3, 9.4],
  Ghana: [-1.2, 7.9],
  "Ivory Coast": [-5.5, 7.6],
  "Côte d'Ivoire": [-5.5, 7.6],
  Senegal: [-14.5, 14.5],
  Cameroon: [12.5, 5.7],
  "Sierra Leone": [-11.8, 8.5],
  Malawi: [34, -13.3],
  Mozambique: [35.5, -17.5],
  Zambia: [27.8, -13.5],
  Zimbabwe: [29.9, -19],
  "South Africa": [24.7, -29],
  Angola: [17.9, -12.3],
  Namibia: [17.2, -22],
  Botswana: [24.7, -22.3],
  Australia: [134, -25.5],
  "New Zealand": [172.5, -41.5],
  "Papua New Guinea": [144.5, -6.3],
  Fiji: [178, -17.8],
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
    if (focus) {
      const box = FOCUS_BBOX[MAP_ALIAS[focus] ?? focus] ?? FOCUS_BBOX[focus];
      const fitTarget = box
        ? ({
            type: "Polygon",
            coordinates: [
              [
                [box[0], box[1]],
                [box[2], box[1]],
                [box[2], box[3]],
                [box[0], box[3]],
                [box[0], box[1]],
              ],
            ],
          } as const)
        : focusFeature;
      if (fitTarget) {
        const proj = geoMercator().fitExtent(
          [
            [28, 28],
            [WIDTH - 28, HEIGHT - 28],
          ],
          fitTarget as never,
        );
        return { path: geoPath(proj), projection: proj };
      }
    }
    const proj = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], { type: "Sphere" });
    return { path: geoPath(proj), projection: proj };
  }, [focus, focusFeature]);

  const max = Math.max(...points.map((p) => p.value), 0) || 1;

  /** Projected pixel anchor for a dataset country, preferring curated coordinates. */
  const anchorFor = (country: string): [number, number, number] | null => {
    const ll = COUNTRY_LATLON[country] ?? COUNTRY_LATLON[MAP_ALIAS[country] ?? country];
    const f = featureFor(country);
    let xy: [number, number] | null = null;
    if (ll) {
      const q = projection(ll);
      if (q && Number.isFinite(q[0]) && Number.isFinite(q[1])) xy = [q[0], q[1]];
    }
    if (!xy && f) {
      const c = path.centroid(f as never);
      if (Number.isFinite(c[0]) && Number.isFinite(c[1])) xy = [c[0], c[1]];
    }
    if (!xy) return null;
    let width = 40;
    if (f) {
      const b = path.bounds(f as never);
      if (Number.isFinite(b[0][0])) width = b[1][0] - b[0][0];
    }
    return [xy[0], xy[1], width];
  };

  const placed = useMemo(() => {
    const perCountry = new Map<string, MapPoint[]>();
    for (const p of points) {
      const list = perCountry.get(p.country) ?? [];
      list.push(p);
      perCountry.set(p.country, list);
    }
    const out: { p: MapPoint; x: number; y: number; r: number }[] = [];
    for (const [country, list] of perCountry) {
      const anchor = anchorFor(country);
      if (!anchor) continue;
      const c: [number, number] = [anchor[0], anchor[1]];
      const spread = Math.min(Math.max(anchor[2] * 0.22, 12), focus ? 140 : 30);
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

          {placed.map(({ p, x, y, r }, i) => (
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
                  y={i % 2 === 0 ? y - r - 5 : y + r + 12}
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
