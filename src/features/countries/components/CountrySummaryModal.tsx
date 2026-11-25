import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { policyStatusFor, type CountryProfile } from "@/features/policy/taxonomy";
import type { LiveCountryProfile } from "@/features/countries/live-profiles";
import { MAP_STATUS_COLORS } from "./map-presentation";
import styles from "./CountrySummaryModal.module.css";

export function CountrySummaryModal({
  country,
  onClose,
  onRestoreFocus,
}: {
  country: CountryProfile | LiveCountryProfile | undefined;
  onClose: () => void;
  onRestoreFocus: () => void;
}) {
  const live = country && "policyStatus" in country ? country : null;
  const status = live?.policyStatus ?? policyStatusFor(country);
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  const fuelSummary = (pattern: RegExp) =>
    country?.mandates
      .filter((item) => pattern.test(item.label))
      .map((item) => item.value)
      .join(" · ") || "Not listed in this profile";

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
            <p className={styles["provenance"]}>
              {live?.lastChange ? (
                <>
                  Last changed {day(live.lastChange.at)} from{" "}
                  <a href={live.lastChange.url} target="_blank" rel="noopener noreferrer">
                    {live.lastChange.sourceName || "the source article"}
                  </a>
                  {live.lastChange.quote ? <>: “{live.lastChange.quote}”</> : null}
                  {live.checkedAt ? ` · Checked ${day(live.checkedAt)}` : null}. Updated
                  automatically from trusted news; may contain errors.
                </>
              ) : live?.checkedAt ? (
                <>
                  Checked against trusted news on {day(live.checkedAt)}; no change found since the
                  profile was compiled.
                </>
              ) : (
                <>Compiled from government sources; automatic checks have not run yet.</>
              )}
            </p>
          </div>
          <footer className={styles["footer"]}>
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
