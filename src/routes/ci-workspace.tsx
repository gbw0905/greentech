import { Link } from "@tanstack/react-router";
import { HistoryPanel } from "@/features/calculation-history/HistoryPanel";
import { useCalculatorHistory } from "@/features/calculation-history/useCalculatorHistory";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import "@/features/ci-workspace/workspace.css";

export const Route = createFileRoute("/ci-workspace")({
  head: () => ({
    meta: [
      { title: "CI Scenario Workspace | Global Bioenergy Watch" },
      {
        name: "description",
        content:
          "Build fuel lifecycle scenarios, compare a baseline, review contribution charts and export your calculation ledger.",
      },
    ],
  }),
  component: CiWorkspacePage,
});

function CiWorkspacePage() {
  const frame = useRef<HTMLIFrameElement>(null);
  const history = useCalculatorHistory("ci", frame);
  const [showHistory, setShowHistory] = useState(false);
  const [height, setHeight] = useState(1600);
  useEffect(() => {
    let mounted = true;
    let exporting = false;
    const receive = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow)
        return;
      const message = event.data;
      if (!message || typeof message !== "object") return;
      if (message.type === "civanta-ci-height" && Number.isFinite(message.height)) {
        setHeight(Math.min(60000, Math.max(800, Math.ceil(message.height) + 8)));
      } else if (message.type === "civanta-ci-export" && !exporting) {
        exporting = true;
        let status = "Excel workbook downloaded.";
        try {
          const { exportWorkspaceWorkbook } =
            await import("@/features/ci-workspace/export-workbook");
          await exportWorkspaceWorkbook(message.payload);
        } catch (error) {
          if (import.meta.env.DEV)
            console.error(
              "CI workspace export failed",
              error instanceof Error ? error.message : String(error),
            );
          status = "Could not export the workbook. Run a valid scenario and try again.";
        } finally {
          exporting = false;
          if (mounted)
            frame.current?.contentWindow?.postMessage(
              { type: "civanta-ci-export-status", message: status },
              window.location.origin,
            );
        }
      }
    };
    window.addEventListener("message", receive);
    return () => {
      mounted = false;
      window.removeEventListener("message", receive);
    };
  }, []);
  return (
    <main className="ci-workspace-page">
      <div className="ci-workspace-shell">
        <header className="calculator-header">
          <div className="ci-workspace-heading">
            <Link to="/civanta" className="calculator-back">
              ← CIVanta
            </Link>
            <h1>
              CI Scenario <span>Workspace</span>
            </h1>
            <p>Choose a pathway, enter your inputs and run your carbon intensity scenario.</p>
          </div>
          <nav className="calculator-subnav" aria-label="Calculator navigation">
            <Link to="/credit-calculator">Credit & RIN Calculator ↗</Link>
            <button
              type="button"
              aria-expanded={showHistory}
              onClick={() => setShowHistory((value) => !value)}
            >
              Calculation history
            </button>
            <small>Successful calculations save to your account.</small>
          </nav>
        </header>
        {history.status && (
          <div role="status" className="calculator-sync-status">
            {history.status}
            {history.failed && (
              <button type="button" disabled={history.pending} onClick={() => void history.retry()}>
                Retry save
              </button>
            )}
          </div>
        )}
        {showHistory && (
          <HistoryPanel
            kind="ci"
            onRestore={(id) => {
              history.restore(id);
              setShowHistory(false);
            }}
          />
        )}
        <iframe
          ref={frame}
          onLoad={history.onFrameLoad}
          src="/tools/ci-workspace.html"
          title="Interactive carbon intensity scenario workspace"
          className="ci-workspace-frame"
          style={{ height }}
        />
      </div>
    </main>
  );
}
