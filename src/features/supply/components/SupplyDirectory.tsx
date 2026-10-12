import { MotionReveal } from "@/components/MotionReveal";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SUPPLY_PANELS, type PanelId } from "./SupplyProducersSection";

const CATEGORIES = ["Supply", "Production", "Transport", "Bioproducts", "Power"] as const;
type Category = (typeof CATEGORIES)[number];
// Card badges are presentation metadata; dataset contents and panel IDs stay unchanged.
const CATEGORY: Record<PanelId, Category> = {
  stations: "Supply",
  uco: "Supply",
  ethanol: "Production",
  biopower: "Power",
  rng: "Production",
  biochar: "Bioproducts",
  pellets: "Bioproducts",
  terminals: "Supply",
  marine: "Transport",
  oil: "Supply",
  saf: "Transport",
  carriers: "Transport",
  hydrogen: "Production",
  rlpg: "Production",
  methanol: "Production",
};
const TONES = ["green", "teal", "blue", "purple"] as const;

export function SupplyDirectory() {
  return (
    <>
      <p className="sr-only" role="status">
        {SUPPLY_PANELS.length} datasets.
      </p>
      <div className="supply-directory-grid" aria-label="Supply datasets">
        {SUPPLY_PANELS.map((panel, index) => {
          return (
            <MotionReveal key={panel.id} delay={(index % 4) * 0.09} className="flex [&>a]:w-full">
              <Link
                key={panel.id}
                to="/supply/$panel"
                params={{ panel: panel.id }}
                className="supply-directory-card"
              >
                <div
                  className={`supply-card-art supply-art-${TONES[index % TONES.length]}`}
                  aria-hidden="true"
                >
                  <img
                    src={panel.image}
                    alt=""
                    width={768}
                    height={512}
                    loading={index < 4 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  <span className="supply-art-badge">{CATEGORY[panel.id]}</span>
                </div>
                <div className="supply-card-copy">
                  <h2>{panel.title}</h2>
                  <p>{panel.blurb}</p>
                  <div className="supply-card-meta">
                    <span>
                      <strong>{panel.stat}</strong> {panel.statLabel}
                    </span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </div>
                </div>
              </Link>
            </MotionReveal>
          );
        })}
      </div>
    </>
  );
}
