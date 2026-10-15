import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Trash2, ArrowRight } from "lucide-react";
import { AccountLayout } from "@/features/account/AccountLayout";
import { usePremium } from "@/features/premium/hooks/usePremium";
import {
  deleteCiRunFn,
  listCiRunsFn,
  type SavedCiRun,
  type SavedProgram,
} from "@/features/calculators/server-functions";

const TITLE = "My carbon intensity results | Global Bioenergy Watch";
const DESCRIPTION =
  "Premium dashboard for your own saved carbon intensity scenarios — compare each pathway you modelled against the California LCFS, Oregon CFP, EU RED III and other regulatory benchmarks.";

export const Route = createFileRoute("/my-results")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyResultsPage,
});

const TONE = { red: "rgb(203, 58, 58)", green: "rgb(30, 132, 73)", blue: "rgb(38, 96, 189)" };

const fmt = (v: number, d = 2) =>
  v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

function savingPct(run: SavedCiRun, p: SavedProgram) {
  if (p.benchmark == null || p.benchmark === 0) return null;
  return ((p.benchmark - run.ciTotal) / p.benchmark) * 100;
}

function MyResultsPage() {
  const { signedIn, premium, loading } = usePremium();
  const queryClient = useQueryClient();

  const {
    data: runs,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["ci-runs"],
    queryFn: () => listCiRunsFn(),
    enabled: signedIn && premium,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCiRunFn({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ci-runs"] }),
  });

  const list = runs ?? [];
  const best = list.length ? Math.min(...list.map((r) => r.ciTotal)) : null;
  const average = list.length ? list.reduce((s, r) => s + r.ciTotal, 0) / list.length : null;

  return (
    <AccountLayout
      title="My carbon intensity results"
      section="results"
      description="Your saved scenarios, lifecycle emissions and regulatory benchmark comparisons, together in one place."
    >
      {loading ? (
        <p className="account-loading" role="status">
          Loading your account…
        </p>
      ) : !signedIn ? (
        <Notice
          title="Sign in to see your results"
          body="Your saved scenarios are private to your account."
          to="/auth"
          cta="Sign in"
        />
      ) : !premium ? (
        <Notice
          title="Saved results are a premium feature"
          body="Premium members can save calculator scenarios and track them against the regulatory benchmarks over time."
          to="/"
          hash="footer-contact"
          cta="Request premium access"
        />
      ) : isLoading ? (
        <p className="account-loading" role="status">
          Loading your saved scenarios…
        </p>
      ) : isError ? (
        <section className="account-card account-empty" role="alert">
          <h2>Could not load your scenarios</h2>
          <p>Your saved results could not be retrieved. Please try again.</p>
          <button className="account-action" type="button" onClick={() => void refetch()}>
            Try again
          </button>
        </section>
      ) : list.length === 0 ? (
        <Notice
          title="No saved scenarios yet"
          body="Run a pathway in the carbon intensity calculator, then use “Save to my dashboard” to keep it here."
          to="/ci-calculator"
          cta="Open the calculator"
        />
      ) : (
        <>
          <section className="account-stats" aria-label="Scenario summary">
            {[
              ["Saved scenarios", String(list.length), TONE.blue],
              ["Lowest carbon intensity", best == null ? "—" : `${fmt(best)} gCO2e/MJ`, TONE.green],
              [
                "Average across scenarios",
                average == null ? "—" : `${fmt(average)} gCO2e/MJ`,
                TONE.blue,
              ],
            ].map(([label, value, color]) => (
              <div key={label} className="account-card account-stat">
                <p>{label}</p>
                <strong style={{ color }}>{value}</strong>
              </div>
            ))}
          </section>

          <div className="grid min-w-0 gap-4">
            {list.map((run) => (
              <RunCard
                key={run.id}
                run={run}
                deleting={remove.isPending}
                onDelete={() => remove.mutate(run.id)}
              />
            ))}
          </div>
        </>
      )}
      {remove.isError && (
        <p role="alert" className="account-error">
          Could not delete the scenario. Please try again.
        </p>
      )}
    </AccountLayout>
  );
}

function Notice({
  title,
  body,
  to,
  hash = "",
  cta,
}: {
  title: string;
  body: string;
  to: string;
  hash?: string;
  cta: string;
}) {
  return (
    <section className="account-card account-empty">
      <div className="account-icon">
        <LayoutDashboard size={26} />
      </div>
      <h2>{title}</h2>
      <p>{body}</p>
      <Link to={to} hash={hash} className="account-action">
        {cta}
        <ArrowRight size={16} />
      </Link>
      {to === "/ci-calculator" && (
        <div className="account-empty-steps">
          <span>
            <b>1</b>Model a pathway
          </span>
          <span>
            <b>2</b>Save to your dashboard
          </span>
          <span>
            <b>3</b>Compare your results
          </span>
        </div>
      )}
    </section>
  );
}

function RunCard({
  run,
  onDelete,
  deleting,
}: {
  run: SavedCiRun;
  onDelete: () => void;
  deleting: boolean;
}) {
  const programs = run.programs.filter((p) => p.benchmark != null);

  return (
    <section
      className="glass-panel min-w-0 border-l-4 p-5"
      style={{ borderLeftColor: run.ciTotal < 0 ? TONE.green : TONE.blue }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-extrabold text-foreground">{run.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {run.pathwayLabel}
            {run.feedstockLabel ? ` · ${run.feedstockLabel}` : ""}
            {run.regionLabel ? ` · ${run.regionLabel}` : ""} ·{" "}
            {new Date(run.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="label-mono text-muted-foreground">Carbon intensity</p>
            <p className="font-display text-3xl font-extrabold tabular-nums text-foreground">
              {fmt(run.ciTotal)}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">gCO2e/MJ</p>
          </div>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            aria-label={`Delete ${run.name}`}
            className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-ink hover:text-foreground"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
        {[
          ["Gross emissions", `${fmt(run.grossCi)} gCO2e/MJ`],
          ["Credits applied", `${fmt(run.creditsCi)} gCO2e/MJ`],
          ["Annual energy", `${fmt(run.annualEnergyMj / 1e6, 1)} TJ`],
          ["Annual footprint", `${fmt(run.annualTonnesCo2e, 0)} t CO2e`],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="label-mono text-muted-foreground">{k}</dt>
            <dd className="mt-0.5 font-display text-base font-extrabold tabular-nums text-foreground">
              {v}
            </dd>
          </div>
        ))}
      </dl>

      {programs.length ? (
        <div className="mt-4 min-w-0 max-w-full overflow-x-auto border-t border-border pt-3">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="label-mono text-muted-foreground">
                <th className="py-2 text-left font-semibold">Programme</th>
                <th className="py-2 text-right font-semibold">Benchmark</th>
                <th className="py-2 text-right font-semibold">My CI</th>
                <th className="py-2 text-right font-semibold">Saving</th>
                <th className="py-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => {
                const saving = savingPct(run, p);
                const below = (p.benchmark as number) > run.ciTotal;
                return (
                  <tr key={p.id} className="border-t border-border/60">
                    <td className="py-2 pr-3 font-semibold text-foreground">
                      {p.label}
                      <span className="ml-1 font-normal text-muted-foreground">
                        {p.jurisdiction}
                      </span>
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">
                      {fmt(p.benchmark as number)}
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums text-foreground">
                      {fmt(run.ciTotal)}
                    </td>
                    <td
                      className="py-2 text-right font-mono font-bold tabular-nums"
                      style={{ color: below ? TONE.green : TONE.red }}
                    >
                      {saving == null ? "—" : `${saving.toFixed(1)}%`}
                    </td>
                    <td
                      className="py-2 text-right text-xs font-bold"
                      style={{ color: below ? TONE.green : TONE.red }}
                    >
                      {below ? "Below benchmark" : "Above benchmark"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
