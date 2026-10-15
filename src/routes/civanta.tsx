import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  FlaskConical,
  ChartNoAxesCombined,
  Clock3,
  FileSpreadsheet,
} from "lucide-react";
import { MotionReveal } from "@/components/MotionReveal";
import "@/features/ci-workspace/civanta.css";
export const Route = createFileRoute("/civanta")({
  head: () => ({ meta: [{ title: "CIVanta | Carbon Intensity Intelligence" }] }),
  component: CivantaPage,
});
function CivantaPage() {
  return (
    <main className="civanta-hero">
      <img
        className="civanta-hero-image"
        src="/civanta-landscape.jpg"
        alt="Aerial view of a biofuel facility beside forests, farmland and a river"
      />
      <div className="civanta-hero-inner">
        <MotionReveal className="civanta-editorial" duration={1.1} distance={20}>
          <p className="civanta-eyebrow">
            <span />
            Carbon intensity intelligence
          </p>
          <h1>
            CIVanta<span className="civanta-title-dot">.</span>
          </h1>
          <h2>
            A clearer view of
            <br />
            your fuel’s potential.
          </h2>
          <p className="civanta-description">
            Model lifecycle carbon intensity. Explore credit and RIN economics. Keep every
            calculation in your account.
          </p>
          <div className="civanta-features">
            <span>
              <Clock3 size={15} />
              Account history
            </span>
            <span>
              <FileSpreadsheet size={15} />
              Excel reports
            </span>
          </div>
        </MotionReveal>
        <MotionReveal className="civanta-tool-panel" duration={1.1} delay={0.15} distance={24}>
          <div className="civanta-panel-heading">
            <span>Your analytical toolkit</span>
            <span>02 tools</span>
          </div>
          <Link className="civanta-tool" to="/ci-workspace">
            <div className="civanta-tool-top">
              <span className="civanta-tool-icon">
                <FlaskConical size={22} />
              </span>
              <span className="civanta-tool-index">01 / LIFECYCLE</span>
              <ArrowUpRight className="civanta-tool-arrow" size={22} />
            </div>
            <h3>CI Scenario Workspace</h3>
            <p>
              Build a fuel pathway, inspect each contribution and compare changes with a baseline.
            </p>
            <div className="civanta-tool-footer">
              <span>43 fuel pathways</span>
              <strong>Open workspace →</strong>
            </div>
          </Link>
          <Link className="civanta-tool" to="/credit-calculator">
            <div className="civanta-tool-top">
              <span className="civanta-tool-icon">
                <ChartNoAxesCombined size={22} />
              </span>
              <span className="civanta-tool-index">02 / FUEL ECONOMICS</span>
              <ArrowUpRight className="civanta-tool-arrow" size={22} />
            </div>
            <h3>Credit and RIN Calculator</h3>
            <p>
              Translate eligible fuel quantities and pathway CI into conditional credit and RIN
              estimates.
            </p>
            <div className="civanta-tool-footer">
              <span>LCFS · RFS</span>
              <strong>Open calculator →</strong>
            </div>
          </Link>
          <Link className="civanta-history-link" to="/calculation-history">
            <Clock3 size={14} />
            Revisit your calculation history
            <ArrowUpRight size={15} />
          </Link>
        </MotionReveal>
      </div>
    </main>
  );
}
