import { useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Loader2, Mail, RefreshCw, Sparkles } from "lucide-react";
import { emailChartSummaryFn, summariseChartFn } from "@/lib/chart-summary.functions";
import type { SummaryRow } from "@/lib/chart-summary.server";

export type ChartSummaryPayload = {
  panel: string;
  measureLabel: string;
  unit: string;
  filterLabel: string;
  shown: number;
  total: number;
  rows: SummaryRow[];
};

/** AI summary assistant shown under every heat map. */
export function ChartSummaryAssistant({
  build,
  disabled,
}: {
  build: () => ChartSummaryPayload;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [context, setContext] = useState<ChartSummaryPayload | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState("");

  async function run() {
    if (loading) return;
    const payload = build();
    setOpen(true);
    setLoading(true);
    setError("");
    setSent("");
    setSummary("");
    setContext(payload);
    try {
      const res = await summariseChartFn({ data: payload });
      setSummary(res.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate the summary.");
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    if (!context || sending) return;
    setSending(true);
    setSent("");
    setError("");
    try {
      const res = await emailChartSummaryFn({
        data: {
          email,
          panel: context.panel,
          measureLabel: context.measureLabel,
          filterLabel: context.filterLabel,
          summary,
        },
      });
      setSent(
        res.sent
          ? `Sent to ${email}. Check your inbox.`
          : "That address is unsubscribed from our emails.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
          type="button"
          onClick={run}
          disabled={disabled || loading}
          title="Write a full analyst summary of the rows and measure currently shown"
          className="inline-flex items-center gap-1.5 border border-ink bg-ink px-2.5 py-1.5 text-xs font-semibold text-ink-foreground transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
        {loading ? "Writing…" : "Summarise"}
      </button>

      {open ? (
        <div className="mt-1 w-full basis-full rounded-sm border border-border bg-background p-3">
          {context ? (
            <p className="label-mono mb-2 text-muted-foreground">
              {context.measureLabel} · {context.filterLabel} · {context.shown} of {context.total}{" "}
              tracked
            </p>
          ) : null}

          {loading ? (
            <p className="text-sm text-muted-foreground">
              Reading the current view and writing your summary…
            </p>
          ) : null}

          {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}

          {summary ? (
            <>
              <div className="space-y-3 text-sm leading-relaxed text-foreground">
                {summary
                  .split(/\n{2,}/)
                  .filter(Boolean)
                  .map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(summary);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-2"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={run}
                  className="inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-2"
                >
                  <RefreshCw className="size-3.5" />
                  Regenerate
                </button>

                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:justify-end">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    aria-label="Email address for this summary"
                    className="chart-select w-full min-w-0 sm:w-56"
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={sending || email.trim().length === 0}
                    className="inline-flex items-center gap-1.5 border border-ink bg-ink px-2.5 py-1.5 text-xs font-semibold text-ink-foreground transition-opacity hover:opacity-85 disabled:opacity-40"
                  >
                    {sending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Mail className="size-3.5" />
                    )}
                    Email me this summary
                  </button>
                </div>
              </div>

              {sent ? <p className="mt-2 text-xs font-semibold text-foreground">{sent}</p> : null}

              <p className="mt-2 text-xs text-muted-foreground">
                AI-generated from the figures shown in this chart. It may contain errors — always
                cross-verify against primary sources.
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
