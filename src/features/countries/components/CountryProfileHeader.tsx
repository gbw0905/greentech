import { Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, FileText, Newspaper } from "lucide-react";
import { useCountryMandates, useGovernmentSites } from "../hooks/useCountryData";
import { CountryFlag } from "./CountryFlag";
import type { CountryProfile } from "@/features/policy/taxonomy";

export function CountryProfileHeader({
  country,
  section = "overview",
}: {
  country: CountryProfile;
  section?: "overview" | "mandates" | "updates";
}) {
  const { data: sources = [] } = useGovernmentSites(country.slug);
  const { data: mandates = [] } = useCountryMandates(country.slug);
  return (
    <header className="banner">
      <div className="wrap">
        <div className="hero-grid">
          <div>
            <div className="hero-title">
              <span className="flag">
                <CountryFlag slug={country.slug} />
              </span>
              <h1>{country.name}</h1>
            </div>
            <p className="hero-lede">{country.blurb}</p>
            <section className="hero-evidence" aria-label="Explore this jurisdiction">
              <div className="hero-quick-links">
                <Link to="/countries/$slug" params={{ slug: country.slug }} hash="mandates">
                  <FileText size={18} />
                  <span>
                    <strong>{mandates.length} tracked mandates</strong>
                    <small>Timeline &amp; compliance</small>
                  </span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/countries/$slug" params={{ slug: country.slug }} hash="updates">
                  <Newspaper size={18} />
                  <span>
                    <strong>Live updates</strong>
                    <small>Latest policy &amp; market news</small>
                  </span>
                  <ArrowRight size={16} />
                </Link>
              </div>
              {sources.length > 0 && (
                <div className="hero-source-links">
                  <p>Official sources · {sources.length}</p>
                  {sources.slice(0, 3).map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.label}
                      <ExternalLink size={13} />
                    </a>
                  ))}
                </div>
              )}
            </section>
          </div>
          <aside className="snap" aria-label="Profile snapshot">
            <p className="snap-h">Profile snapshot</p>
            <dl>
              {country.mandates.map((m) => (
                <div className="r" key={m.label}>
                  <dt>{m.label}</dt>
                  <dd>{m.value}</dd>
                </div>
              ))}
            </dl>
            <Link
              className="snap-link"
              to="/countries/$slug"
              params={{ slug: country.slug }}
              hash="mandates"
            >
              View mandates &amp; targets <ArrowRight size={15} />
            </Link>
          </aside>
        </div>
        <nav className="tabs" aria-label="Country profile sections">
          {[
            { id: "overview", label: "Overview" },
            { id: "mandates", label: "Mandates & targets" },
            { id: "updates", label: "Live updates" },
          ].map((tab) => (
            <Link
              key={tab.id}
              to="/countries/$slug"
              params={{ slug: country.slug }}
              hash={tab.id}
              aria-current={section === tab.id ? "location" : undefined}
              className={section === tab.id ? "is-cur" : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
