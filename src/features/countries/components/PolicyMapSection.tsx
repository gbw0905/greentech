import { MotionReveal } from "@/components/MotionReveal";
import { useRef, useState } from "react";
import { countryBySlug } from "@/features/policy/taxonomy";
import { CountrySummaryModal } from "./CountrySummaryModal";
import styles from "./PolicyMap.module.css";
import { WorldPolicyMap } from "./WorldPolicyMap";

export function PolicyMapSection({ counts }: { counts: Record<string, number> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const opener = useRef<SVGElement | null>(null);
  const country = selected ? countryBySlug(selected) : undefined;

  return (
    <section
      id="map"
      className={`jurisdiction-section ${styles["section"]}`}
      aria-labelledby="jurisdiction-title"
    >
      <div className="jurisdiction-inner">
        <MotionReveal as="header" className="jurisdiction-heading">
          <span className="jurisdiction-kicker">
            <i />
            Jurisdiction map
          </span>
          <h2 id="jurisdiction-title">
            Policy activity <span>by jurisdiction</span>
          </h2>
          <p>
            Government mandates and market moves side by side — including jurisdictions still
            developing their frameworks. Click any country to open its summary.
          </p>
        </MotionReveal>
        <MotionReveal delay={0.09} className={`jurisdiction-map-frame ${styles["frame"]}`}>
          <div className="jurisdiction-map-header">
            <h3>Jurisdiction map</h3>
            <span>Click a country for its summary</span>
          </div>
          <WorldPolicyMap
            counts={counts}
            activeCountry={selected}
            onSelect={(slug) => {
              opener.current = slug
                ? document.querySelector<SVGElement>(`[data-country="${slug}"]`)
                : null;
              setSelected(slug);
            }}
          />
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
