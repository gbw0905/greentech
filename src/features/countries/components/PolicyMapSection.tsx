import { MotionReveal } from "@/components/MotionReveal";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { countryBySlug } from "@/features/policy/taxonomy";
import { liveCountryProfilesQuery } from "@/features/countries/live-profiles";
import { CountrySummaryModal } from "./CountrySummaryModal";
import styles from "./PolicyMap.module.css";
const WorldPolicyMap = lazy(() =>
  import("./WorldPolicyMap").then((module) => ({ default: module.WorldPolicyMap })),
);

export function PolicyMapSection({ counts }: { counts: Record<string, number> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const opener = useRef<SVGElement | null>(null);
  const { data: liveProfiles } = useQuery(liveCountryProfilesQuery);
  const country = selected
    ? (liveProfiles?.find((profile) => profile.slug === selected) ?? countryBySlug(selected))
    : undefined;
  const mapFrame = useRef<HTMLDivElement>(null);
  const [loadMap, setLoadMap] = useState(false);
  useEffect(() => {
    const frame = mapFrame.current;
    if (!frame) return;
    if (!("IntersectionObserver" in window)) {
      setLoadMap(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setLoadMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="map"
      className={`jurisdiction-section ${styles["section"]}`}
      aria-labelledby="jurisdiction-title"
    >
      <div className="jurisdiction-inner">
        <MotionReveal as="header" className="jurisdiction-heading">
          <h2 id="jurisdiction-title">
            Policy activity <span>by jurisdiction</span>
          </h2>
          <p>
            Government mandates and market moves side by side — including jurisdictions still
            developing their frameworks. Click any country to open its summary.
          </p>
        </MotionReveal>
        <MotionReveal delay={0.09} className={`jurisdiction-map-frame ${styles["frame"]}`}>
          <div ref={mapFrame} style={{ minHeight: "clamp(280px, 43vw, 560px)" }}>
            {loadMap && (
              <Suspense
                fallback={
                  <p role="status" className="p-6 text-muted-foreground">
                    Loading policy map…
                  </p>
                }
              >
                <WorldPolicyMap
                  counts={counts}
                  countries={liveProfiles}
                  activeCountry={selected}
                  onSelect={(slug) => {
                    opener.current = slug
                      ? document.querySelector<SVGElement>(`[data-country="${slug}"]`)
                      : null;
                    setSelected(slug);
                  }}
                />
              </Suspense>
            )}
          </div>
        </MotionReveal>
      </div>
      <CountrySummaryModal
        country={country}
        onClose={() => setSelected(null)}
        onRestoreFocus={() => opener.current?.focus({ preventScroll: true })}
      />
    </section>
  );
}
