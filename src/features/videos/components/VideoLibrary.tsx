import { CountryFlag } from "@/features/countries/components/CountryFlag";
import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ExternalLink, Video, Search, Scale } from "lucide-react";
import { COUNTRIES, type FuelType, type Region } from "@/features/policy/taxonomy";
import { VIDEO_HUBS } from "../video-library";
import "../videos.css";

const nameFor = (slug: string) => COUNTRIES.find((c) => c.slug === slug)?.name ?? slug;

export function VideoLibrary({
  regions,
  fuels,
  country,
  policies = [],
  onSelectCountry,
}: {
  regions: Region[];
  fuels: FuelType[];
  country: string | null;
  policies?: string[];
  onSelectCountry: (slug: string | null) => void;
}) {
  const reduced = useReducedMotion();
  const list = useMemo(
    () =>
      VIDEO_HUBS.filter(
        (v) =>
          (regions.length === 0 || v.regions.some((r) => regions.includes(r))) &&
          (fuels.length === 0 || v.fuels.some((f) => fuels.includes(f))) &&
          (!country || v.countries.includes(country)) &&
          (policies.length === 0 || v.policies.some((p) => policies.includes(p))),
      ),
    [regions, fuels, country, policies],
  );
  const searches = useMemo(() => {
    const base = country ? nameFor(country) : (regions[0] ?? "global");
    const topics = fuels.length
      ? fuels
      : (["ethanol", "biodiesel", "sustainable aviation fuel"] as string[]);
    return topics.slice(0, 4).map((t) => `${base} ${t} policy`);
  }, [country, regions, fuels]);
  return (
    <section className="videos-library" aria-labelledby="video-library-title">
      <header className="videos-section-head">
        <div>
          <h2 id="video-library-title">Channels &amp; official video hubs</h2>
          <p>
            Every video hub is tagged to the same countries, regions, fuels and policy instruments
            as the feed — the filters above apply here too.
          </p>
        </div>
        <span className="videos-match-count" role="status">
          {list.length} matches
        </span>
      </header>
      {list.length === 0 && (
        <p className="videos-empty" role="status">
          No video hubs match the current filters{country ? ` for ${nameFor(country)}` : ""}. Clear
          a filter to see more.
        </p>
      )}
      <div className="videos-hub-grid">
        {list.map((v, index) => (
          <motion.article
            key={v.url}
            className="videos-hub-card"
            initial={false}
            whileInView={reduced ? {} : { opacity: [0.7, 1], y: [12, 0] }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.4, delay: (index % 4) * 0.06 }}
          >
            <header>
              <h3>
                <a href={v.url} target="_blank" rel="noopener noreferrer">
                  {v.title}
                </a>
              </h3>
              <span className="videos-platform">{v.platform}</span>
            </header>
            <p className="videos-hub-blurb">{v.blurb}</p>
            <div className="videos-tag-row">
              {v.regions.map((r) => (
                <span key={r} className="videos-tag market">
                  {r}
                </span>
              ))}
            </div>
            <div className="videos-tag-row">
              {v.fuels.map((f) => (
                <span key={f} className="videos-tag leaf">
                  {f}
                </span>
              ))}
            </div>
            {v.countries.length > 0 && (
              <div className="videos-tag-row">
                {v.countries.map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    aria-pressed={country === slug}
                    onClick={() => onSelectCountry(country === slug ? null : slug)}
                    className="videos-country-tag"
                  >
                    <CountryFlag slug={slug} className="mr-1" />
                    {nameFor(slug)}
                  </button>
                ))}
              </div>
            )}
            <p className="videos-hub-policies">
              <Scale size={13} aria-hidden="true" />
              {v.policies.join(" · ")}
            </p>
            <a className="videos-hub-source" href={v.url} target="_blank" rel="noopener noreferrer">
              {v.source}
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </motion.article>
        ))}
      </div>
      <div className="videos-searches">
        <h3>
          <Search size={15} aria-hidden="true" />
          Live video searches for this selection
        </h3>
        <div>
          {searches.map((q) => (
            <a
              key={q}
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=CAI%253D`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Video size={13} aria-hidden="true" />
              {q}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
