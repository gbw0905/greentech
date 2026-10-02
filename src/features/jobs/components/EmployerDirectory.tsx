import { useState } from "react";
import { ArrowUpRight, Building2, MapPin, Search } from "lucide-react";
import { EMPLOYERS } from "@/features/jobs/data";
import { MotionReveal } from "@/components/MotionReveal";

const COUNTRIES = [...new Set(EMPLOYERS.map((employer) => employer.hq))].sort();
const FUELS = [...new Set(EMPLOYERS.flatMap((employer) => employer.focus))].sort();

export function EmployerDirectory() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [fuel, setFuel] = useState("");
  const [expanded, setExpanded] = useState(false);
  const employers = EMPLOYERS.filter(
    (employer) =>
      (!country || employer.hq === country) &&
      (!fuel || employer.focus.some((focus) => focus === fuel)) &&
      (!search.trim() ||
        `${employer.name} ${employer.hq} ${employer.focus.join(" ")}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())),
  );

  return (
    <section className="jobs-section" aria-labelledby="jobs-employers-title">
      <MotionReveal className="jobs-section-heading">
        <div>
          <span className="jobs-section-kicker">Explore the sector</span>
          <h2 id="jobs-employers-title">Meet the bioenergy employers</h2>
          <p>Go directly to the career pages of the companies powering the transition.</p>
        </div>
        <span className="jobs-count" aria-live="polite">
          {employers.length} employers
        </span>
      </MotionReveal>
      <div className="jobs-employer-filters">
        <label className="jobs-search-input">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Search employers</span>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setExpanded(false);
            }}
            placeholder="Search companies or fuels…"
          />
        </label>
        <label>
          <span className="sr-only">Employer headquarters</span>
          <select
            value={country}
            onChange={(event) => {
              setCountry(event.target.value);
              setExpanded(false);
            }}
          >
            <option value="">All headquarters</option>
            {COUNTRIES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Employer fuel focus</span>
          <select
            value={fuel}
            onChange={(event) => {
              setFuel(event.target.value);
              setExpanded(false);
            }}
          >
            <option value="">All fuel types</option>
            {FUELS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div id="jobs-employer-grid" className="jobs-employer-grid">
        {(expanded ? employers : employers.slice(0, 8)).map((employer) => (
          <a
            key={employer.name}
            className="jobs-employer-card"
            href={employer.careers}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="jobs-employer-card-top">
              <span className="jobs-source-icon">
                <Building2 size={20} />
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </div>
            <h3>{employer.name}</h3>
            <p>
              <MapPin size={13} aria-hidden="true" /> {employer.hq}
            </p>
            <div className="jobs-fuel-tags">
              {employer.focus.map((focus) => (
                <span key={focus}>{focus}</span>
              ))}
            </div>
            <span className="jobs-careers-link">
              Visit careers page <ArrowUpRight size={14} aria-hidden="true" />
            </span>
          </a>
        ))}
      </div>
      {!employers.length && (
        <p className="jobs-empty" role="status">
          No employers match these filters. Try another company, headquarters or fuel.
        </p>
      )}
      {employers.length > 8 && (
        <div className="jobs-show-more">
          <button
            className="jobs-button"
            type="button"
            aria-expanded={expanded}
            aria-controls="jobs-employer-grid"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Show fewer employers" : `View all ${employers.length} employers`}
          </button>
        </div>
      )}
    </section>
  );
}
