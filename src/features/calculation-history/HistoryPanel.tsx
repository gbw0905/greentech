import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Clock3,
  ArrowUpRight,
  FileSpreadsheet,
  LockKeyhole,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { usePremium } from "@/features/premium/hooks/usePremium";
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
  const access = usePremium();
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState("");
  const query = useQuery({
    queryKey: ["calculation-history", user?.id, filter, page],
    queryFn: () =>
      listCalculationRunsFn({ data: { page, kind: filter === "all" ? undefined : filter } }),
    enabled: Boolean(user),
  });
  const allRuns = query.data?.runs ?? [];
  const runs = preview ? allRuns.slice(0, 5) : allRuns;
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 15));
  async function download(id: string) {
    setExporting(id);
    setExportError("");
    try {
      const { exportSavedRun } = await import("./export-saved-run");
      await exportSavedRun(id);
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "Could not download this report. Please try again.",
      );
    } finally {
      setExporting(null);
    }
  }
  return (
    <section className="history-panel" aria-label="Calculation history">
      <div className="history-heading">
        {!kind && (
          <div className="history-filters" aria-label="Filter history">
            {(["all", "ci", "credit", "optimizer"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={value === filter}
                onClick={() => {
                  setFilter(value);
                  setPage(0);
                }}
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
      {exportError && (
        <p role="alert" className="history-export-error">
          {exportError}
        </p>
      )}
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
          <h3>No saved scenarios yet.</h3>
          <p>Choose Save scenario in any CIVanta tool to add one here.</p>
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
              <div className="history-run-actions">
                {!access.premium ? (
                  <>
                    <button
                      type="button"
                      className="history-open"
                      disabled
                      title="CIVanta Pro required"
                    >
                      <LockKeyhole size={15} /> Open run
                    </button>
                    <button
                      type="button"
                      className="history-open"
                      disabled
                      title="CIVanta Pro required"
                    >
                      <LockKeyhole size={15} /> Download Excel
                    </button>
                  </>
                ) : (
                  <>
                    {onRestore ? (
                      <button
                        type="button"
                        className="history-open"
                        onClick={() => onRestore(run.id)}
                      >
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
                    <button
                      type="button"
                      className="history-open"
                      disabled={exporting !== null}
                      onClick={() => void download(run.id)}
                    >
                      <FileSpreadsheet size={16} />
                      {exporting === run.id ? "Downloading…" : "Download Excel"}
                    </button>
                  </>
                )}
              </div>
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
      {!preview && user && (page > 0 || (query.data?.total ?? 0) > 15) && (
        <nav className="history-pagination" aria-label="History pages">
          <button
            type="button"
            disabled={page === 0 || query.isFetching}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={17} /> Previous
          </button>
          <span role="status">
            Page {page + 1}
            {query.data ? ` of ${totalPages}` : ""}
          </span>
          <button
            type="button"
            disabled={query.isFetching || !query.data || page + 1 >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next <ChevronRight size={17} />
          </button>
        </nav>
      )}
    </section>
  );
}
