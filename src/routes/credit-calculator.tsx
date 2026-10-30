import { HistoryPanel } from "@/features/calculation-history/HistoryPanel";
import { useCalculatorHistory } from "@/features/calculation-history/useCalculatorHistory";
import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CalculatorHeader } from "@/features/ci-workspace/CalculatorHeader";
import { ScenarioSaveDialog } from "@/features/ci-workspace/ScenarioSaveDialog";
import {
  FloatingCalculatorBar,
  type FloatingSummary,
} from "@/features/ci-workspace/FloatingCalculatorBar";
import { useFloatingBar } from "@/features/ci-workspace/useFloatingBar";
import { usePremium } from "@/features/premium/hooks/usePremium";
import { getPremiumStatusFn } from "@/features/premium/server-functions";
import "@/features/ci-workspace/workspace.css";
export const Route = createFileRoute("/credit-calculator")({
  head: () => ({ meta: [{ title: "Credit and RIN Calculator | Global Bioenergy Watch" }] }),
  component: CreditCalculatorPage,
});
function CreditCalculatorPage() {
  const access = usePremium();
  const search = useRouterState({ select: (state) => state.location.searchStr });
  const frame = useRef<HTMLIFrameElement>(null);
  const frameSizeObserver = useRef<ResizeObserver | null>(null);
  const history = useCalculatorHistory("credit", frame);
  const [showHistory, setShowHistory] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [suggestedName, setSuggestedName] = useState("Credit & RIN scenario");
  const [height, setHeight] = useState(800);
  const [summary, setSummary] = useState<FloatingSummary>({
    value: "—",
    unit: "",
    detail: "Select Run to calculate",
    state: "ready",
  });
  const floating = useFloatingBar(() => {
    const iframe = frame.current;
    const toolbar = iframe?.contentDocument?.querySelector(".toolbar");
    if (!iframe || !toolbar) return null;
    const frameBounds = iframe.getBoundingClientRect();
    return {
      anchorBottom: frameBounds.top + toolbar.getBoundingClientRect().bottom,
      endBottom: frameBounds.bottom,
    };
  });
  const showResult = () => {
    const iframe = frame.current;
    const result = iframe?.contentDocument?.getElementById("results");
    if (!iframe || !result) return;
    const chrome = document.querySelector(".site-chrome")?.getBoundingClientRect().bottom ?? 0;
    window.scrollTo({
      top:
        window.scrollY +
        iframe.getBoundingClientRect().top +
        result.getBoundingClientRect().top -
        chrome -
        92,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };
  useEffect(() => () => frameSizeObserver.current?.disconnect(), []);
  const syncFrameSize = () => {
    frameSizeObserver.current?.disconnect();
    const body = frame.current?.contentDocument?.body;
    if (!body) return;
    const content = body.querySelector<HTMLElement>("main.wrap");
    if (!content) return;
    const measure = () =>
      setHeight(Math.min(60000, Math.max(320, Math.ceil(content.getBoundingClientRect().bottom) + 8)));
    measure();
    frameSizeObserver.current = new ResizeObserver(measure);
    frameSizeObserver.current.observe(content);
  };
  useEffect(() => {
    if (!access.loading)
      frame.current?.contentWindow?.postMessage(
        { type: "civanta-plan-state", premium: access.premium },
        window.location.origin,
      );
  }, [access.loading, access.premium]);
  useEffect(() => {
    let mounted = true,
      exporting = false;
    const receive = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow)
        return;
      const message = event.data;
      if (!message || typeof message !== "object") return;
      if (message.type === "civanta-access-request" && !access.loading) {
        frame.current?.contentWindow?.postMessage(
          { type: "civanta-plan-state", premium: access.premium },
          window.location.origin,
        );
      } else if (message.type === "civanta-upgrade-request") {
        window.location.assign(access.signedIn ? "/pricing" : "/auth?next=%2Fpricing");
      } else if (message.type === "civanta-save-request" && message.kind === "credit") {
        setSuggestedName(
          typeof message.suggestedName === "string"
            ? message.suggestedName.slice(0, 100)
            : "Credit & RIN scenario",
        );
        setSaveOpen(true);
      } else if (message.type === "civanta-credit-height" && Number.isFinite(message.height))
        syncFrameSize();
      else if (message.type === "civanta-floating-summary" && message.kind === "credit") {
        if (Number.isFinite(message.height))
          syncFrameSize();
        const next = message.summary;
        if (
          next &&
          typeof next.value === "string" &&
          next.value.length < 80 &&
          typeof next.unit === "string" &&
          next.unit.length < 80 &&
          typeof next.detail === "string" &&
          next.detail.length < 240 &&
          ["ready", "current", "stale", "preview", "invalid", "running"].includes(next.state)
        )
          setSummary(next);
      }
      if (message.type === "civanta-credit-export" && !exporting) {
        if (!access.premium || access.loading) {
          frame.current?.contentWindow?.postMessage(
            {
              type: "civanta-credit-export-status",
              message: "CIVanta Pro is required to download reports.",
            },
            window.location.origin,
          );
          return;
        }
        exporting = true;
        let status = "Excel workbook downloaded.";
        try {
          const verified = await getPremiumStatusFn();
          if (!verified.premium) throw new Error("Pro access is required to download reports.");
          const { exportCreditWorkbook } =
            await import("@/features/ci-workspace/export-credit-workbook");
          await exportCreditWorkbook(message.payload);
        } catch (error) {
          status =
            error instanceof Error
              ? error.message
              : "Could not export. Check the inputs and try again.";
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
  }, [access.loading, access.premium, access.signedIn]);
  return (
    <main className="ci-workspace-page calculator-credit-page">
      <div className="ci-workspace-shell">
        <CalculatorHeader
          product="credit"
          historyOpen={showHistory}
          onHistory={() => setShowHistory((value) => !value)}
        />
        <FloatingCalculatorBar
          visible={floating}
          title="Credit & RIN"
          summary={summary}
          onSave={() =>
            frame.current?.contentWindow?.postMessage(
              { type: "civanta-floating-save-request" },
              window.location.origin,
            )
          }
          onRun={() => {
            showResult();
            frame.current?.contentWindow?.postMessage(
              { type: "civanta-floating-run-request" },
              window.location.origin,
            );
          }}
          busy={summary.state === "running"}
        />
        <ScenarioSaveDialog
          open={saveOpen}
          suggestedName={suggestedName}
          onClose={() => setSaveOpen(false)}
          onSave={(name) => {
            frame.current?.contentWindow?.postMessage(
              { type: "civanta-save-confirm", kind: "credit", name },
              window.location.origin,
            );
            setSaveOpen(false);
          }}
        />
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
          onLoad={() => {
            history.onFrameLoad();
            syncFrameSize();
            frame.current?.contentWindow?.postMessage(
              { type: "civanta-floating-sync-request" },
              window.location.origin,
            );
          }}
          src={`/tools/credit-calculator.html${search}`}
          title="Interactive Credit and RIN Calculator"
          className="ci-workspace-frame"
          style={{ height }}
        />
      </div>
    </main>
  );
}
