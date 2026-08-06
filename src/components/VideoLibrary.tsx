import { useMemo, useState } from "react";
import { PlayCircle, ExternalLink, Video, Search } from "lucide-react";

type Platform = "YouTube" | "Web";

interface VideoEntry {
  title: string;
  source: string;
  platform: Platform;
  topic: string;
  blurb: string;
  url: string;
}

/** Curated, always-live channel & programme feeds. Links open the publisher's own video hub. */
const ENTRIES: VideoEntry[] = [
  {
    title: "IEA Bioenergy — reports, webinars & explainers",
    source: "IEA Bioenergy",
    platform: "YouTube",
    topic: "Policy",
    blurb: "Technology collaboration programme webinars on bioenergy deployment and policy design.",
    url: "https://www.youtube.com/@IEABioenergy/videos",
  },
  {
    title: "IRENA — renewable fuels & transport decarbonisation",
    source: "IRENA",
    platform: "YouTube",
    topic: "Policy",
    blurb: "Intergovernmental agency briefings on biofuel roadmaps and country energy transitions.",
    url: "https://www.youtube.com/@IRENA/videos",
  },
  {
    title: "US Department of Energy — Bioenergy Technologies Office",
    source: "US DOE BETO",
    platform: "Web",
    topic: "North America",
    blurb: "Peer-review sessions and programme videos on renewable diesel, SAF and feedstocks.",
    url: "https://www.energy.gov/eere/bioenergy/videos",
  },
  {
    title: "Renewable Fuels Association — ethanol policy briefings",
    source: "RFA",
    platform: "YouTube",
    topic: "Ethanol",
    blurb: "US ethanol industry updates: RFS volumes, E15 year-round, carbon scoring.",
    url: "https://www.youtube.com/@EthanolRFA/videos",
  },
  {
    title: "ePURE — European renewable ethanol",
    source: "ePURE",
    platform: "YouTube",
    topic: "Europe",
    blurb: "EU policy commentary on RED III, blending obligations and low-carbon liquid fuels.",
    url: "https://www.youtube.com/@ePUREethanol/videos",
  },
  {
    title: "European Commission — Energy",
    source: "European Commission",
    platform: "YouTube",
    topic: "Europe",
    blurb: "Official EU energy channel: RED III, RefuelEU Aviation and Fit for 55 explainers.",
    url: "https://www.youtube.com/@EUEnergy/videos",
  },
  {
    title: "ICAO — sustainable aviation fuel programme",
    source: "ICAO",
    platform: "YouTube",
    topic: "SAF",
    blurb: "CORSIA, SAF eligibility rules and the global aviation fuel framework.",
    url: "https://www.youtube.com/@icaovideo/videos",
  },
  {
    title: "Biofuels Digest — conference & interview archive",
    source: "Biofuels Digest",
    platform: "Web",
    topic: "Industry",
    blurb: "Trade-press video coverage of project announcements and policy panels.",
    url: "https://www.biofuelsdigest.com/bdigest/category/multimedia/",
  },
  {
    title: "World Biogas Association",
    source: "WBA",
    platform: "YouTube",
    topic: "Biogas",
    blurb: "Biomethane policy, digestate rules and grid-injection incentive schemes.",
    url: "https://www.youtube.com/@worldbiogasassociation/videos",
  },
  {
    title: "UNICA — Brazilian sugarcane & bioenergy",
    source: "UNICA",
    platform: "YouTube",
    topic: "Latin America",
    blurb: "RenovaBio, CBIO trading and Brazil's ethanol blending policy.",
    url: "https://www.youtube.com/@unicaoficial/videos",
  },
];

/** Live topic searches — always return the newest clips on that policy thread. */
const LIVE_SEARCHES: string[] = [
  "ethanol blending mandate",
  "sustainable aviation fuel policy",
  "renewable diesel regulation",
  "biodiesel mandate 2026",
  "RED III biofuels",
  "biogas biomethane policy",
];

const TOPICS = ["All", ...Array.from(new Set(ENTRIES.map((e) => e.topic)))];

export function VideoLibrary() {
  const [topic, setTopic] = useState("All");
  const list = useMemo(
    () => (topic === "All" ? ENTRIES : ENTRIES.filter((e) => e.topic === topic)),
    [topic],
  );

  return (
    <section className="glass-panel rise space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="label-mono flex items-center gap-2 text-muted-foreground">
          <Video className="size-3.5" /> Video briefing room · {list.length} channels
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTopic(t)}
              aria-pressed={topic === t}
              className={`label-mono rounded-full border px-2.5 py-1 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                topic === t
                  ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-frost)]"
                  : "border-border bg-surface-2 text-muted-foreground hover:text-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((v) => (
          <a
            key={v.url}
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-panel lift group flex flex-col gap-2 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="label-mono text-primary">{v.platform}</span>
              <PlayCircle className="size-5 text-primary transition-transform duration-200 group-hover:scale-110" />
            </div>
            <h3 className="font-display text-sm font-semibold transition-colors group-hover:text-primary">
              {v.title}
            </h3>
            <p className="text-xs text-muted-foreground">{v.blurb}</p>
            <div className="mt-auto flex items-center gap-1.5 pt-1 font-mono text-[0.65rem] text-muted-foreground">
              {v.source} <ExternalLink className="size-3" />
            </div>
          </a>
        ))}
      </div>

      <div>
        <h3 className="label-mono flex items-center gap-2 text-muted-foreground">
          <Search className="size-3.5" /> Live video searches
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {LIVE_SEARCHES.map((q) => (
            <a
              key={q}
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=CAI%253D`}
              target="_blank"
              rel="noopener noreferrer"
              className="label-mono rounded-full border border-border bg-surface-2 px-3 py-1.5 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
            >
              {q}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
