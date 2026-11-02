import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp } from "lucide-react";
import { getOilPricesFn } from "@/features/markets/oil-server-functions";
import { feedQuery } from "@/features/policy/feed-query";
import type { PolicyUpdate } from "@/features/policy/contracts";

function PricePill({
  label,
  price,
  change,
  changePct,
  symbol,
}: {
  label: string;
  price: number;
  change: number;
  changePct: number;
  symbol: string;
}) {
  const up = change >= 0;
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
      <span className="sr-only">{symbol}</span>
      <span className="font-semibold text-[#0e2a43]">{label}</span>
      <span className="text-[#4c6278] tabular-nums">
        {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span
        className={`inline-flex items-center gap-0.5 tabular-nums ${up ? "text-[#178a6b]" : "text-[#b4233c]"}`}
      >
        {up ? (
          <TrendingUp className="sr-only size-3" />
        ) : (
          <TrendingDown className="sr-only size-3" />
        )}
        {up ? "+" : ""}
        {changePct.toFixed(2)}%
      </span>
    </span>
  );
}

export function LiveMarquee({
  initialMarket,
}: {
  initialMarket?: Awaited<ReturnType<typeof getOilPricesFn>> | null;
}) {
  const { data: oilData } = useQuery({
    queryKey: ["oil-prices"],
    queryFn: () => getOilPricesFn(),
    initialData: initialMarket ?? undefined,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const { data: feedData } = useQuery({
    ...feedQuery,
    refetchInterval: 60_000,
  });

  const quotes = oilData?.quotes ?? [];
  const latest = (feedData?.updates as PolicyUpdate[] | undefined)?.slice(0, 4) ?? [];

  const renderContent = (copy: string) => (
    <>
      {quotes.map((q) => (
        <span key={`${copy}-${q.symbol}`} className="shrink-0 px-[22px]">
          <PricePill
            label={q.label}
            price={q.price}
            change={q.change}
            changePct={q.changePct}
            symbol={q.symbol}
          />
        </span>
      ))}

      {latest.map((u) => (
        <span
          key={`${copy}-${u.id}`}
          className="shrink-0 px-[22px] whitespace-nowrap text-[#4c6278]"
        >
          <span className="text-[#7b8ea0]">{u.countryName ?? "Global"}</span>
          <span className="mx-2 text-[#d6e1ea]">·</span>
          <span className="font-medium text-[#0e2a43]">{u.title}</span>
        </span>
      ))}
    </>
  );

  const lastScan = feedData?.fetchedAt
    ? new Date(feedData.fetchedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

  return (
    <div
      role="region"
      aria-label="Live market and policy updates"
      className="site-ribbon flex h-[42px] items-stretch overflow-hidden border-b border-[#d6e1ea] bg-white font-['Instrument_Sans'] text-[14px]"
    >
      <div className="relative z-10 flex shrink-0 items-center gap-2 border-r border-[#d6e1ea] bg-white px-5 font-semibold text-[#0e2a43]">
        <span className="pulse-dot size-[7px] rounded-full bg-[#178a6b]" />
        Markets
      </div>
      <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_40px,#000_calc(100%-40px),transparent)]">
        <div className="marquee-track h-full items-center">
          {renderContent("first")}
          {renderContent("second")}
        </div>
      </div>
      <div className="relative z-10 hidden shrink-0 items-center gap-1.5 border-l border-[#d6e1ea] bg-white px-5 text-[#7b8ea0] min-[761px]:flex">
        Last Updated <span className="font-semibold text-[#4c6278]">{lastScan}</span>
      </div>
    </div>
  );
}
