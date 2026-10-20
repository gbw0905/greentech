import { Link, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Download, History, Play, RotateCcw, Target } from "lucide-react";
import { z } from "zod";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { HistoryPanel } from "@/features/calculation-history/HistoryPanel";
import {
  saveCalculationRunFn,
  getCalculationRunFn,
} from "@/features/calculation-history/server-functions";
import type { HistoryInput } from "@/features/calculation-history/contracts";
import { OptimizerInputs } from "./OptimizerInputs";
import { OptimizerResults } from "./OptimizerResults";
import { analyze, defaultInputs, pathwayFor, type Inputs, type MeasureId } from "./engine";
import "@/features/ci-workspace/workspace.css";
import "./optimizer.css";

const DRAFT_KEY = "gbw:civanta:optimizer:draft:v1";
const numericKeys = [
  "target",
  "benchmark",
  "ng",
  "kwh",
  "gridCi",
  "km",
  "feedstockAdj",
  "volumeMj",
  "creditPrice",
  "ngPrice",
  "ppaPremium",
  "discountRate",
  "lifeYears",
  "heatPct",
  "tuningPct",
] as const;
const draftNumber = z
  .number()
  .finite()
  .nullable()
  .transform((value) => (value === null ? NaN : value));
const stateSchema = z.object({
  ...Object.fromEntries(numericKeys.map((key) => [key, draftNumber])),
  pathwayId: z.string().refine((id) => {
    try {
      pathwayFor(id);
      return true;
    } catch {
      return false;
    }
  }),
  costs: z.object(
    Object.fromEntries(
      (["ppa", "rail", "heat", "tuning"] as const).map((id) => [
        id,
        z.object({ capex: draftNumber, opex: draftNumber }),
      ]),
    ),
  ),
});
const snapshotSchema = z.object({
  version: z.literal(1),
  state: stateSchema,
  selected: z.array(z.enum(["ppa", "rail", "heat", "tuning"])).max(4),
});
function parseSnapshot(value: unknown) {
  const result = snapshotSchema.parse(value);
  return { input: result.state as Inputs, selected: [...new Set(result.selected)] };
}
export function OptimizerPage() {
  const { user } = useAuthSession();
  const client = useQueryClient();
  const search = useRouterState({ select: (state) => state.location.searchStr });
  const requestedId = new URLSearchParams(search).get("run");
  const [input, setInput] = useState<Inputs>(() => defaultInputs());
  const [selected, setSelected] = useState<MeasureId[]>(["ppa", "rail"]);
  const [draftReady, setDraftReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [restoreId, setRestoreId] = useState<string | null>(requestedId);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState<HistoryInput | null>(null);
  const [exporting, setExporting] = useState(false);
  const [lastRun, setLastRun] = useState("");
  const preview = useMemo(() => {
    try {
      return { data: analyze(input, selected), error: "" };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : "Check your inputs." };
    }
  }, [input, selected]);
  const snapshot = JSON.stringify({ version: 1, state: input, selected });
  const save = useMutation({
    mutationFn: (data: HistoryInput) => saveCalculationRunFn({ data }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["calculation-history", user?.id] }),
  });
  const restore = useQuery({
    queryKey: ["calculation-run", user?.id, restoreId],
    queryFn: () => getCalculationRunFn({ data: { id: restoreId! } }),
    enabled: Boolean(user && restoreId),
    retry: false,
  });
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const parsed = parseSnapshot(JSON.parse(stored));
        setInput(parsed.input);
        setSelected(parsed.selected);
      }
    } catch {
      setDraftStatus("The previous browser draft could not be restored.");
    } finally {
      setDraftReady(true);
    }
  }, []);
  useEffect(() => {
    if (!draftReady) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, snapshot);
        setDraftStatus("Inputs saved in this browser");
      } catch {
        setDraftStatus(
          "Browser storage is unavailable; keep this page open to retain your inputs.",
        );
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [snapshot, draftReady]);
  useEffect(() => {
    setRestoreId(requestedId);
  }, [requestedId]);
  useEffect(() => {
    if (!restore.data) return;
    try {
      if (restore.data.kind !== "optimizer") throw new Error();
      const parsed = parseSnapshot(JSON.parse(restore.data.snapshot));
      setInput(parsed.input);
      setSelected(parsed.selected);
      setLastRun(restore.data.snapshot);
      setStatus("Saved optimizer run restored.");
    } catch {
      setStatus("This saved run could not be restored in the optimizer.");
    }
  }, [restore.data]);
  useEffect(() => {
    setStatus("");
    setFailed(null);
  }, [user?.id]);
  async function saveRun(payload: HistoryInput) {
    setStatus("Saving this run to your account…");
    try {
      await save.mutateAsync(payload);
      setFailed(null);
      setStatus("Optimizer run saved to your account.");
    } catch {
      setFailed(payload);
      setStatus("Run complete, but account history could not be saved. Retry save below.");
    }
  }
  async function run() {
    if (!preview.data) return;
    setLastRun(snapshot);
    if (!user) {
      setStatus("Optimization complete. Sign in to save runs to your account.");
      return;
    }
    const result = preview.data.focus;
    await saveRun({
      kind: "optimizer",
      name: `${pathwayFor(input.pathwayId).label.slice(0, 85)} — optimizer`,
      pathway: pathwayFor(input.pathwayId).label,
      snapshot,
      metrics: { ci: result.ci, lcfs: null, rins: null, value: result.netBenefit },
    });
  }
  async function download(format: "excel" | "csv") {
    if (!preview.data) return;
    setExporting(true);
    try {
      const { exportOptimizerReport } = await import("./export-report");
      await exportOptimizerReport(input, preview.data, format);
      setStatus(`${format === "excel" ? "Excel" : "CSV"} report downloaded.`);
    } catch {
      setStatus("The report could not be exported. Please try again.");
    } finally {
      setExporting(false);
    }
  }
  return (
    <main className="ci-workspace-page optimizer-page">
      <div className="ci-workspace-shell">
        <header className="calculator-header">
          <div className="ci-workspace-heading">
            <Link to="/civanta" className="calculator-back">
              ← CIVanta
            </Link>
            <h1>
              CIVanta <span>Optimizer</span>
            </h1>
            <p>Set your CI target. Compare measures. Find the least-cost plan.</p>
          </div>
          <nav className="calculator-subnav" aria-label="Calculator navigation">
            <Link to="/ci-workspace">CI Workspace ↗</Link>
            <Link to="/credit-calculator">Credit & RIN ↗</Link>
            <button
              type="button"
              aria-expanded={showHistory}
              onClick={() => setShowHistory(!showHistory)}
            >
              <History size={14} /> Calculation history
            </button>
          </nav>
        </header>
        <div className="opt-toolbar">
          <div>
            <button
              className="opt-primary"
              type="button"
              disabled={!preview.data || save.isPending}
              onClick={() => void run()}
            >
              <Play size={14} />
              {save.isPending ? "Saving…" : "Run optimizer"}
            </button>
            <button
              type="button"
              onClick={() => {
                setInput(defaultInputs(input.pathwayId));
                setSelected(["ppa", "rail"]);
                setLastRun("");
                setStatus("");
              }}
            >
              <RotateCcw size={14} />
              Reset defaults
            </button>
          </div>
          <div>
            <span className="opt-draft-status">{draftStatus}</span>
            <button
              type="button"
              disabled={!preview.data || exporting}
              onClick={() => void download("excel")}
            >
              <Download size={14} />
              {exporting ? "Exporting…" : "Download Excel"}
            </button>
            <button
              type="button"
              disabled={!preview.data || exporting}
              onClick={() => void download("csv")}
            >
              Export CSV
            </button>
            <button type="button" onClick={() => window.print()}>
              Print / PDF
            </button>
          </div>
        </div>
        {(status || restore.isError) && (
          <div className="calculator-sync-status" role="status">
            {restore.isError ? "Could not load the saved run from your account." : status}
            {failed && (
              <button type="button" disabled={save.isPending} onClick={() => void saveRun(failed)}>
                Retry save
              </button>
            )}
          </div>
        )}
        {showHistory && (
          <HistoryPanel
            kind="optimizer"
            onRestore={(id) => {
              setRestoreId(id);
              setShowHistory(false);
            }}
          />
        )}
        <div className="opt-workspace">
          <OptimizerInputs
            input={input}
            selected={selected}
            onChange={setInput}
            onSelected={setSelected}
            onPathway={(id) =>
              setInput({
                ...defaultInputs(id),
                costs: input.costs,
                creditPrice: input.creditPrice,
                volumeMj: input.volumeMj,
              })
            }
          />
          <div className="opt-output">
            <div className="opt-live-label">
              <span>
                <i />
                {lastRun === snapshot ? "Calculated run" : "Live scenario preview"}
              </span>
              <small>
                {lastRun === snapshot
                  ? "Inputs match your last run"
                  : "Run optimizer to save this scenario to your account"}
              </small>
            </div>
            {preview.data ? (
              <OptimizerResults input={input} analysis={preview.data} />
            ) : (
              <section className="opt-invalid" role="alert">
                <Target size={28} />
                <h2>Check your inputs</h2>
                <p>{preview.error}</p>
                <p>Your results will appear here once the inputs are valid.</p>
              </section>
            )}
          </div>
        </div>
        <p className="opt-footnote">
          Screening estimate · Default factors and costs are illustrative. Confirm project data,
          fuel eligibility and program rules before making an investment decision. See Evidence for
          model details.
        </p>
      </div>
    </main>
  );
}
