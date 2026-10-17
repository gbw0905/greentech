import { useEffect, useState } from "react";
import { UpdateCard } from "./UpdateCard";
import type { PolicyUpdate } from "@/features/policy/contracts";

const ROTATE_MS = 5200;

/**
 * Auto-rotating showcase of the latest updates: cycles one card at a time
 * with a fade/rise transition, progress rail and manual selection.
 * Pauses while hovered or focused.
 */
export function TopUpdatesTicker({ updates }: { updates: PolicyUpdate[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = updates.length;

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setInterval(() => setActive((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(t);
  }, [paused, count]);

  useEffect(() => {
    if (active >= count) setActive(0);
  }, [count, active]);

  if (count === 0) return null;
  const current = updates[active % count]!;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mb-2 flex items-center justify-end gap-1 font-mono text-[14px] tabular-nums text-muted-foreground">
        <span className="font-bold text-foreground">{String(active + 1).padStart(2, "0")}</span>
        <span aria-hidden>/</span>
        <span>{String(count).padStart(2, "0")}</span>
      </div>

      <div key={current.id} className="animate-[news-cycle_0.5s_ease-out_both]">
        <UpdateCard update={current} />
      </div>

      <div
        className="mt-auto flex items-center gap-1.5 pt-3"
        role="tablist"
        aria-label="Latest updates"
      >
        {updates.map((u, i) => (
          <button
            key={u.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Show update ${i + 1}: ${u.title}`}
            onClick={() => setActive(i)}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i === active ? "bg-accent" : "bg-border hover:bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
