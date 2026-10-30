import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Play, BookmarkPlus } from "lucide-react";

export type FloatingSummary = {
  value: string;
  unit: string;
  detail: string;
  state: "ready" | "current" | "stale" | "preview" | "invalid" | "running";
};

export function FloatingCalculatorBar({
  visible,
  title,
  summary,
  onSave,
  onRun,
  disabled = false,
  busy = false,
}: {
  visible: boolean;
  title: string;
  summary: FloatingSummary;
  onSave: () => void;
  onRun: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const status = {
    ready: "Awaiting inputs",
    current: "Saved",
    stale: "Run to update",
    preview: "Calculated",
    running: "Calculating…",
    invalid: "Check inputs",
  }[summary.state];

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          className="calculator-floating-bar"
          aria-label={`${title} quick result and action`}
          initial={reduceMotion ? false : { opacity: 0, y: -20, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={
            reduceMotion
              ? { opacity: 0, transition: { duration: 0 } }
              : { opacity: 0, y: -14, scale: 0.96 }
          }
          transition={
            reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 340, damping: 28 }
          }
        >
          <div className="calculator-floating-identity">
            <strong>{title}</strong>
            <span className={`calculator-floating-state is-${summary.state}`}>{status}</span>
          </div>
          <div className="calculator-floating-result" aria-live="polite" aria-atomic="true">
            <strong>{summary.value}</strong>
            <span>{summary.unit}</span>
            <small>{summary.detail}</small>
          </div>
          <div className="calculator-floating-actions">
            <button
              type="button"
              className="calculator-floating-save"
              onClick={onSave}
              disabled={disabled || busy || !["current", "preview"].includes(summary.state)}
            >
              <BookmarkPlus size={15} aria-hidden="true" /> Save scenario
            </button>
            <button
              type="button"
              className="calculator-floating-run"
              onClick={onRun}
              disabled={busy}
            >
              <Play size={15} aria-hidden="true" /> {busy ? "Running…" : "Run"}
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
