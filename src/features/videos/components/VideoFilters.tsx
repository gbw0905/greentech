import { useId, useState } from "react";
import { COUNTRIES, FUEL_TYPES, type FuelType } from "@/features/policy/taxonomy";

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
  countries,
  onCountry,
  fuels,
  onFuel,
  onClear,
}: {
  countries: string[];
  onCountry: (country: string) => void;
  fuels: FuelType[];
  onFuel: (fuel: FuelType) => void;
  onClear: () => void;
}) {
  const [allCountries, setAllCountries] = useState(false);
  const active = countries.length > 0 || fuels.length > 0;
  const countryList = allCountries
    ? COUNTRIES
    : COUNTRIES.filter((c, i) => i < 6 || countries.includes(c.slug));
  return (
    <aside className="videos-rail" aria-label="Video filters">
      <FilterGroup title="Country" count={COUNTRIES.length}>
        {countryList.map((c) => (
          <label className="videos-rail-item" key={c.slug}>
            <input
              type="checkbox"
              checked={countries.includes(c.slug)}
              onChange={() => onCountry(c.slug)}
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
          {allCountries ? "Show fewer countries" : `Show all ${COUNTRIES.length} countries`}
        </button>
      </FilterGroup>
      <FilterGroup title="Fuel type" count={FUEL_TYPES.length}>
        {FUEL_TYPES.map((f) => (
          <label className="videos-rail-item" key={f}>
            <input type="checkbox" checked={fuels.includes(f)} onChange={() => onFuel(f)} />
            {f === "SAF" ? "Sustainable Aviation Fuel" : f}
          </label>
        ))}
      </FilterGroup>
      {active && (
        <button type="button" className="videos-clear" onClick={onClear}>
          Clear all filters
        </button>
      )}
    </aside>
  );
}
