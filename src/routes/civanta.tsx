import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  Clock3,
  FlaskConical,
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
    title: "CI Scenario Workspace",
    description:
      "Build your fuel pathway, see what drives its carbon intensity and compare it with a baseline.",
    detail: "43 fuel pathways",
    action: "Open workspace",
    icon: FlaskConical,
    tone: "gold",
  },
  {
    to: "/credit-calculator",
    title: "Credit and RIN Calculator",
    description:
      "Turn your pathway CI and eligible fuel volume into conditional credit and RIN estimates.",
    detail: "LCFS & RFS programmes",
    action: "Open calculator",
    icon: ChartNoAxesCombined,
    tone: "emerald",
  },
  {
    to: "/civanta/optimizer",
    title: "CIVanta Optimizer",
    description:
      "Compare improvement measures and find the least-cost combination that meets your CI target.",
    detail: "Cost, CI & sensitivity",
    action: "Open optimizer",
    icon: Target,
    tone: "blue",
  },
] as const;

function CivantaPage() {
  return (
    <main className="civanta-page">
      <div className="civanta-shell">
        <MotionReveal as="header" className="civanta-intro" duration={0.7} distance={16} blur={0}>
          <div className="civanta-intro-copy">
            <h1>
              CIVanta<span>.</span>
            </h1>
            <p className="civanta-description">
              Understand your footprint. Explore its value. Find a better pathway.
            </p>
          </div>
          <Link className="civanta-history-link" to="/calculation-history">
            <Clock3 size={18} aria-hidden="true" /> Calculation history
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </MotionReveal>

        <nav className="civanta-tools" aria-label="CIVanta tools">
          {TOOLS.map((tool, index) => (
            <MotionReveal
              key={tool.to}
              className={`civanta-tool-reveal civanta-tool-reveal--${tool.tone}`}
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
                <span className="civanta-tool-icon" aria-hidden="true">
                  <tool.icon size={26} />
                </span>
                <h3>{tool.title}</h3>
                <p className="civanta-tool-description">{tool.description}</p>
                <div className="civanta-tool-detail">{tool.detail}</div>
                <span className="civanta-tool-action">
                  {tool.action}
                  <ArrowRight size={19} aria-hidden="true" />
                </span>
              </Link>
            </MotionReveal>
          ))}
        </nav>
      </div>
    </main>
  );
}
