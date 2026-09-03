import { useMemo } from "react";
import { PlayCircle, ExternalLink, Video, Search, MapPin, Scale } from "lucide-react";
import {
  COUNTRIES,
  REGION_ACCENT,
  FUEL_ACCENT,
  flagFor,
  type FuelType,
  type Region,
} from "@/lib/policy-taxonomy";

type Platform = "YouTube" | "Web";

interface VideoEntry {
  title: string;
  source: string;
  platform: Platform;
  blurb: string;
  url: string;
  regions: Region[];
  /** country slugs from the taxonomy */
  countries: string[];
  fuels: FuelType[];
  policies: string[];
}

/** Curated publisher video hubs, tagged to the same taxonomy as the policy feed. */
const ENTRIES: VideoEntry[] = [
  {
    title: "IEA Bioenergy — reports, webinars & explainers",
    source: "IEA Bioenergy",
    platform: "YouTube",
    blurb: "Intergovernmental webinars on bioenergy deployment and policy design.",
    url: "https://www.youtube.com/@IEABioenergy/videos",
    regions: ["Global"],
    countries: [],
    fuels: ["Ethanol", "Biodiesel", "Biogas"],
    policies: ["Net Zero Roadmap", "Bioenergy sustainability criteria"],
  },
  {
    title: "IRENA — renewable fuels & transport decarbonisation",
    source: "IRENA",
    platform: "YouTube",
    blurb: "Country biofuel roadmaps and energy transition outlooks.",
    url: "https://www.youtube.com/@IRENA/videos",
    regions: ["Global", "Africa"],
    countries: ["nigeria", "kenya", "south-africa"],
    fuels: ["Ethanol", "Biodiesel", "SAF"],
    policies: ["World Energy Transitions Outlook"],
  },
  {
    title: "US DOE — Bioenergy Technologies Office video library",
    source: "US DOE BETO",
    platform: "Web",
    blurb: "Programme reviews on renewable diesel, SAF and feedstock supply.",
    url: "https://www.energy.gov/eere/bioenergy/videos",
    regions: ["North America"],
    countries: ["united-states"],
    fuels: ["Renewable Diesel", "SAF", "Feedstock"],
    policies: ["SAF Grand Challenge", "Clean Fuel Production Credit (45Z)"],
  },
  {
    title: "Renewable Fuels Association — ethanol policy briefings",
    source: "RFA",
    platform: "YouTube",
    blurb: "RFS volumes, year-round E15 and carbon scoring for US ethanol.",
    url: "https://www.youtube.com/@EthanolRFA/videos",
    regions: ["North America"],
    countries: ["united-states"],
    fuels: ["Ethanol"],
    policies: ["Renewable Fuel Standard (RVO)", "E15 year-round"],
  },
  {
    title: "Canada Clean Fuel Regulations explainers",
    source: "Environment & Climate Change Canada",
    platform: "Web",
    blurb: "How the Clean Fuel Regulations credit market and compliance work.",
    url: "https://www.canada.ca/en/environment-climate-change/services/managing-pollution/energy-production/fuel-regulations/clean-fuel-regulations.html",
    regions: ["North America"],
    countries: ["canada"],
    fuels: ["Renewable Diesel", "Ethanol"],
    policies: ["Clean Fuel Regulations"],
  },
  {
    title: "ePURE — European renewable ethanol",
    source: "ePURE",
    platform: "YouTube",
    blurb: "RED III transposition, blending obligations and low-carbon liquid fuels.",
    url: "https://www.youtube.com/@ePUREethanol/videos",
    regions: ["Europe"],
    countries: ["european-union", "germany", "france", "sweden"],
    fuels: ["Ethanol"],
    policies: ["RED III", "Fit for 55"],
  },
  {
    title: "European Commission — Energy",
    source: "European Commission",
    platform: "YouTube",
    blurb: "Official EU channel: RED III, RefuelEU Aviation and Fit for 55.",
    url: "https://www.youtube.com/@EUEnergy/videos",
    regions: ["Europe"],
    countries: ["european-union", "netherlands", "germany", "france"],
    fuels: ["SAF", "Biodiesel", "Biogas"],
    policies: ["RED III", "RefuelEU Aviation", "Fit for 55"],
  },
  {
    title: "UK Department for Transport — RTFO & SAF mandate",
    source: "UK DfT",
    platform: "Web",
    blurb: "Renewable Transport Fuel Obligation and the UK SAF mandate.",
    url: "https://www.gov.uk/government/collections/renewable-transport-fuels-obligation-rtfo-guidance",
    regions: ["Europe"],
    countries: ["united-kingdom"],
    fuels: ["SAF", "Biodiesel"],
    policies: ["RTFO", "UK SAF Mandate"],
  },
  {
    title: "ICAO — sustainable aviation fuel programme",
    source: "ICAO",
    platform: "YouTube",
    blurb: "CORSIA rules, SAF eligibility and the global aviation fuel framework.",
    url: "https://www.youtube.com/@icaovideo/videos",
    regions: ["Global"],
    countries: ["united-arab-emirates", "saudi-arabia", "japan", "south-korea"],
    fuels: ["SAF"],
    policies: ["CORSIA", "ICAO LTAG"],
  },
  {
    title: "UNICA — Brazilian sugarcane & bioenergy",
    source: "UNICA",
    platform: "YouTube",
    blurb: "RenovaBio, CBIO trading and Brazil's blending policy.",
    url: "https://www.youtube.com/@unicaoficial/videos",
    regions: ["Latin America"],
    countries: ["brazil", "argentina", "colombia"],
    fuels: ["Ethanol", "Biodiesel"],
    policies: ["RenovaBio", "Fuel of the Future law"],
  },
  {
    title: "India — Ethanol Blended Petrol Programme briefings",
    source: "NITI Aayog / MoPNG",
    platform: "YouTube",
    blurb: "E20 rollout, flex-fuel vehicles and feedstock diversification in India.",
    url: "https://www.youtube.com/results?search_query=India+ethanol+blending+programme+E20+policy&sp=CAI%253D",
    regions: ["Asia-Pacific"],
    countries: ["india"],
    fuels: ["Ethanol", "Feedstock"],
    policies: ["Ethanol Blended Petrol Programme (E20)"],
  },
  {
    title: "Indonesia B40 & palm-based biodiesel coverage",
    source: "APROBI / Ministry of Energy",
    platform: "YouTube",
    blurb: "B40 mandate implementation, levies and palm feedstock supply.",
    url: "https://www.youtube.com/results?search_query=Indonesia+B40+biodiesel+mandate+policy&sp=CAI%253D",
    regions: ["Asia-Pacific"],
    countries: ["indonesia", "malaysia", "thailand", "philippines"],
    fuels: ["Biodiesel", "Feedstock"],
    policies: ["B40 mandate", "Palm oil export levy"],
  },
  {
    title: "World Biogas Association",
    source: "WBA",
    platform: "YouTube",
    blurb: "Biomethane policy, digestate rules and grid-injection incentives.",
    url: "https://www.youtube.com/@worldbiogasassociation/videos",
    regions: ["Global", "Europe"],
    countries: ["european-union", "united-kingdom", "india"],
    fuels: ["Biogas"],
    policies: ["Biomethane Action Plan", "SATAT"],
  },
  {
    title: "Biofuels Digest — conference & interview archive",
    source: "Biofuels Digest",
    platform: "Web",
    blurb: "Trade-press video coverage of projects and policy panels worldwide.",
    url: "https://www.biofuelsdigest.com/bdigest/category/multimedia/",
    regions: ["Global", "North America"],
    countries: ["united-states"],
    fuels: ["Ethanol", "Renewable Diesel", "SAF"],
    policies: ["Industry & market policy commentary"],
  },
];

