import { MotionReveal } from "@/components/MotionReveal";
import { useCallback, useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { COUNTRIES, countryBySlug, policyStatusFor } from "@/features/policy/taxonomy";
import { governmentSitesForCountry } from "@/features/countries/mandates";
import { WorldPolicyMap } from "./WorldPolicyMap";
import { MAP_STATUS_COLORS } from "./map-presentation";

export function PolicyMapSection({ counts }: { counts: Record<string, number> }) {
  const [selected, setSelected] = useState<string | null>("brazil");
  const selectCountry = useCallback((slug: string | null) => setSelected(slug), []);
  const profile = selected ? countryBySlug(selected) : null;
  const status = policyStatusFor(profile);
  const sources = profile ? governmentSitesForCountry(profile.slug) : [];
  const selectorId = useId();

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
          <WorldPolicyMap counts={counts} activeCountry={selected} onSelect={selectCountry} />
        </div>
        <article className="jurisdiction-profile" aria-label="Selected country summary">
          <header className="jurisdiction-profile-header">
            <div>
              {profile && (
                <>
                  <h3>
                    <Link
                      to="/countries/$slug"
                      params={{ slug: profile.slug }}
                      aria-label={"Open " + profile.name + " policy profile"}
                    >
                      {profile.name}
                    </Link>
                  </h3>
                  <span className="jurisdiction-status">
                    <i style={{ background: MAP_STATUS_COLORS[status] }} />
                    {status}
                  </span>
                </>
              )}
            </div>
            <div className="jurisdiction-picker">
              <label htmlFor={selectorId} className="sr-only">
                Select a country
              </label>
              <select
                id={selectorId}
                value={selected ?? ""}
                onChange={(event) => selectCountry(event.target.value || null)}
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((country) => (
                  <option key={country.slug} value={country.slug}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </header>
          {profile ? (
            <div key={profile.slug} className="jurisdiction-profile-content">
              <p className="jurisdiction-blurb">{profile.blurb}</p>
              <dl className="jurisdiction-mandates">
                {profile.mandates.map((mandate) => (
                  <div key={mandate.label}>
                    <dt>{mandate.label}</dt>
                    <dd>{mandate.value}</dd>
                  </div>
                ))}
              </dl>
              {profile.frameworks.length > 0 && (
                <p className="jurisdiction-frameworks">
                  <span>Key instruments: </span>
                  {profile.frameworks.join(" · ")}
                </p>
              )}
              <footer className="jurisdiction-profile-footer">
                <div>
                  {sources.length > 0 ? (
                    <p>
                      Official sources:{" "}
                      {sources.map((source, index) => (
                        <span key={source.url}>
                          {index > 0 && " · "}
                          <a href={source.url} target="_blank" rel="noopener noreferrer">
                            {source.label}
                          </a>
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p>
                      {profile.region} · {counts[profile.slug] ?? 0} updates tracked
                    </p>
                  )}
                  <p>Summary snapshot; confirm against official sources.</p>
                </div>
                <Link to="/countries/$slug/updates" params={{ slug: profile.slug }}>
                  See latest updates <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </footer>
            </div>
          ) : (
            <p className="jurisdiction-blurb">
              Choose a country on the map or from the list to see its policy summary and latest
              updates.
            </p>
          )}
        </article>
      </div>
    </section>
  );
}
