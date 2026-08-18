import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { REGION_ACCENT, flagFor } from "@/lib/policy-taxonomy";
import type { PolicyUpdate } from "@/lib/policy-types";

export function formatDate(iso: string | null) {
  if (!iso) return "Undated";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function UpdateCard({
  update,
  compact = false,
}: {
  update: PolicyUpdate;
  compact?: boolean;
}) {
  const host = hostOf(update.url);
  return (
    <article
      className={`glass-panel lift group relative overflow-hidden ${compact ? "p-3 pl-4" : "p-5 pl-6"}`}
      style={{ borderLeftColor: REGION_ACCENT[update.region], borderLeftWidth: 3 }}
    >
      <div
        className={`label-mono flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground ${compact ? "text-[11px]" : ""}`}
      >
        <span
          className={`rounded-full font-semibold tracking-[0.14em] uppercase ${compact ? "px-1.5 py-0" : "px-2 py-0.5"}`}
          style={{
            background:
              update.category === "market"
                ? "color-mix(in oklch, var(--accent) 22%, transparent)"
                : "color-mix(in oklch, var(--primary) 22%, transparent)",
            color: update.category === "market" ? "var(--accent-foreground)" : "var(--primary)",
          }}
        >
          {update.category === "market" ? "Market" : "Policy"}
        </span>
        <time>{formatDate(update.publishedAt)}</time>
        {!compact && <span aria-hidden>/</span>}
        {!compact && (
          <span style={{ color: REGION_ACCENT[update.region] }}>{update.region}</span>
        )}
        {update.countrySlug && update.countryName && (
          <>
            <span aria-hidden>/</span>
            <Link
              to="/countries/$slug"
              params={{ slug: update.countrySlug }}
              className="inline-flex items-center gap-1.5 text-foreground underline-offset-4 hover:underline"
            >
              <span aria-hidden>{flagFor(update.countrySlug)}</span>
              {update.countryName}
            </Link>
          </>
        )}
      </div>

      <h3 className={`leading-snug font-semibold ${compact ? "mt-1 text-base" : "mt-2 text-lg"}`}>
        <a
          href={update.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary"
        >
          {update.title}
          <ArrowUpRight
            className={`ml-1 inline opacity-0 transition-opacity group-hover:opacity-100 ${compact ? "size-3.5" : "size-4"}`}
          />
        </a>
      </h3>

      {update.summary && (
        <p
          className={`text-muted-foreground ${compact ? "mt-1 line-clamp-2 text-xs" : "mt-2 line-clamp-3 text-sm"}`}
        >
          {update.summary}
        </p>
      )}

      {update.fuels.length > 0 && (
        <div className={`flex flex-wrap items-center gap-1.5 ${compact ? "mt-1.5" : "mt-3"}`}>
          {update.fuels.map((f) => (
            <span
              key={f}
              className={`label-mono rounded-full bg-secondary text-secondary-foreground ${compact ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5"}`}
            >
              {f}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}