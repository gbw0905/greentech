import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PlayCircle, Newspaper, RefreshCw, ExternalLink } from "lucide-react";
import { getLiveMediaFn } from "@/features/videos/server-functions";
import { COUNTRIES, type FuelType } from "@/features/policy/taxonomy";

const BASE_KEYWORDS = [
  "bioenergy policy",
  "biofuel mandate",
  "sustainable aviation fuel",
  "renewable diesel",
  "biogas biomethane",
];

const FUEL_KEYWORD: Record<FuelType, string> = {
  Ethanol: "ethanol blending policy",
  Biodiesel: "biodiesel mandate",
  "Renewable Diesel": "renewable diesel HVO",
  SAF: "sustainable aviation fuel mandate",
  Biogas: "biomethane biogas policy",
  Feedstock: "biofuel feedstock supply",
};

const nameFor = (slug: string) => COUNTRIES.find((c) => c.slug === slug)?.name ?? slug;

export function LiveMediaFeed({ fuels, country }: { fuels: FuelType[]; country: string | null }) {
  const keywords = useMemo(() => {
    const topics = fuels.length ? fuels.map((f) => FUEL_KEYWORD[f]) : BASE_KEYWORDS;
    const prefix = country ? `${nameFor(country)} ` : "";
    return Array.from(new Set(topics.map((t) => `${prefix}${t}`))).slice(0, 6);
  }, [fuels, country]);

  const fetchMedia = useServerFn(getLiveMediaFn);
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["live-media", keywords],
    queryFn: () => fetchMedia({ data: { keywords } }),
    staleTime: 15 * 60_000,
  });

  const videos = data?.videos ?? [];
  const articles = data?.articles ?? [];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-xl font-bold">Live search — YouTube &amp; web</h3>
          <p className="text-xs text-muted-foreground">Fresh results for: {keywords.join(" · ")}</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="label-mono inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <RefreshCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {isFetching && videos.length === 0 && (
        <p className="glass-panel p-6 text-sm text-muted-foreground">
          Searching YouTube and the web…
        </p>
      )}

      {videos.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((v) => (
            <a
              key={v.id}
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel lift group flex flex-col overflow-hidden"
            >
              <div className="relative">
                <img
                  src={v.thumbnail}
                  alt={v.title}
                  loading="lazy"
                  className="aspect-video w-full object-cover"
                />
                <PlayCircle className="absolute bottom-2 left-2 size-6 text-primary drop-shadow transition-transform group-hover:scale-110" />
                {v.duration && (
                  <span className="label-mono absolute bottom-2 right-2 rounded bg-background/80 px-1.5 py-0.5 text-[0.6rem]">
                    {v.duration}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <p className="font-display text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
                  {v.title}
                </p>
                <p className="mt-auto font-mono text-[0.65rem] text-muted-foreground">
                  {v.channel}
                  {v.published ? ` · ${v.published}` : ""}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}

      {articles.length > 0 && (
        <div>
          <h4 className="label-mono flex items-center gap-2 text-muted-foreground">
            <Newspaper className="size-3.5" /> Web coverage
          </h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {articles.slice(0, 18).map((a) => (
              <a
                key={a.url}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-panel lift flex flex-col gap-1 p-3 text-sm transition-colors hover:text-primary"
              >
                <span className="font-medium leading-snug">{a.title}</span>
                <span className="flex items-center gap-1 font-mono text-[0.65rem] text-muted-foreground">
                  {a.source}
                  {a.published ? ` · ${new Date(a.published).toLocaleDateString()}` : ""}
                  <ExternalLink className="size-3" />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {!isFetching && videos.length === 0 && articles.length === 0 && (
        <p className="glass-panel p-6 text-sm text-muted-foreground">
          No live results right now — the curated hubs below still apply.
        </p>
      )}
    </section>
  );
}
