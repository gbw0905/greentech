import { Link } from "@tanstack/react-router";
import { ArrowLeft, Flag, Layers, Newspaper, Radar } from "lucide-react";
import { CountryFlag } from "@/components/CountryFlag";
import {
  REGION_ACCENT,
  POLICY_STATUS_COLOR,
  policyStatusFor,
  type CountryProfile,
} from "@/lib/policy-taxonomy";

const TABS = [
  { to: "/countries/$slug", label: "Overview", icon: Flag, exact: true },
  { to: "/countries/$slug/mandates", label: "Mandates & targets", icon: Layers, exact: false },
  { to: "/countries/$slug/updates", label: "Live updates", icon: Newspaper, exact: false },
] as const;

export function CountryProfileHeader({
  country,
  compact = false,
}: {
  country: CountryProfile;
  compact?: boolean;
}) {
  const status = policyStatusFor(country);
  return (
    <header className="rise overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="h-1.5 bg-gradient-to-r from-tracker-red via-tracker-green to-tracker-blue" aria-hidden />
      <div className="px-4 pt-4 sm:px-6 sm:pt-5">
      <Link
        to="/"
        className="label-mono inline-flex items-center gap-2 text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" /> Back to tracker
      </Link>

      <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid h-12 w-16 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-3xl shadow-sm sm:h-14 sm:w-20">
            <CountryFlag slug={country.slug} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="label-mono" style={{ color: REGION_ACCENT[country.region] }}>{country.region}</span>
              <span className="text-border" aria-hidden>/</span>
              <span className="label-mono text-muted-foreground">Policy profile</span>
            </div>
            <h1 className={`mt-1 font-display font-extrabold ${compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"}`}>
              {country.name}
            </h1>
          </div>
        </div>
        <div
          className="label-mono inline-flex w-fit items-center gap-2 rounded-md border bg-surface-1 px-3 py-2 font-bold"
          style={{ borderColor: POLICY_STATUS_COLOR[status], color: POLICY_STATUS_COLOR[status] }}
        >
          <Radar className="size-3.5" />
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-30 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-current" />
          </span>
          {status}
        </div>
      </div>
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-t border-border px-3 pt-1 sm:px-5" aria-label="Country profile sections">
        {TABS.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            params={{ slug: country.slug }}
            activeOptions={{ exact }}
            className="label-mono inline-flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 py-3 text-muted-foreground transition-colors hover:text-primary"
            activeProps={{
              className:
                "label-mono inline-flex shrink-0 items-center gap-1.5 border-b-2 border-primary px-3 py-3 font-bold text-primary transition-colors",
            }}
          >
            <Icon className="size-3.5" /> {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
