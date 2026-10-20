import { Link } from "@tanstack/react-router";
import { HistoryPanel } from "@/features/calculation-history/HistoryPanel";
import { useCalculatorHistory } from "@/features/calculation-history/useCalculatorHistory";
import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import "@/features/ci-workspace/workspace.css";
export const Route = createFileRoute("/credit-calculator")({
  head: () => ({ meta: [{ title: "Credit and RIN Calculator | Global Bioenergy Watch" }] }),
  component: CreditCalculatorPage,
});
function CreditCalculatorPage() {
  const search = useRouterState({ select: (state) => state.location.searchStr });
  const frame = useRef<HTMLIFrameElement>(null);
  const history = useCalculatorHistory("credit", frame);
  const [showHistory, setShowHistory] = useState(false);
  const [height, setHeight] = useState(1800);
  useEffect(() => {
    let mounted = true,
      exporting = false;
    const receive = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow)
        return;
      const message = event.data;
      if (!message || typeof message !== "object") return;
      if (message.type === "civanta-credit-height" && Number.isFinite(message.height))
        setHeight(Math.max(800, Math.min(60000, Math.ceil(message.height) + 8)));
      if (message.type === "civanta-credit-export" && !exporting) {
        exporting = true;
        let status = "Excel workbook downloaded.";
        try {
          const { exportCreditWorkbook } =
            await import("@/features/ci-workspace/export-credit-workbook");
          await exportCreditWorkbook(message.payload);
        } catch {
          status = "Could not export. Check the inputs and try again.";
        } finally {
          exporting = false;
          if (mounted)
            frame.current?.contentWindow?.postMessage(
              { type: "civanta-credit-export-status", message: status },
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
              Credit and <span>RIN Calculator</span>
            </h1>
            <p>Enter fuel quantity and pathway CI to estimate LCFS credits and RFS RINs.</p>
          </div>
          <nav className="calculator-subnav" aria-label="Calculator navigation">
            <Link to="/ci-workspace">CI Workspace ↗</Link>
            <Link to="/civanta/optimizer">Optimizer ↗</Link>
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
            kind="credit"
            onRestore={(id) => {
              history.restore(id);
              setShowHistory(false);
            }}
          />
        )}
        <iframe
          ref={frame}
          onLoad={history.onFrameLoad}
          src={`/tools/credit-calculator.html${search}`}
          title="Interactive Credit and RIN Calculator"
          className="ci-workspace-frame"
          style={{ height }}
        />
      </div>
    </main>
  );
}
