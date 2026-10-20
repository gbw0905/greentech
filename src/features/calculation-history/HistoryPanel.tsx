import { Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Clock3, ArrowUpRight } from "lucide-react";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { listCalculationRunsFn } from "./server-functions";
import "./history.css";
export function HistoryPanel({
  kind,
  onRestore,
  preview = false,
}: {
  preview?: boolean;
  kind?: "ci" | "credit" | "optimizer";
  onRestore?: (id: string) => void;
}) {
  const { user, loading } = useAuthSession();
  const [filter, setFilter] = useState<"all" | "ci" | "credit" | "optimizer">(kind ?? "all");
  const query = useInfiniteQuery({
    queryKey: ["calculation-history", user?.id, filter],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      listCalculationRunsFn({
        data: { before: pageParam, kind: filter === "all" ? undefined : filter },
      }),
    getNextPageParam: (last) => last.next ?? undefined,
    enabled: Boolean(user),
  });
  const allRuns = query.data?.pages.flatMap((page) => page.runs) ?? [];
  const runs = preview ? allRuns.slice(0, 5) : allRuns;
  return (
    <section className="history-panel" aria-label="Calculation history">
      <div className="history-heading">
        <div>
          <span className="history-eyebrow">
            <Clock3 size={14} /> Calculation history
          </span>
          <h2>Your previous calculations</h2>
          <p>
            Saved to your account after each successful calculation. Open a run to restore its
            inputs.
          </p>
        </div>
        {!kind && (
          <div className="history-filters" aria-label="Filter history">
            {(["all", "ci", "credit", "optimizer"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={value === filter}
                onClick={() => setFilter(value)}
              >
                {value === "all"
                  ? "All runs"
                  : value === "ci"
                    ? "CI Workspace"
                    : value === "optimizer"
                      ? "Optimizer"
                      : "Credit & RIN"}
              </button>
            ))}
          </div>
        )}
      </div>
      {loading || (user && query.isLoading) ? (
        <p role="status">Loading your history…</p>
      ) : !user ? (
        <div className="history-empty">
          <Clock3 size={28} />
          <h3>Keep your work with you.</h3>
          <p>Sign in to save calculations to your account and access them on any device.</p>
          <Link to="/auth" className="account-action">
            Sign In
          </Link>
        </div>
      ) : query.isError ? (
        <div role="alert" className="history-empty">
          <p>Could not load your history.</p>
          <button type="button" onClick={() => void query.refetch()}>
            Try again
          </button>
        </div>
      ) : !runs.length ? (
        <div className="history-empty">
          <Clock3 size={28} />
          <h3>Your next calculation starts your history.</h3>
          <p>
            Run a CI scenario, calculate Credit & RIN, or run the Optimizer. Each successful run is
            saved automatically.
          </p>
        </div>
      ) : (
        <div className="history-list">
          {runs.map((run) => (
            <article key={run.id} className="history-run">
              <div>
                <span className="history-kind">
                  {run.kind === "ci"
                    ? "CI Workspace"
                    : run.kind === "optimizer"
                      ? "Optimizer"
                      : "Credit & RIN"}
                </span>
                <h3>{run.name}</h3>
                <p>
                  {run.pathway} ·{" "}
                  {new Date(run.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="history-metric">
                {run.kind !== "credit" ? (
                  <>
                    <strong>
                      {run.metrics.ci?.toLocaleString("en-US", { maximumFractionDigits: 3 }) ?? "—"}
                    </strong>
                    <span>gCO₂e/MJ</span>
                  </>
                ) : (
                  <>
                    <strong>
                      {run.metrics.rins?.toLocaleString("en-US", { maximumFractionDigits: 0 }) ??
                        "—"}
                    </strong>
                    <span>
                      RINs ·{" "}
                      {run.metrics.lcfs?.toLocaleString("en-US", { maximumFractionDigits: 2 }) ??
                        "—"}{" "}
                      LCFS tonnes
                    </span>
                  </>
                )}
              </div>
              {onRestore ? (
                <button type="button" className="history-open" onClick={() => onRestore(run.id)}>
                  Restore run
                  <ArrowUpRight size={16} />
                </button>
              ) : (
                <Link
                  className="history-open"
                  to={
                    run.kind === "ci"
                      ? "/ci-workspace"
                      : run.kind === "optimizer"
                        ? "/civanta/optimizer"
                        : "/credit-calculator"
                  }
                  search={{ run: run.id }}
                >
                  Open run
                  <ArrowUpRight size={16} />
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
      {user && preview && (
        <Link to="/calculation-history" className="history-open">
          View all calculation history
          <ArrowUpRight size={16} />
        </Link>
      )}
      {!preview && query.hasNextPage && (
        <button
          className="history-open"
          type="button"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? "Loading…" : "Load older calculations"}
        </button>
      )}
    </section>
  );
}
