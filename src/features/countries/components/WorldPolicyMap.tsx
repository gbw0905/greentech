import { geoNaturalEarth1, geoPath, geoGraticule10 } from "d3-geo";
import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";
import { Minus, Plus, Maximize2 } from "lucide-react";
import {
  COUNTRIES,
  policyStatusFor,
  type CountryProfile,
  type PolicyStatus,
} from "@/features/policy/taxonomy";
import { MAP_STATUS_COLORS } from "./map-presentation";
import type { LiveCountryProfile } from "@/features/countries/live-profiles";

/** Status from the live database profile when we have one, else the built-in list. */
const statusOf = (country: CountryProfile | undefined): PolicyStatus =>
  (country as Partial<LiveCountryProfile> | undefined)?.policyStatus ?? policyStatusFor(country);
import { COUNTRY_MARKETS } from "@/features/countries/country-markets";

interface GeoFeature {
  type: "Feature";
  properties: { name: string };
  geometry: unknown;
}
interface Point {
  x: number;
  y: number;
}
interface View extends Point {
  z: number;
}
type HoverHandler = (slug: string | null, bounds?: DOMRect) => void;
interface MapShape {
  name: string;
  path: string;
  country: CountryProfile | undefined;
  color: string;
  opacity: number;
}
const WIDTH = 900;
const HEIGHT = 450;
const INITIAL_VIEW: View = { z: 1.2, x: -WIDTH * 0.1, y: -8 };
const MIN_ZOOM = INITIAL_VIEW.z;
const MAX_ZOOM = 8;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const constrain = (view: View): View => ({
  ...view,
  x: clamp(view.x, WIDTH * (1 - view.z), 0),
  y: clamp(view.y, HEIGHT * (1 - view.z), 0),
});

const CountryShape = memo(function CountryShape({
  shape,
  active,
  hovered,
  onHover,
  onSelect,
}: {
  shape: MapShape;
  active: boolean;
  hovered: boolean;
  onHover: HoverHandler;
  onSelect: (slug: string, keyboard?: boolean) => void;
}) {
  return (
    <path
      d={shape.path}
      fill={shape.color}
      fillOpacity={hovered ? 0.95 : shape.opacity}
      stroke="#fff"
      strokeWidth={0.55}
      vectorEffect="non-scaling-stroke"
      className={shape.country ? "jurisdiction-country" : "jurisdiction-untracked"}
      data-country={shape.country?.slug}
      data-selected={active || undefined}
      data-hovered={hovered || undefined}
      tabIndex={shape.country ? 0 : undefined}
      role={shape.country ? "button" : undefined}
      aria-haspopup={shape.country ? "dialog" : undefined}
      aria-label={shape.country ? "Open " + shape.country.name + " summary" : undefined}
      onFocus={(event) =>
        onHover(shape.country?.slug ?? null, event.currentTarget.getBoundingClientRect())
      }
      onBlur={() => onHover(null)}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && shape.country) {
          event.preventDefault();
          onSelect(shape.country.slug, true);
        }
      }}
      onPointerEnter={(event) =>
        onHover(shape.country?.slug ?? null, event.currentTarget.getBoundingClientRect())
      }
      onPointerMove={() => onHover(shape.country?.slug ?? null)}
      onPointerLeave={() => onHover(null)}
      onClick={() => shape.country && onSelect(shape.country.slug)}
    />
  );
});

// Pointer movement only moves the tooltip; geographic paths remain memoized.
const CountryLayer = memo(function CountryLayer({
  shapes,
  active,
  hover,
  onHover,
  onSelect,
}: {
  shapes: MapShape[];
  active: string | null;
  hover: string | null;
  onHover: HoverHandler;
  onSelect: (slug: string, keyboard?: boolean) => void;
}) {
  return shapes.map((shape) => (
    <CountryShape
      key={shape.name}
      shape={shape}
      active={!!shape.country && shape.country.slug === active}
      hovered={!!shape.country && shape.country.slug === hover}
      onHover={onHover}
      onSelect={onSelect}
    />
  ));
});

