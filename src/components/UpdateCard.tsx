import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { REGION_ACCENT } from "@/lib/policy-taxonomy";
import type { PolicyUpdate } from "@/lib/policy.server";

export function formatDate(iso: string | null) {
  if (!iso) return "Undated";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function UpdateCard({ update }: { update: PolicyUpdate }) {
  return (
    <article className="group relative border-l-2 bg-surface/60 p-5 transition-colors hover:bg-surface-2/70"
      style={{ borderLeftColor: REGION_ACCENT[update.region] }}
    >
      <div className="label-mono flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
        <time>{formatDate(update.publishedAt)}</time>
        <span aria-hidden>/</span>
        <span style={{ color: REGION_ACCENT[update.region] }}>{update.region}</span>
        {update.countrySlug && update.countryName && (
          <>
            <span aria-hidden>/</span>
            <Link
              to="/countries/$slug"
              params={{ slug: update.countrySlug }}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {update.countryName}
            </Link>
          </>
        )}
      </div>

      <h3 className="mt-2 text-lg leading-snug font-semibold">
        <a
          href={update.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary"
        >
          {update.title}
          <ArrowUpRight className="ml-1 inline size-4 opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
      </h3>

      {update.summary && (
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{update.summary}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="label-mono text-muted-foreground">{update.source}</span>
        {update.fuels.map((f) => (
          <span
            key={f}
            className="label-mono rounded-full border border-border px-2 py-0.5 text-foreground/80"
          >
            {f}
          </span>
        ))}
      </div>
    </article>
  );
}