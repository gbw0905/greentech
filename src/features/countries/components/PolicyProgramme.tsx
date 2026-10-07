import { ArrowRight, CheckCircle2, Circle, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Mandate } from "@/features/countries/mandates";

export function PolicyProgramme({ mandate: m }: { mandate: Mandate }) {
  return (
    <article className="prog">
      <div className="ptags">
        <span>{m.status}</span>
        {m.fuels.map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
      <h3>{m.instrument}</h3>
      <p>{m.currentObligation}</p>
      <Dialog>
        <DialogTrigger asChild>
          <button className="vd" type="button" aria-label={`View details: ${m.instrument}`}>
            View details <ArrowRight size={15} />
          </button>
        </DialogTrigger>
        <DialogContent className="policy-modal">
          <DialogTitle className="modal-title">{m.instrument}</DialogTitle>
          <DialogDescription>{m.currentObligation}</DialogDescription>
          <div className="modal-body">
            <section>
              <h3>Timeline</h3>
              <ol>
                {m.timeline.map((t) => (
                  <li key={`${t.period}-${t.target}`}>
                    {t.reached ? (
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                    ) : (
                      <Circle size={16} className="shrink-0 text-muted-foreground" />
                    )}
                    <div>
                      <b>{t.period}</b>
                      {t.target}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            <section>
              <h3>Requirements</h3>
              <ul className="list-disc pl-4">
                {m.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Compliance &amp; enforcement</h3>
              <dl>
                {[
                  ["Administrator", m.compliance.administrator],
                  ["How compliance is shown", m.compliance.mechanism],
                  ["Penalty for shortfall", m.compliance.penalty],
                  ["Tradable unit", m.compliance.unit ?? "None — physical blend obligation"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
          <footer className="modal-footer">
            <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer">
              {m.sourceName}
              <ExternalLink size={14} />
            </a>
            <span>Last reviewed {m.lastReviewed}</span>
          </footer>
        </DialogContent>
      </Dialog>
    </article>
  );
}