export function WorldPolicyMap({
  counts,
  countries,
  activeCountry,
  onSelect,
}: {
  counts: Record<string, number>;
  /** Live profiles; until they load the built-in list is used. */
  countries?: CountryProfile[] | undefined;
  activeCountry: string | null;
  onSelect: (slug: string | null) => void;
}) {
  const [features, setFeatures] = useState<GeoFeature[] | null>(null);
  const [mapError, setMapError] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [hoverBounds, setHoverBounds] = useState<{ left: number; right: number } | null>(null);
  const [tip, setTip] = useState<Point | null>(null);
  const [view, setView] = useState<View>(INITIAL_VIEW);
  const [tooltipSize, setTooltipSize] = useState({ width: 248, height: 222 });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ start: Point; original: View; pointerId: number } | null>(null);
  const moved = useRef(false);
  const tooltipId = useId();
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keepTooltip = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = null;
  }, []);
  const dismissTooltip = useCallback(() => {
    keepTooltip();
    dismissTimer.current = setTimeout(() => {
      if (tooltipRef.current?.contains(document.activeElement)) return;
      if (
        document.activeElement?.matches(".jurisdiction-country") &&
        containerRef.current?.contains(document.activeElement)
      )
        return;
      setHover(null);
      setHoverBounds(null);
      setTip(null);
    }, 650);
  }, [keepTooltip]);
  useEffect(() => () => keepTooltip(), [keepTooltip]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/world-110m.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Map unavailable");
        return response.json();
      })
      .then((topo) => {
        if (controller.signal.aborted) return;
        const geo = feature(topo, topo.objects.countries) as unknown as { features: GeoFeature[] };
        setFeatures(geo.features);
      })
      .catch(() => {
        if (!controller.signal.aborted) setMapError(true);
      });
    return () => controller.abort();
  }, []);

  const { path, graticule, sphere } = useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent(
      [
        [18, 6],
        [WIDTH - 18, HEIGHT - 6],
      ],
      { type: "Sphere" },
    );
    const path = geoPath(projection);
    return {
      path,
      graticule: path(geoGraticule10()) ?? "",
      sphere: path({ type: "Sphere" }) ?? "",
    };
  }, []);
  const byMapName = useMemo(
    () =>
      new Map(
        (countries ?? COUNTRIES)
          .filter((country) => country.mapName)
          .map((country) => [country.mapName, country]),
      ),
    [countries],
  );
  const bySlug = useMemo(
    () => new Map((countries ?? COUNTRIES).map((country) => [country.slug, country])),
    [countries],
  );
  const shapes = useMemo(
    () =>
      (features ?? []).map((geo): MapShape => {
        const country = byMapName.get(geo.properties.name);
        const count = country ? (counts[country.slug] ?? 0) : 0;
        return {
          name: geo.properties.name,
          path: path(geo as never) ?? "",
          country,
          color: MAP_STATUS_COLORS[statusOf(country)],
          opacity: country ? (count > 0 ? Math.min(0.72 + count * 0.04, 1) : 0.62) : 1,
        };
      }),
    [features, byMapName, path, counts],
  );

  const localPoint = useCallback((clientX: number, clientY: number): Point => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return { x: WIDTH / 2, y: HEIGHT / 2 };
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(matrix.inverse());
  }, []);
  const zoomAt = useCallback((factor: number, point: Point = { x: WIDTH / 2, y: HEIGHT / 2 }) => {
    setHover(null);
    setTip(null);
    setView((previous) => {
      const z = clamp(previous.z * factor, MIN_ZOOM, MAX_ZOOM);
      const ratio = z / previous.z;
      return constrain({
        z,
        x: point.x - (point.x - previous.x) * ratio,
        y: point.y - (point.y - previous.y) * ratio,
      });
    });
  }, []);
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      // Trackpad pinch emits a ctrl-modified wheel event; ordinary scrolling stays with the page.
      if (!event.ctrlKey) return;
      if ((event.target as Element).closest(".jurisdiction-tooltip")) return;
      const delta =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node.clientHeight : 1);
      event.preventDefault();
      zoomAt(Math.exp(-delta * 0.0018), localPoint(event.clientX, event.clientY));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [localPoint, zoomAt]);

  const handleHover = useCallback<HoverHandler>(
    (slug, countryBounds) => {
      if (drag.current) return;
      if (!slug) {
        dismissTooltip();
        return;
      }
      keepTooltip();
      setHover(slug);
      if (countryBounds && containerRef.current) {
        const canvas = containerRef.current.getBoundingClientRect();
        setHoverBounds({
          left: countryBounds.left - canvas.left,
          right: countryBounds.right - canvas.left,
        });
        setTip({
          x: (countryBounds.left + countryBounds.right) / 2 - canvas.left,
          y: (countryBounds.top + countryBounds.bottom) / 2 - canvas.top,
        });
      }
    },
    [dismissTooltip, keepTooltip],
  );
  const handleSelect = useCallback(
    (slug: string, keyboard = false) => {
      if (keyboard || !moved.current) {
        setHover(null);
        setTip(null);
        onSelect(slug);
      }
    },
    [onSelect],
  );
  const hovered = hover ? bySlug.get(hover) : undefined;
  const knownMarket = hovered ? COUNTRY_MARKETS[hovered.slug] : undefined;
  useEffect(() => {
    const node = tooltipRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setTooltipSize({ width: node.offsetWidth, height: node.offsetHeight });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hovered?.slug]);
  const bounds = containerRef.current;
  const canvasWidth = bounds?.clientWidth ?? WIDTH;
  const canvasHeight = bounds?.clientHeight ?? HEIGHT;
  const tooltipGap = 18;
  // Keep the country visible as well as leaving a gap beside the pointer.
  const rightPosition = tip ? Math.max(tip.x + tooltipGap, (hoverBounds?.right ?? 0) + 12) : 0;
  const leftPosition = tip
    ? Math.min(
        tip.x - tooltipGap - tooltipSize.width,
        (hoverBounds?.left ?? canvasWidth) - tooltipSize.width - 12,
      )
    : 0;
  const fitsOutsideRight = rightPosition + tooltipSize.width <= canvasWidth - 12;
  const fitsOutsideLeft = leftPosition >= 12;
  const fitsRight = !!tip && tip.x + tooltipGap + tooltipSize.width <= canvasWidth - 12;
  const fitsLeft = !!tip && tip.x - tooltipGap - tooltipSize.width >= 12;
  const tipLeft = tip
    ? clamp(
        fitsOutsideRight
          ? rightPosition
          : fitsOutsideLeft
            ? leftPosition
            : fitsRight
              ? tip.x + tooltipGap
              : tip.x - tooltipGap - tooltipSize.width,
        12,
        Math.max(12, canvasWidth - tooltipSize.width - 12),
      )
    : 0;
  const tipTop = tip
    ? clamp(
        // On narrow screens, use the available vertical space if neither side fits.
        fitsRight || fitsLeft
          ? tip.y - tooltipSize.height / 2
          : tip.y + tooltipGap + tooltipSize.height <= canvasHeight - 12
            ? tip.y + tooltipGap
            : tip.y - tooltipSize.height - tooltipGap,
        12,
        Math.max(12, canvasHeight - tooltipSize.height - 12),
      )
    : 0;

  return (
    <>
      <div className="jurisdiction-map-padding">
        <div
          ref={containerRef}
          className="jurisdiction-map-canvas"
          data-zoom={(view.z / INITIAL_VIEW.z).toFixed(2)}
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0) return;
            keepTooltip();
            moved.current = false;
            drag.current = {
              start: localPoint(event.clientX, event.clientY),
              original: view,
              pointerId: event.pointerId,
            };
          }}
          onPointerMove={(event) => {
            const node = event.currentTarget;
            const rect = node.getBoundingClientRect();
            const current = drag.current;
            if (!current) {
              // Freeze the card while crossing the gap to its Details link.
              if ((event.target as Element).closest("[data-country]")) {
                setTip({ x: event.clientX - rect.left, y: event.clientY - rect.top });
              }
              return;
            }
            if (event.pointerId !== current.pointerId) return;
            const point = localPoint(event.clientX, event.clientY);
            const dx = point.x - current.start.x;
            const dy = point.y - current.start.y;
            if (Math.abs(dx) + Math.abs(dy) <= 4 && !moved.current) return;
            moved.current = true;
            if (!node.hasPointerCapture(event.pointerId)) node.setPointerCapture(event.pointerId);
            setHover(null);
            setTip(null);
            setView(
              constrain({
                ...current.original,
                x: current.original.x + dx,
                y: current.original.y + dy,
              }),
            );
          }}
          onPointerUp={(event) => {
            drag.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => {
            drag.current = null;
            setHover(null);
            setTip(null);
          }}
          onLostPointerCapture={() => {
            drag.current = null;
          }}
          onPointerLeave={() => {
            if (!drag.current) dismissTooltip();
          }}
        >
          <svg
            ref={svgRef}
            viewBox={"0 0 " + WIDTH + " " + HEIGHT}
            className="jurisdiction-map-svg"
            role="group"
            aria-label="World map of biofuel policy activity"
          >
            <g transform={"translate(" + view.x + "," + view.y + ") scale(" + view.z + ")"}>
              <path d={sphere} className="jurisdiction-sphere" vectorEffect="non-scaling-stroke" />
              <path
                d={graticule}
                className="jurisdiction-graticule"
                vectorEffect="non-scaling-stroke"
              />
              <CountryLayer
                shapes={shapes}
                active={activeCountry}
                hover={hover}
                onHover={handleHover}
                onSelect={handleSelect}
              />
            </g>
          </svg>
          {hovered && tip && (
            <button
              type="button"
              onClick={() => handleSelect(hovered.slug, true)}
              tabIndex={-1}
              aria-hidden="true"
              className="jurisdiction-tooltip-bridge"
              style={{
                left: Math.min(tip.x, tipLeft),
                top: tipTop,
                width: Math.max(
                  0,
                  tipLeft > tip.x ? tipLeft - tip.x : tip.x - tipLeft - tooltipSize.width,
                ),
                height: tooltipSize.height,
                clipPath:
                  tipLeft > tip.x
                    ? `polygon(0 ${clamp(tip.y - tipTop, 0, tooltipSize.height)}px, 100% 0, 100% 100%)`
                    : `polygon(0 0, 100% ${clamp(tip.y - tipTop, 0, tooltipSize.height)}px, 0 100%)`,
                ...(tipLeft < tip.x ? { left: tipLeft + tooltipSize.width } : {}),
              }}
              onPointerEnter={keepTooltip}
              onPointerLeave={dismissTooltip}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerMove={(event) => event.stopPropagation()}
            />
          )}
          {hovered && tip && (
            <div
              ref={tooltipRef}
              id={tooltipId}
              role="group"
              aria-label={hovered.name + " summary"}
              className="jurisdiction-tooltip"
              onPointerEnter={keepTooltip}
              onPointerLeave={dismissTooltip}
              onFocusCapture={keepTooltip}
              onBlurCapture={dismissTooltip}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerMove={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  keepTooltip();
                  setHover(null);
                  setTip(null);
                }
              }}
              style={{ left: tipLeft, top: tipTop }}
            >
              <h3>{hovered.name}</h3>
              <p className="jurisdiction-tip-count">{counts[hovered.slug] ?? 0} updates</p>
              <span className="jurisdiction-tip-status">
                <i style={{ background: MAP_STATUS_COLORS[statusOf(hovered)] }} />
                {statusOf(hovered)}
              </span>
              <dl>
                <div>
                  <dt>Stock index</dt>
                  <dd>{knownMarket?.index ?? "—"}</dd>
                </div>
                <div>
                  <dt>Region</dt>
                  <dd>{hovered.region}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => handleSelect(hovered.slug, true)}
                className="jurisdiction-tooltip-details"
                aria-label={"Open " + hovered.name + " summary"}
              >
                Summary
              </button>
            </div>
          )}
          <div
            className="jurisdiction-zoom"
            onPointerDown={(event) => event.stopPropagation()}
            onPointerMove={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Zoom in"
              disabled={view.z >= MAX_ZOOM}
              onClick={() => zoomAt(1.4)}
            >
              <Plus size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              disabled={view.z <= MIN_ZOOM}
              onClick={() => zoomAt(1 / 1.4)}
            >
              <Minus size={14} aria-hidden="true" />
            </button>
            {view.z > MIN_ZOOM && (
              <button
                type="button"
                aria-label="Reset view"
                onClick={() => {
                  setView(INITIAL_VIEW);
                  setHover(null);
                  setTip(null);
                }}
              >
                <Maximize2 size={13} aria-hidden="true" />
              </button>
            )}
            <output aria-label="Map zoom">{(view.z / INITIAL_VIEW.z).toFixed(1)}×</output>
          </div>
          {!features && (
            <div className="jurisdiction-map-message" role="status">
              {mapError ? "Map unavailable. Please reload to try again." : "Loading map…"}
            </div>
          )}
        </div>
      </div>
      <footer className="jurisdiction-map-legend">
        <div>
          {(Object.keys(MAP_STATUS_COLORS) as PolicyStatus[]).map((status) => (
            <span key={status}>
              <i style={{ background: MAP_STATUS_COLORS[status] }} />
              {status}
            </span>
          ))}
        </div>
        <p>Pinch or use buttons to zoom · drag to pan · click for a country summary</p>
      </footer>
    </>
  );
}
