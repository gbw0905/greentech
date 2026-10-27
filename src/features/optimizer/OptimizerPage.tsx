import { useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Target } from "lucide-react";
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
import { CalculatorHeader } from "@/features/ci-workspace/CalculatorHeader";
import { ScenarioSaveDialog } from "@/features/ci-workspace/ScenarioSaveDialog";
import { FloatingCalculatorBar } from "@/features/ci-workspace/FloatingCalculatorBar";
import { useFloatingBar } from "@/features/ci-workspace/useFloatingBar";
import { usePremium } from "@/features/premium/hooks/usePremium";
import { getPremiumStatusFn } from "@/features/premium/server-functions";
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
  const access = usePremium();
  const { user } = useAuthSession();
  const client = useQueryClient();
  const search = useRouterState({ select: (state) => state.location.searchStr });
  const requestedId = new URLSearchParams(search).get("run");
  const [input, setInput] = useState<Inputs>(() => defaultInputs());
  const [selected, setSelected] = useState<MeasureId[]>(["ppa", "rail"]);
  const [draftReady, setDraftReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [restoreId, setRestoreId] = useState<string | null>(requestedId);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState<HistoryInput | null>(null);
  const [exporting, setExporting] = useState(false);
  const [lastRun, setLastRun] = useState("");
  const toolbarRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const floating = useFloatingBar(() => {
    const toolbar = toolbarRef.current;
    const workspace = workspaceRef.current;
    if (!toolbar || !workspace) return null;
    return {
      anchorBottom: toolbar.getBoundingClientRect().bottom,
      endBottom: workspace.getBoundingClientRect().bottom,
    };
  });
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
        setDraftStatus("");
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
    const closeHistoryOnBack = () => setShowHistory(false);
    window.addEventListener("popstate", closeHistoryOnBack);
    return () => window.removeEventListener("popstate", closeHistoryOnBack);
  }, []);
  function toggleHistory() {
    if (showHistory) {
      if (window.history.state?.civantaHistory === "optimizer") window.history.back();
      else setShowHistory(false);
    } else {
      window.history.pushState(
        { ...window.history.state, civantaHistory: "optimizer" },
        "",
        window.location.href,
      );
      setShowHistory(true);
    }
  }
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
    setStatus("Saving this scenario to your account…");
    try {
      await save.mutateAsync(payload);
      setLastRun(payload.snapshot);
      setFailed(null);
      setStatus("Scenario saved to your account.");
    } catch {
      setFailed(payload);
      setStatus("Scenario could not be saved to your account. Retry below.");
    }
  }
  async function saveScenario(name: string) {
    if (!preview.data) return;
    if (!user) {
      setStatus(
        "Sign in to save this scenario to your account. Your inputs remain in this browser.",
      );
      return;
    }
    const result = preview.data.focus;
    await saveRun({
      kind: "optimizer",
      name,
      pathway: pathwayFor(input.pathwayId).label,
      snapshot,
      metrics: { ci: result.ci, lcfs: null, rins: null, value: result.netBenefit },
    });
  }
  async function download(format: "excel" | "csv") {
    if (!preview.data || !access.premium) return;
    setExporting(true);
    try {
      const verified = await getPremiumStatusFn();
      if (!verified.premium) throw new Error("Pro access is required to download reports.");
      const { exportOptimizerReport } = await import("./export-report");
      await exportOptimizerReport(input, preview.data, format);
      setStatus(`${format === "excel" ? "Excel" : "CSV"} report downloaded.`);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "The report could not be exported. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  }
  return (
    <main className="ci-workspace-page optimizer-page">
      <div className="ci-workspace-shell">
        <CalculatorHeader product="optimizer" historyOpen={showHistory} onHistory={toggleHistory} />
        <FloatingCalculatorBar
          visible={floating}
          title="Optimizer"
          summary={
            preview.data
              ? {
                  value: preview.data.focus.ci.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  }),
                  unit: "gCO₂e/MJ",
                  detail: `Target ${input.target.toLocaleString("en-US", { maximumFractionDigits: 2 })} gCO₂e/MJ`,
                  state: lastRun === snapshot ? "current" : "preview",
                }
              : {
                  value: "—",
                  unit: "gCO₂e/MJ",
                  detail: preview.error,
                  state: "invalid",
                }
          }
          runLabel="Save scenario"
          onRun={() => preview.data && setSaveOpen(true)}
          onDetails={() =>
            resultRef.current?.scrollIntoView({
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth",
              block: "start",
            })
          }
          disabled={!preview.data}
          busy={save.isPending}
        />
        <ScenarioSaveDialog
          open={saveOpen}
          suggestedName={`${pathwayFor(input.pathwayId).label.slice(0, 85)} — optimizer`}
          pending={save.isPending}
          onClose={() => setSaveOpen(false)}
          onSave={(name) => {
            setSaveOpen(false);
            void saveScenario(name);
          }}
        />
        <div className="opt-toolbar" ref={toolbarRef}>
          <div>
            <button
              className="opt-primary"
              type="button"
              disabled={!preview.data || save.isPending}
              onClick={() => setSaveOpen(true)}
            >
              {save.isPending ? "Saving…" : "Save scenario"}
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
              Load example
            </button>
          </div>
          <div>
            {draftStatus && <span className="opt-draft-status">{draftStatus}</span>}
            {access.premium ? (
              <button
                type="button"
                disabled={!preview.data || exporting}
                onClick={() => void download("excel")}
              >
                {exporting ? "Exporting…" : "Download Excel"}
              </button>
            ) : (
              <a
                className="opt-report-upgrade"
                href={access.signedIn ? "/pricing" : "/auth?next=%2Fpricing"}
              >
                Pro · Download Excel
              </a>
            )}
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
          <div>
            <button type="button" className="optimizer-history-back" onClick={toggleHistory}>
              ← Back to Optimizer
            </button>
            <HistoryPanel
              kind="optimizer"
              onRestore={(id) => {
                setRestoreId(id);
                toggleHistory();
              }}
            />
          </div>
        )}
        <div className="opt-workspace" ref={workspaceRef}>
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
          <div className="opt-output" ref={resultRef}>
            {preview.data ? (
              <OptimizerResults input={input} analysis={preview.data} premium={access.premium} />
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
      </div>
    </main>
  );
}
