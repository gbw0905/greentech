import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  FlaskConical,
  ChartNoAxesCombined,
  Clock3,
  FileSpreadsheet,
  Target,
} from "lucide-react";
import { MotionReveal } from "@/components/MotionReveal";
import "@/features/ci-workspace/civanta.css";

export const Route = createFileRoute("/civanta")({
  head: () => ({ meta: [{ title: "CIVanta | Carbon Intensity Intelligence" }] }),
  component: CivantaPage,
});

const TOOLS = [
  {
    to: "/ci-workspace",
    category: "Lifecycle modelling",
    title: "CI Scenario Workspace",
    description:
      "Build your fuel pathway, see what drives its carbon intensity and compare it with a baseline.",
    detail: "43 fuel pathways",
    outcome: "Understand your CI",
    action: "Open workspace",
    icon: FlaskConical,
  },
  {
    to: "/credit-calculator",
    category: "Fuel economics",
    title: "Credit and RIN Calculator",
    description:
      "Turn your pathway CI and eligible fuel volume into conditional credit and RIN estimates.",
    detail: "LCFS & RFS programmes",
    outcome: "Explore potential value",
    action: "Open calculator",
    icon: ChartNoAxesCombined,
  },
  {
    to: "/civanta/optimizer",
    category: "Pathway optimization",
    title: "CIVanta Optimizer",
    description:
      "Compare improvement measures and find the least-cost combination that meets your CI target.",
    detail: "Cost, CI & sensitivity",
    outcome: "Plan your next improvement",
    action: "Open optimizer",
    icon: Target,
  },
] as const;

function CivantaPage() {
  return (
    <main className="civanta-page">
      <div className="civanta-shell">
        <MotionReveal as="header" className="civanta-intro" duration={0.7} distance={16} blur={0}>
          <img
            className="civanta-intro-image"
            src="/civanta-landscape.jpg"
            alt=""
            width={1200}
            height={600}
          />
          <div className="civanta-intro-copy">
            <p className="civanta-eyebrow">Carbon intensity intelligence</p>
            <h1>
              CIVanta<span>.</span>
            </h1>
            <p className="civanta-description">
              Understand your footprint. Explore its value. Find a better pathway.
            </p>
          </div>
          <div className="civanta-intro-caption" aria-hidden="true">
            <span /> Intelligence for a lower-carbon fuel economy
          </div>
        </MotionReveal>

        <div className="civanta-toolkit-heading">
          <div>
            <p className="civanta-kicker">Your analytical toolkit</p>
            <h2>Choose your next step</h2>
          </div>
          <Link className="civanta-history-link" to="/calculation-history">
            <Clock3 size={18} aria-hidden="true" /> Calculation history
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <nav className="civanta-tools" aria-label="CIVanta tools">
          {TOOLS.map((tool, index) => (
            <MotionReveal
              key={tool.to}
              className="civanta-tool-reveal"
              duration={0.65}
              delay={index * 0.08}
              distance={18}
              blur={0}
            >
              <Link
                className="civanta-tool"
                to={tool.to}
                aria-label={`${tool.action}: ${tool.title}`}
              >
                <div className="civanta-tool-top">
                  <span className="civanta-tool-icon">
                    <tool.icon size={24} aria-hidden="true" />
                  </span>
                  <span className="civanta-tool-number" aria-hidden="true">
                    0{index + 1}
                  </span>
                </div>
                <p className="civanta-tool-category">{tool.category}</p>
                <h3>{tool.title}</h3>
                <p className="civanta-tool-description">{tool.description}</p>
                <div className="civanta-tool-detail">{tool.detail}</div>
                <span className="civanta-tool-action">
                  {tool.action}
                  <ArrowRight size={19} aria-hidden="true" />
                </span>
                <span className="civanta-tool-outcome">{tool.outcome}</span>
              </Link>
            </MotionReveal>
          ))}
        </nav>

        <div className="civanta-supporting-note">
          <span>
            <Clock3 size={17} aria-hidden="true" /> Successful runs save to your account
          </span>
          <span>
            <FileSpreadsheet size={17} aria-hidden="true" /> Download detailed Excel reports
          </span>
        </div>
      </div>
    </main>
  );
}
