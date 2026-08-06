import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Activity, CheckCircle2 } from "lucide-react";
import { REGION_ACCENT, flagFor } from "@/lib/policy-taxonomy";
import type { PolicyUpdate } from "@/lib/policy-types";

type LogEntry = {
  id: string;
  at: string;
  kind: "scan" | "new";
  text: string;
  accent?: string;
  flag?: string;
};

const time = () =>
  new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/**
 * Live monitoring agent: watches the policy feed and reports every new item
 * the moment it lands, plus each scan cycle it observes.
 */
export function WatchAgent({
  updates,
  fetchedAt,
  busy,
}: {
  updates: PolicyUpdate[];
  fetchedAt: string | null;
  busy: boolean;
}) {
  const seen = useRef<Set<string> | null>(null);
  const lastCycle = useRef<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (updates.length === 0) return;
    if (seen.current === null) {
      seen.current = new Set(updates.map((u) => u.id));
      setLog([
        {
          id: `boot-${Date.now()}`,
          at: time(),
          kind: "scan",
          text: `Agent online — watching ${updates.length} tracked items across all jurisdictions.`,
        },
      ]);
      return;
    }
    const fresh = updates.filter((u) => !seen.current!.has(u.id));
    if (fresh.length === 0) return;
    for (const u of fresh) seen.current.add(u.id);
    setLog((prev) =>
      [
        ...fresh.slice(0, 6).map((u) => ({
          id: `new-${u.id}`,
          at: time(),
          kind: "new" as const,
          text: u.title,
          accent: REGION_ACCENT[u.region],
          flag: flagFor(u.countrySlug),
        })),
        ...prev,
      ].slice(0, 24),
    );
  }, [updates]);

  useEffect(() => {
    if (!fetchedAt || fetchedAt === lastCycle.current) return;
    const first = lastCycle.current === null;
    lastCycle.current = fetchedAt;
    if (first) return;
    setLog((prev) =>
      [
        {
          id: `scan-${fetchedAt}`,
          at: time(),
          kind: "scan" as const,
          text: "Scan cycle complete — global sources re-checked.",
        },
        ...prev,
      ].slice(0, 24),
    );
  }, [fetchedAt]);

  const watched = useMemo(
    () => new Set(updates.map((u) => u.countrySlug).filter(Boolean)).size,
    [updates],
  );

  return (
    <section className="glass-panel rise overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl surface-gradient-primary text-primary-foreground shadow-[var(--shadow-frost)]">
            <Bot className="size-5" />
          </span>
          <div>
            <h2 className="font-display font-semibold">Bioenergy Watch Agent</h2>
            <p className="label-mono text-muted-foreground">
              Real-time monitoring · {watched} jurisdictions in view
            </p>
          </div>
        </div>
        <span className="label-mono inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/70 px-3 py-1.5">
          <span className="pulse-dot size-1.5 rounded-full bg-primary" />
          {busy ? "Scanning…" : "Monitoring"}
        </span>
      </div>

      <ul className="max-h-72 space-y-2 overflow-y-auto p-4">
        {log.length === 0 && (
          <li className="label-mono text-muted-foreground">Agent initialising…</li>
        )}
        {log.map((e) => (
          <li key={e.id} className="flex items-start gap-3 rounded-[var(--radius)] bg-surface-2/50 p-3">
            <span className="mt-0.5 shrink-0">
              {e.kind === "new" ? (
                <Activity className="size-4" style={{ color: e.accent ?? "var(--primary)" }} />
              ) : (
                <CheckCircle2 className="size-4 text-muted-foreground" />
              )}
            </span>
            <div className="min-w-0">
              <div className="label-mono text-muted-foreground">
                {e.at}
                {e.kind === "new" && " · new update"}
              </div>
              <p className="mt-0.5 truncate text-sm">
                {e.flag && <span className="mr-1.5">{e.flag}</span>}
                {e.text}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
