import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { mandateStatusTone, type Mandate } from "@/lib/mandates";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-mono text-[0.65rem] font-bold text-foreground">{label}</dt>
      <dd className="text-muted-foreground">{value}</dd>
    </div>
  );
}

export function MandateDetailCard({ mandate: m }: { mandate: Mandate }) {
  return (
    <article className="card-motion overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="h-1 bg-chart-2" aria-hidden />
      <div className="p-4 sm:p-5">
      <header className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`label-mono rounded-sm border px-2 py-0.5 text-[0.65rem] font-bold ${mandateStatusTone(m.status)}`}
          >
            {m.status}
          </span>
          {m.fuels.map((f) => (
            <span
              key={f}
              className="label-mono rounded-sm border border-border bg-muted px-2 py-0.5 text-[0.65rem] font-bold text-foreground"
            >
              {f}
            </span>
          ))}
        </div>
        <h3 className="font-display mt-2 text-base font-extrabold tracking-tight sm:text-lg">
          {m.instrument}
        </h3>
        <p className="mt-2 text-sm/relaxed text-muted-foreground">{m.currentObligation}</p>
      </header>

      <div className="grid gap-5 pt-4 lg:grid-cols-3">
        <div>
          <h4 className="label-mono text-xs font-bold text-muted-foreground">Timeline</h4>
          <ol className="mt-3 space-y-3">
            {m.timeline.map((t) => (
              <li key={`${m.id}-${t.period}`} className="flex gap-2.5">
                {t.reached ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <div className="label-mono text-xs font-bold text-foreground">{t.period}</div>
                  <p className="text-xs/relaxed text-muted-foreground">{t.target}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h4 className="label-mono text-xs font-bold text-muted-foreground">Requirements</h4>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-xs/relaxed text-muted-foreground">
            {m.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="label-mono text-xs font-bold text-muted-foreground">
            Compliance status &amp; enforcement
          </h4>
          <dl className="mt-3 space-y-2 text-xs/relaxed">
            <Row label="Administrator" value={m.compliance.administrator} />
            <Row label="How compliance is shown" value={m.compliance.mechanism} />
            <Row label="Penalty for shortfall" value={m.compliance.penalty} />
            <Row
              label="Tradable unit"
              value={m.compliance.unit ?? "None — physical blend obligation"}
            />
          </dl>
        </div>
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <a
          href={m.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="label-mono inline-flex items-center gap-1.5 text-xs font-bold text-primary underline underline-offset-4"
        >
          {m.sourceName}
          <ExternalLink className="size-3.5" />
        </a>
        <span className="label-mono text-[0.65rem] text-muted-foreground">
          Last reviewed {m.lastReviewed}
        </span>
      </footer>
      </div>
    </article>
  );
}
