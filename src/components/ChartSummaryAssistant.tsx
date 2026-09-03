import { useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Lock, Mail } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { SignInPrompt } from "@/components/SignInPrompt";
import { emailChartSummaryFn } from "@/lib/chart-summary.functions";
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

/**
 * "Email summary" action: writes the analyst summary of the current view
 * server-side and emails it with the full data-source reference list.
 */
export function ChartSummaryAssistant({
  build,
  disabled,
  portalTarget,
}: {
  build: () => ChartSummaryPayload;
  disabled?: boolean;
  /** When supplied, the email form is rendered into this DOM node instead of inline. */
  portalTarget?: HTMLElement | null;
}) {
  const { user, signedIn } = useAuthSession();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");

  async function send() {
    if (sending) return;
    setSending(true);
    setSent("");
    setError("");
    try {
      const res = await emailChartSummaryFn({ data: { email, payload: build() } });
      setSent(
        res.sent
          ? `Sent to ${email}. The summary and its data sources are in your inbox.`
          : "That address is unsubscribed from our emails.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the summary.");
    } finally {
      setSending(false);
    }
  }

  const formPanel = (
    <div className="mt-2 rounded-sm border border-border bg-background p-3">
      <p className="mb-2 text-sm text-muted-foreground">
        We write a full analyst summary of the rows and measure currently shown — including the
        data sources and references behind the figures — and email it to you.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Email address for this summary"
          className="chart-select w-full min-w-0 sm:w-64"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || email.trim().length === 0}
          className="inline-flex items-center gap-1.5 border border-ink bg-ink px-2.5 py-1.5 text-xs font-semibold text-ink-foreground transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
          {sending ? "Writing and sending…" : "Send"}
        </button>
      </div>

      {error ? <p className="mt-2 text-sm font-semibold text-destructive">{error}</p> : null}
      {sent ? <p className="mt-2 text-xs font-semibold text-foreground">{sent}</p> : null}

      <p className="mt-2 text-xs text-muted-foreground">
        AI-generated from the figures shown in this chart. It may contain errors — always
        cross-verify against the referenced primary sources.
      </p>
    </div>
  );

  const panel = open
    ? signedIn
      ? formPanel
      : <SignInPrompt action="email yourself this analyst summary" />
    : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        title={signedIn ? "Email a full analyst summary of the rows and measure currently shown, with data sources" : "Sign in to email this summary"}
        className="inline-flex shrink-0 items-center gap-1.5 border border-ink bg-ink px-2.5 py-1.5 text-xs font-semibold text-ink-foreground transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        {signedIn ? <Mail className="size-3.5" /> : <Lock className="size-3.5" />}
        Email summary
      </button>

      {open && portalTarget ? createPortal(panel, portalTarget) : panel}
    </>
  );
}
