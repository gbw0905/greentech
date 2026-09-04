import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { REGION_ACCENT } from "@/lib/policy-taxonomy";
import { CountryFlag } from "@/components/CountryFlag";
import { imageForUpdate } from "@/lib/update-images";
import type { PolicyUpdate } from "@/lib/policy-types";

export function formatDate(iso: string | null) {
  if (!iso) return "Undated";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
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
  const photo = imageForUpdate(update);
  return (
    <article
      className={`glass-panel lift group relative overflow-hidden ${compact ? "flex gap-3 p-2.5 pl-3.5" : "p-5 pl-6"}`}
      style={{ borderLeftColor: REGION_ACCENT[update.region], borderLeftWidth: 3 }}
    >
      {compact && (
        <a
          href={update.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-surface-2 sm:h-[4.5rem] sm:w-28"
          tabIndex={-1}
          aria-hidden
        >
          <img
            src={photo.src}
            alt={photo.alt}
            loading="lazy"
            width={768}
            height={512}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </a>
      )}
      <div className="min-w-0 flex-1">
        <div
          className={`label-mono flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-muted-foreground ${compact ? "text-[11px]" : ""}`}
        >
          <span
            className={`rounded-full font-semibold tracking-[0.14em] uppercase ${compact ? "px-1.5 py-0" : "px-2 py-0.5"} ${update.category === "market" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}
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
                className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline"
              >
                <CountryFlag slug={update.countrySlug} />
                {update.countryName}
              </Link>
            </>
          )}
        </div>

        <h3
          className={`font-semibold leading-tight ${compact ? "mt-1 text-[15px]" : "mt-2 text-lg leading-snug"}`}
        >
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

        {update.summary && !compact && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{update.summary}</p>
        )}

        {update.fuels.length > 0 && (
          <div className={`flex flex-wrap items-center gap-1.5 ${compact ? "mt-1" : "mt-3"}`}>
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
      </div>
    </article>
  );
}