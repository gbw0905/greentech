import { geoNaturalEarth1, geoPath, geoGraticule10 } from "d3-geo";
import { useEffect, useMemo, useState } from "react";
import { feature } from "topojson-client";
import { Link } from "@tanstack/react-router";
import { COUNTRIES, REGION_ACCENT } from "@/lib/policy-taxonomy";

interface GeoFeature {
  type: "Feature";
  properties: { name: string };
  geometry: unknown;
}

const WIDTH = 900;
const HEIGHT = 440;

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
  const [hover, setHover] = useState<string | null>(null);

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

  const hovered = hover ? byMapName.get(hover) : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="World map of biofuel policy activity"
      >
        <path d={graticule} fill="none" stroke="var(--grid)" strokeWidth={0.4} opacity={0.5} />
        {features?.map((f, i) => {
          const country = byMapName.get(f.properties.name);
          const count = country ? (counts[country.slug] ?? 0) : 0;
          const isActive = country && country.slug === activeCountry;
          const fill = country
            ? count > 0
              ? REGION_ACCENT[country.region]
              : "var(--surface-2)"
            : "var(--surface)";
          return (
            <path
              key={i}
              d={path(f as never) ?? ""}
              fill={fill}
              fillOpacity={country ? (count > 0 ? Math.min(0.35 + count * 0.12, 0.95) : 0.9) : 0.7}
              stroke={isActive ? "var(--primary)" : "var(--background)"}
              strokeWidth={isActive ? 1.4 : 0.5}
              className={country ? "cursor-pointer transition-[fill-opacity]" : ""}
              onMouseEnter={() => country && setHover(f.properties.name)}
              onMouseLeave={() => setHover(null)}
              onClick={() =>
                country && onSelect(country.slug === activeCountry ? null : country.slug)
              }
            />
          );
        })}
      </svg>

      {!features && (
        <div className="label-mono absolute inset-0 flex items-center justify-center text-muted-foreground">
          Loading map…
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3">
        {hovered ? (
          <div className="label-mono text-foreground">
            {hovered.name} · {counts[hovered.slug] ?? 0} updates ·{" "}
            <Link
              to="/countries/$slug"
              params={{ slug: hovered.slug }}
              className="text-primary underline-offset-4 hover:underline"
            >
              open profile
            </Link>
          </div>
        ) : (
          <div className="label-mono text-muted-foreground">
            Hover a tracked jurisdiction · click to filter the feed
          </div>
        )}
      </div>
    </div>
  );
}