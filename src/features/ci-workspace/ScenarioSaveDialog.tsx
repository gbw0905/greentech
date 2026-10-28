import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function ScenarioSaveDialog({
  open,
  suggestedName,
  pending = false,
  onClose,
  onSave,
}: {
  open: boolean;
  suggestedName: string;
  pending?: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(suggestedName);
  const inputRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    setName(suggestedName);
    const previousFocus = document.activeElement as HTMLElement | null;
    const timer = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(timer);
      previousFocus?.focus();
    };
  }, [open, suggestedName]);
  useEffect(() => {
    if (!open) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("keydown", onEscape);
    };
  }, [open, pending, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="scenario-save-backdrop"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !pending) onClose();
          }}
        >
          <motion.form
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            className="scenario-save-dialog"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 340, damping: 29 }}
            onSubmit={(event) => {
              event.preventDefault();
              const clean = name.trim();
              if (clean && !pending) onSave(clean);
            }}
          >
            <h2 id={headingId}>Save scenario</h2>
            <label htmlFor={`${headingId}-name`}>Scenario name</label>
            <input
              ref={inputRef}
              id={`${headingId}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={100}
              required
              autoComplete="off"
              placeholder="Give this scenario a name"
            />
            <div className="scenario-save-actions">
              <button type="button" onClick={onClose} disabled={pending}>Cancel</button>
              <button type="submit" disabled={!name.trim() || pending}>
                {pending ? "Saving…" : "Save scenario"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
