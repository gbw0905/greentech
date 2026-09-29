import ethanol from "@/assets/topic-ethanol.jpg";
import biodiesel from "@/assets/topic-biodiesel.jpg";
import renewableDiesel from "@/assets/topic-renewable-diesel.jpg";
import saf from "@/assets/topic-saf.jpg";
import biogas from "@/assets/topic-biogas.jpg";
import feedstock from "@/assets/topic-feedstock.jpg";
import policy from "@/assets/topic-policy.jpg";
import market from "@/assets/topic-market.jpg";
import type { PolicyUpdate } from "./contracts";
import type { FuelType } from "./taxonomy";

const FUEL_IMAGE: Record<FuelType, { src: string; alt: string }> = {
  Ethanol: { src: ethanol, alt: "Cornfield at sunrise in front of an ethanol biorefinery" },
  Biodiesel: { src: biodiesel, alt: "Biodiesel plant storage tanks and pipelines at dusk" },
  "Renewable Diesel": {
    src: renewableDiesel,
    alt: "Renewable diesel refinery units beside a fuel haulage truck",
  },
  SAF: { src: saf, alt: "Airliner being refuelled with sustainable aviation fuel at dawn" },
  Biogas: { src: biogas, alt: "Anaerobic digester domes at a rural biogas facility" },
  Feedstock: {
    src: feedstock,
    alt: "Used cooking oil drums and biomass residue at a collection yard",
  },
};

const CATEGORY_IMAGE = {
  policy: { src: policy, alt: "Government parliament building with national flags" },
  market: { src: market, alt: "Energy commodity trading screens showing price charts" },
} as const;

/** Deterministic topical photo for an update: fuel-specific first, else category. */
export function imageForUpdate(update: PolicyUpdate): { src: string; alt: string } {
  const fuel = update.fuels[0];
  if (fuel && FUEL_IMAGE[fuel]) return FUEL_IMAGE[fuel];
  return CATEGORY_IMAGE[update.category === "market" ? "market" : "policy"];
}
