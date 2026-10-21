import { useEffect } from "react";
import { ArrowRight, ExternalLink, FileText, Layers, Newspaper, Target } from "lucide-react";
import type { CountryProfile } from "@/features/policy/taxonomy";
import type { PolicyFeed } from "@/features/policy/contracts";
import { useCountryProfile, useCountryMandates, useGovernmentSites } from "../hooks/useCountryData";
import { CountryProfileHeader } from "./CountryProfileHeader";
import { CountryTrackingStrip } from "./CountryTrackingStrip";
import { CountryUpdatesPanel } from "./CountryUpdatesPanel";
import { PolicyProgramme } from "./PolicyProgramme";
import { useCountrySection } from "../hooks/useCountrySection";
import "@/components/PageDesign.css";
import "./CountryPolicyPage.css";

export function CountryPolicyPage({
  country: staticCountry,
  initialFeed = null,
  focusSection = "overview",
}: {
  country: CountryProfile;
  initialFeed?: PolicyFeed | null;
  focusSection?: "overview" | "mandates" | "updates";
}) {
  const { data: dynamicCountry } = useCountryProfile(staticCountry.slug);
  const country = dynamicCountry ?? staticCountry;
  const { data: mandates = [] } = useCountryMandates(country.slug);
  const { data: sources = [] } = useGovernmentSites(country.slug);
  const activeSection = useCountrySection(country.slug, focusSection);
  useEffect(() => {
    if (focusSection === "overview") return;
    const frame = requestAnimationFrame(() =>
      document.getElementById(focusSection)?.scrollIntoView({ block: "start" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [country.slug, focusSection]);
  return (
    <main className="desk-design country-design">
      <CountryProfileHeader country={country} section={activeSection} />
      <div className="wrap">
        <CountryTrackingStrip
          mandates={mandates.length}
          targets={country.mandates.length}
          sources={sources.length}
        />
        <div className="profile-grid">
          <div className="profile-col">
            <section className="card" id="overview">
              <p className="k">Policy briefing</p>
              <h2>At a glance</h2>
              <p className="lede">{country.blurb}</p>
              <div className="tags">
                {country.frameworks.map((f) => (
                  <span className="tag" key={f}>
                    {f}
                  </span>
                ))}
              </div>
            </section>
            <section className="card">
              <div className="head-row">
                <div>
                  <p className="k">Current policy markers</p>
                  <h2>Targets at a glance</h2>
                </div>
                <a href="#mandates" className="more">
                  Full detail <ArrowRight size={14} className="inline-block" />
                </a>
              </div>
              <dl className="targets">
                {country.mandates.map((m) => (
                  <div className="target" key={m.label}>
                    <dt>
                      <Target size={16} />
                      {m.label}
                    </dt>
                    <dd>{m.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="card" id="mandates">
              <p className="k">Timeline &amp; compliance</p>
              <h2>Mandates &amp; targets</h2>
              {mandates.length ? (
                <div className="progs">
                  {mandates.map((m) => (
                    <PolicyProgramme mandate={m} key={m.id} />
                  ))}
                </div>
              ) : (
                <p className="empty">No active obligations tracked for this jurisdiction yet.</p>
              )}
            </section>
            <CountryUpdatesPanel key={country.slug} country={country} initialFeed={initialFeed} />
          </div>
          <aside className="aside" aria-label="Sources and shortcuts">
            <section className="card">
              <p className="k">Verified evidence</p>
              <h2>Official sources</h2>
              {sources.length ? (
                <ul className="src">
                  {sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        <span>{s.label}</span>
                        <ExternalLink size={15} />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No official sources linked yet.</p>
              )}
            </section>
            {[
              {
                id: "mandates",
                label: "Mandates & targets",
                detail: "Timeline and compliance",
                icon: Layers,
              },
              {
                id: "updates",
                label: "Live updates",
                detail: "Calendar-filtered changes",
                icon: Newspaper,
              },
            ].map(({ id, label, detail, icon: Icon }) => (
              <a className="act" href={`#${id}`} key={id}>
                <span className="ai">
                  <Icon size={20} />
                </span>
                <div>
                  <b>{label}</b>
                  <span>{detail}</span>
                </div>
                <ArrowRight className="ar" size={17} />
              </a>
            ))}
            <p className="note">
              <FileText size={16} />
              Summary snapshot compiled from government records; confirm against the official
              sources listed.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
