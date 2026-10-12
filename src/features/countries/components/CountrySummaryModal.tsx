import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { policyStatusFor, type CountryProfile } from "@/features/policy/taxonomy";
import { governmentSitesForCountry, mandatesForCountry } from "@/features/countries/mandates";
import { MAP_STATUS_COLORS } from "./map-presentation";
import styles from "./CountrySummaryModal.module.css";

export function CountrySummaryModal({
  country,
  onClose,
  onRestoreFocus,
}: {
  country: CountryProfile | undefined;
  onClose: () => void;
  onRestoreFocus: () => void;
}) {
  const status = policyStatusFor(country);
  const fuelSummary = (pattern: RegExp) =>
    country?.mandates
      .filter((item) => pattern.test(item.label))
      .map((item) => item.value)
      .join(" · ") || "Not listed in this profile";
  const regulators = country
    ? [...new Set(mandatesForCountry(country.slug).map((m) => m.compliance.administrator))]
    : [];
  const sources = country ? governmentSitesForCountry(country.slug) : [];

  return (
    <Dialog open={!!country} onOpenChange={(open) => !open && onClose()}>
      {country && (
        <DialogContent
          className={styles["modal"]}
          overlayClassName={styles["overlay"]}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            onRestoreFocus();
          }}
        >
          <header className={styles["heading"]}>
            <DialogTitle className={styles["title"]}>{country.name}</DialogTitle>
            <span className={styles["badge"]}>
              <i style={{ background: MAP_STATUS_COLORS[status] }} />
              {status}
            </span>
          </header>
          <div className={styles["body"]}>
            <DialogDescription className={styles["description"]}>{country.blurb}</DialogDescription>
            <dl className={styles["facts"]}>
              {[
                ["Ethanol", fuelSummary(/ethanol/i)],
                ["Biodiesel / renewable diesel", fuelSummary(/biodiesel|renewable diesel/i)],
                ["SAF / advanced fuels", fuelSummary(/aviation|SAF|advanced/i)],
                ["Key instruments", country.frameworks.join(" · ") || "Being compiled"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className={styles["regulator"]}>
              {regulators.length ? "Regulator: " : "Official sources: "}
              <strong>
                {regulators.join(" · ") ||
                  sources.map((s) => s.label).join(" · ") ||
                  "Being compiled"}
              </strong>
            </p>
          </div>
          <footer className={styles["footer"]}>
            <p>Summary snapshot; confirm against official sources.</p>
            <div>
              <Link to="/countries/$slug" params={{ slug: country.slug }} onClick={onClose}>
                Full policy profile <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link
                to="/countries/$slug"
                params={{ slug: country.slug }}
                hash="updates"
                onClick={onClose}
              >
                Live updates <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </footer>
        </DialogContent>
      )}
    </Dialog>
  );
}
