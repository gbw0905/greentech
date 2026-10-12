import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CountryFlag } from "./CountryFlag";
import {
  policyStatusFor,
  POLICY_STATUS_COLOR,
  type CountryProfile,
} from "@/features/policy/taxonomy";
import type { CSSProperties } from "react";

export function CountryProfileHeader({
  country,
  section = "overview",
}: {
  country: CountryProfile;
  section?: "overview" | "mandates" | "updates";
}) {
  const status = policyStatusFor(country);
  return (
    <header className="banner">
      <div className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/" hash="map">
            Jurisdiction map
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{country.name}</span>
        </nav>
        <div className="hero-grid">
          <div>
            <div className="hero-top">
              <span className="eyebrow">Policy profile</span>
              <span
                className="status"
                style={{ "--status-color": POLICY_STATUS_COLOR[status] } as CSSProperties}
              >
                <i aria-hidden="true" />
                {status}
              </span>
            </div>
            <div className="hero-title">
              <span className="flag">
                <CountryFlag slug={country.slug} />
              </span>
              <h1>{country.name}</h1>
            </div>
            <p className="hero-lede">{country.blurb}</p>
            <div className="chips">
              {country.frameworks.map((f) => (
                <span key={f}>{f}</span>
              ))}
            </div>
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
