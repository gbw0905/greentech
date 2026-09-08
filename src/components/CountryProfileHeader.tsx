import { Link } from "@tanstack/react-router";
import { ArrowLeft, Flag, Layers, Newspaper } from "lucide-react";
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
    <header className="rise border-b border-border pb-5">
      <Link
        to="/"
        className="label-mono inline-flex items-center gap-2 text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" /> Back to tracker
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="label-mono" style={{ color: REGION_ACCENT[country.region] }}>
          {country.region}
        </span>
        <span
          className="label-mono inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5"
          style={{ borderColor: POLICY_STATUS_COLOR[status], color: POLICY_STATUS_COLOR[status] }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ background: POLICY_STATUS_COLOR[status] }}
          />
          {status}
        </span>
      </div>

      <h1
        className={`mt-3 flex items-center gap-3 font-display font-extrabold tracking-tight ${
          compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"
        }`}
      >
        <CountryFlag slug={country.slug} />
        {country.name}
      </h1>

      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Country profile sections">
        {TABS.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            params={{ slug: country.slug }}
            activeOptions={{ exact }}
            className="label-mono inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3.5 py-1.5 text-muted-foreground transition-all hover:-translate-y-0.5 hover:text-primary"
            activeProps={{
              className:
                "label-mono inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary px-3.5 py-1.5 text-primary-foreground transition-all",
            }}
          >
            <Icon className="size-3.5" /> {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