const nameFor = (slug: string) => COUNTRIES.find((c) => c.slug === slug)?.name ?? slug;

export function VideoLibrary({
  regions,
  fuels,
  country,
  onSelectCountry,
}: {
  regions: Region[];
  fuels: FuelType[];
  country: string | null;
  onSelectCountry: (slug: string | null) => void;
}) {
  const list = useMemo(
    () =>
      ENTRIES.filter(
        (v) =>
          (regions.length === 0 || v.regions.some((r) => regions.includes(r))) &&
          (fuels.length === 0 || v.fuels.some((f) => fuels.includes(f))) &&
          (!country || v.countries.includes(country)),
      ),
    [regions, fuels, country],
  );

  const searches = useMemo(() => {
    const base = country ? nameFor(country) : regions[0] ?? "global";
    const topics = fuels.length ? fuels : (["ethanol", "biodiesel", "sustainable aviation fuel"] as string[]);
    return topics.slice(0, 4).map((t) => `${base} ${t} policy`);
  }, [country, regions, fuels]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Every video hub is tagged to the same countries, regions, fuels and policy instruments as
          the feed — the filters on the left apply here too.
        </p>
        <span className="label-mono text-primary">{list.length} matching</span>
      </div>

      {list.length === 0 && (
        <p className="glass-panel p-6 text-sm text-muted-foreground">
          No video hubs match the current filters
          {country ? ` for ${nameFor(country)}` : ""}. Clear a filter to see more.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((v) => (
          <article key={v.url} className="glass-panel lift group flex flex-col gap-2.5 p-4">
            <div className="flex items-center justify-between">
              <span className="label-mono text-primary">{v.platform}</span>
              <PlayCircle className="size-5 text-primary transition-transform duration-200 group-hover:scale-110" />
            </div>
            <a
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-sm font-semibold transition-colors hover:text-primary"
            >
              {v.title}
            </a>
            <p className="text-xs text-muted-foreground">{v.blurb}</p>

            <div className="flex flex-wrap gap-1">
              {v.regions.map((r) => (
                <span
                  key={r}
                  className="label-mono rounded-full px-2 py-0.5 text-[0.6rem]"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${REGION_ACCENT[r]} 16%, transparent)`,
                    color: REGION_ACCENT[r],
                  }}
                >
                  {r}
                </span>
              ))}
              {v.fuels.map((f) => (
                <span
                  key={f}
                  className="label-mono rounded-full px-2 py-0.5 text-[0.6rem]"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${FUEL_ACCENT[f]} 16%, transparent)`,
                    color: FUEL_ACCENT[f],
                  }}
                >
                  {f}
                </span>
              ))}
            </div>

            {v.countries.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <MapPin className="size-3 text-muted-foreground" />
                {v.countries.map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => onSelectCountry(country === slug ? null : slug)}
                    className={`label-mono rounded-full border px-2 py-0.5 text-[0.6rem] transition-colors ${
                      country === slug
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface-2 text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    <CountryFlag slug={slug} className="mr-1" /> {nameFor(slug)}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-start gap-1.5 text-[0.68rem] text-muted-foreground">
              <Scale className="mt-0.5 size-3 shrink-0" />
              <span>{v.policies.join(" · ")}</span>
            </div>

            <a
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto flex items-center gap-1.5 pt-1 font-mono text-[0.65rem] text-muted-foreground transition-colors hover:text-primary"
            >
              {v.source} <ExternalLink className="size-3" />
            </a>
          </article>
        ))}
      </div>

      <div>
        <h3 className="label-mono flex items-center gap-2 text-muted-foreground">
          <Search className="size-3.5" /> Live video searches for this selection
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {searches.map((q) => (
            <a
              key={q}
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=CAI%253D`}
              target="_blank"
              rel="noopener noreferrer"
              className="label-mono rounded-full border border-border bg-surface-2 px-3 py-1.5 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary"
            >
              <Video className="mr-1 inline size-3" />
              {q}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
