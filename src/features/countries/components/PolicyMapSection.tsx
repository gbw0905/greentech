import { MotionReveal } from "@/components/MotionReveal";
import { useNavigate } from "@tanstack/react-router";
import { WorldPolicyMap } from "./WorldPolicyMap";

export function PolicyMapSection({ counts }: { counts: Record<string, number> }) {
  const navigate = useNavigate();

  return (
    <section id="map" className="jurisdiction-section" aria-labelledby="jurisdiction-title">
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
            developing their frameworks. Click any country to open its full profile.
          </p>
        </MotionReveal>
        <div className="jurisdiction-map-frame">
          <div className="jurisdiction-map-header">
            <h3>Jurisdiction map</h3>
            <span>Click a country to open its profile</span>
          </div>
          <WorldPolicyMap
            counts={counts}
            activeCountry={null}
            onSelect={(slug) => {
              if (slug) void navigate({ to: "/countries/$slug", params: { slug } });
            }}
          />
        </div>
      </div>
    </section>
  );
}
