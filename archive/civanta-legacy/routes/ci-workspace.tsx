import { HistoryPanel } from "@/features/calculation-history/HistoryPanel";
import { useCalculatorHistory } from "@/features/calculation-history/useCalculatorHistory";
import { createFileRoute } from "@tanstack/react-router";
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
import { downloadTextFile } from "@/features/ci-workspace/download-text";
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
  const access = usePremium();
  const frame = useRef<HTMLIFrameElement>(null);
  const frameSizeObserver = useRef<ResizeObserver | null>(null);
  const history = useCalculatorHistory("ci", frame);
  const [showHistory, setShowHistory] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [suggestedName, setSuggestedName] = useState("CI scenario");
  const [height, setHeight] = useState(800);
  const [summary, setSummary] = useState<FloatingSummary>({
    value: "—",
    unit: "gCO₂e/MJ",
    detail: "Enter inputs to see a result",
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
    let mounted = true;
    let exporting = false;
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
      } else if (message.type === "civanta-save-request" && message.kind === "ci") {
        setSuggestedName(
          typeof message.suggestedName === "string"
            ? message.suggestedName.slice(0, 100)
            : "CI scenario",
        );
        setSaveOpen(true);
      } else if (message.type === "civanta-ci-height" && Number.isFinite(message.height)) {
        syncFrameSize();
      } else if (message.type === "civanta-floating-summary" && message.kind === "ci") {
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
      } else if (
        (message.type === "civanta-ci-export" || message.type === "civanta-ci-text-export") &&
        !exporting
      ) {
        if (!access.premium || access.loading) {
          frame.current?.contentWindow?.postMessage(
            {
              type: "civanta-ci-export-status",
              message: "CIVanta Pro is required to download reports.",
            },
            window.location.origin,
          );
          return;
        }
        exporting = true;
        let status = "Report downloaded.";
        try {
          const verified = await getPremiumStatusFn();
          if (!verified.premium) throw new Error("Pro access is required to download reports.");
          if (message.type === "civanta-ci-text-export") {
            const { name, content, mime } = message;
            if (
              typeof name !== "string" ||
              typeof content !== "string" ||
              typeof mime !== "string" ||
              content.length > 5_000_000
            )
              throw new Error("Invalid report data.");
            downloadTextFile(name, content, mime);
          } else {
            const { exportWorkspaceWorkbook } =
              await import("@/features/ci-workspace/export-workbook");
            await exportWorkspaceWorkbook(message.payload);
          }
        } catch (error) {
          if (import.meta.env.DEV)
            console.error(
              "CI workspace export failed",
              error instanceof Error ? error.message : String(error),
            );
          status =
            error instanceof Error
              ? error.message
              : "Could not export the report. Please try again.";
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
  }, [access.loading, access.premium, access.signedIn]);
  return (
    <main className="ci-workspace-page">
      <div className="ci-workspace-shell">
        <CalculatorHeader
          product="workspace"
          historyOpen={showHistory}
          onHistory={() => setShowHistory((value) => !value)}
        />
        <FloatingCalculatorBar
          visible={floating}
          title="CI Workspace"
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
              { type: "civanta-save-confirm", kind: "ci", name },
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
            kind="ci"
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
          src="/tools/ci-workspace.html"
          title="Interactive carbon intensity scenario workspace"
          className="ci-workspace-frame"
          style={{ height }}
        />
      </div>
    </main>
  );
}
