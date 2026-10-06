import { MotionReveal } from "@/components/MotionReveal";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { PolicyUpdate } from "@/features/policy/contracts";
import { formatDate } from "@/features/policy/components/UpdateCard";
import { imageForUpdate } from "@/features/policy/update-images";

type Filter = "all" | PolicyUpdate["category"];

function UpdateMeta({ update }: { update: PolicyUpdate }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#7b8ea0]">
      <span
        className={`rounded-full px-2 py-1 font-semibold ${
          update.category === "market"
            ? "bg-[#e6effa] text-[#2563a8]"
            : "bg-[#fcebef] text-[#b83859]"
        }`}
      >
        {update.category === "market" ? "Market" : "Policy"}
      </span>
      <time>{formatDate(update.publishedAt)}</time>
      {update.countryName && (
        <span className="font-medium text-[#178a6b]">{update.countryName}</span>
      )}
    </div>
  );
}

function FeaturedUpdate({ update }: { update: PolicyUpdate }) {
  const image = imageForUpdate(update);
  return (
    <a
      href={update.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex min-h-[480px] overflow-hidden rounded-[18px] border border-[#c8d6e1] bg-[#0e2a43] text-white no-underline min-[1101px]:min-h-[480px]"
    >
      <img
        src={image.src}
        alt={image.alt}
        width={1200}
        height={800}
        className="absolute inset-x-0 top-0 h-[62%] w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
      />
      <span className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#178a6b]">
        Newest
      </span>
      <div className="relative mt-auto w-full bg-[#0e2a43] px-7 py-6 min-[1101px]:px-8 min-[1101px]:py-7">
        <UpdateMeta update={update} />
        <h3 className="mt-4 font-['Bricolage_Grotesque'] text-[clamp(1.55rem,2vw,1.85rem)]/[1.18] font-semibold tracking-[-0.02em]">
          {update.title}
        </h3>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-white/65">
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-white">
            {update.fuels[0] ?? (update.category === "market" ? "Markets" : "Policy")}
          </span>
          <span className="truncate">{update.source}</span>
        </div>
      </div>
    </a>
  );
}

function UpdateTile({ update }: { update: PolicyUpdate }) {
  const image = imageForUpdate(update);
  return (
    <a
      href={update.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-[232px] flex-col overflow-hidden rounded-[18px] border border-[#d6e1ea] bg-white text-[#0e2a43] no-underline min-[1101px]:min-h-[232px]"
    >
      <div className="h-[84px] shrink-0 overflow-hidden bg-[#e3f4ee]">
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          width={768}
          height={512}
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <UpdateMeta update={update} />
        <h3 className="mt-2 line-clamp-2 font-['Bricolage_Grotesque'] text-[1.02rem]/[1.3] font-semibold tracking-[-0.01em]">
          {update.title}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-[#7b8ea0]">
          <span className="rounded-full bg-[#eef3f7] px-2.5 py-1 text-[#4c6278]">
            {update.fuels[0] ?? (update.category === "market" ? "Markets" : "Policy")}
          </span>
          <span className="truncate text-right">{update.source}</span>
        </div>
      </div>
    </a>
  );
}

export function LatestUpdatesSection({ updates }: { updates: PolicyUpdate[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const counts = useMemo(
    () => ({
      all: updates.length,
      market: updates.filter((update) => update.category === "market").length,
      policy: updates.filter((update) => update.category === "policy").length,
    }),
    [updates],
  );
  const visibleUpdates = useMemo(
    () => (filter === "all" ? updates : updates.filter((update) => update.category === filter)),
    [filter, updates],
  );

  return (
    <section
      id="updates"
      className="scroll-mt-[106px] border-t border-[#d6e1ea] bg-[#eef3f7] py-8 font-['Instrument_Sans'] text-[#0e2a43] min-[961px]:py-9"
    >
      <div className="mx-auto max-w-[1240px] px-5 min-[621px]:px-8">
        <MotionReveal className="flex flex-col justify-between gap-4 min-[821px]:flex-row min-[821px]:items-end">
          <div>
            <h2 className="font-['Bricolage_Grotesque'] text-[clamp(2rem,3.4vw,2.75rem)]/[1.05] font-semibold tracking-[-0.03em]">
              Latest updates
            </h2>
          </div>

          <div
            className="inline-flex w-fit rounded-full border border-[#d6e1ea] bg-white p-1"
            role="tablist"
            aria-label="Filter latest updates"
          >
            {(["all", "market", "policy"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                onClick={() => setFilter(value)}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold capitalize transition-colors ${
                  filter === value ? "bg-[#0e2a43] text-white" : "text-[#4c6278] hover:bg-[#eef3f7]"
                }`}
              >
                {value}
                <span
                  className={`grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[11px] ${
                    filter === value ? "bg-white/15 text-white" : "bg-[#eef3f7] text-[#4c6278]"
                  }`}
                >
                  {counts[value]}
                </span>
              </button>
            ))}
          </div>
        </MotionReveal>

        <p className="mt-3 text-xs font-medium text-[#7b8ea0]">
          Showing {visibleUpdates.length} {visibleUpdates.length === 1 ? "update" : "updates"}
        </p>

        {visibleUpdates.length > 0 ? (
          <div className="mt-3 grid gap-4 min-[901px]:grid-cols-[1.05fr_1fr]">
            <MotionReveal className="flex [&>a]:w-full">
              <FeaturedUpdate update={visibleUpdates[0]!} />
            </MotionReveal>
            {visibleUpdates.length > 1 && (
              <div className="grid gap-4 min-[541px]:grid-cols-2">
                {visibleUpdates.slice(1).map((update, index) => (
                  <MotionReveal
                    key={update.id}
                    delay={(index + 1) * 0.09}
                    className="flex [&>a]:w-full"
                  >
                    <UpdateTile update={update} />
                  </MotionReveal>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-[18px] border border-[#d6e1ea] bg-white p-8 text-sm text-[#4c6278]">
            No updates in this category yet.
          </div>
        )}

        <div className="mt-5 flex justify-center">
          <Link
            to="/timeline"
            className="inline-flex h-[46px] items-center gap-3 rounded-[10px] border border-[#d6e1ea] bg-white px-[22px] text-[15px] font-semibold text-[#0e2a43] no-underline transition-colors hover:border-[#178a6b]"
          >
            View all updates
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
