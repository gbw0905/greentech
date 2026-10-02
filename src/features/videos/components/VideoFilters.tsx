import { useId, useState } from "react";
import { COUNTRIES, FUEL_TYPES, type FuelType, type Region } from "@/features/policy/taxonomy";
import { VIDEO_HUBS } from "../video-library";

const HUB_COUNTRIES = COUNTRIES.filter((country) =>
  VIDEO_HUBS.some((hub) => hub.countries.includes(country.slug)),
);
const HUB_REGIONS = [...new Set(VIDEO_HUBS.flatMap((hub) => hub.regions))];
const HUB_POLICIES = [...new Set(VIDEO_HUBS.flatMap((hub) => hub.policies))];

function FilterGroup({
  title,
  children,
  count,
}: {
  title: string;
  children: React.ReactNode;
  count: number;
}) {
  const id = useId();
  return (
    <fieldset className="videos-rail-card" aria-labelledby={id}>
      <legend id={id}>
        {title}
        <span>{count}</span>
      </legend>
      <div className="videos-rail-list">{children}</div>
    </fieldset>
  );
}

export function VideoFilters({
  country,
  onCountry,
  fuels,
  onFuel,
  regions,
  onRegion,
  policies,
  onPolicy,
  onClear,
}: {
  country: string | null;
  onCountry: (country: string | null) => void;
  fuels: FuelType[];
  onFuel: (fuel: FuelType) => void;
  regions: Region[];
  onRegion: (region: Region) => void;
  policies: string[];
  onPolicy: (policy: string) => void;
  onClear: () => void;
}) {
  const [allCountries, setAllCountries] = useState(false);
  const [allPolicies, setAllPolicies] = useState(false);
  const active = !!country || fuels.length > 0 || regions.length > 0 || policies.length > 0;
  const countryList = allCountries
    ? HUB_COUNTRIES
    : HUB_COUNTRIES.filter((c, i) => i < 6 || c.slug === country);
  const policyList = allPolicies
    ? HUB_POLICIES
    : HUB_POLICIES.filter((p, i) => i < 5 || policies.includes(p));
  return (
    <aside className="videos-rail" aria-label="Video filters">
      <FilterGroup title="Country / region" count={HUB_COUNTRIES.length}>
        {countryList.map((c) => (
          <label className="videos-rail-item" key={c.slug}>
            <input
              type="checkbox"
              checked={country === c.slug}
              onChange={() => onCountry(country === c.slug ? null : c.slug)}
            />
            {c.name}
          </label>
        ))}
        <button
          type="button"
          className="videos-filter-more"
          aria-expanded={allCountries}
          onClick={() => setAllCountries(!allCountries)}
        >
          {allCountries ? "Show fewer countries" : `Show all ${HUB_COUNTRIES.length} countries`}
        </button>
        <details className="videos-region-options">
          <summary>Regions · official hubs</summary>
          {HUB_REGIONS.map((r) => (
            <label className="videos-rail-item" key={r}>
              <input type="checkbox" checked={regions.includes(r)} onChange={() => onRegion(r)} />
              {r}
            </label>
          ))}
        </details>
      </FilterGroup>
      <FilterGroup title="Fuel type" count={FUEL_TYPES.length}>
        {FUEL_TYPES.map((f) => (
          <label className="videos-rail-item" key={f}>
            <input type="checkbox" checked={fuels.includes(f)} onChange={() => onFuel(f)} />
            {f}
          </label>
        ))}
      </FilterGroup>
      <FilterGroup title="Policy instrument" count={HUB_POLICIES.length}>
        <p className="videos-filter-note">Filter official hubs by their policy coverage.</p>
        {policyList.map((p) => (
          <label className="videos-rail-item" key={p}>
            <input type="checkbox" checked={policies.includes(p)} onChange={() => onPolicy(p)} />
            {p}
          </label>
        ))}
        <button
          type="button"
          className="videos-filter-more"
          aria-expanded={allPolicies}
          onClick={() => setAllPolicies(!allPolicies)}
        >
          {allPolicies ? "Show fewer instruments" : "Show all instruments"}
        </button>
      </FilterGroup>
      {active && (
        <button type="button" className="videos-clear" onClick={onClear}>
          Clear all filters
        </button>
      )}
    </aside>
  );
}
