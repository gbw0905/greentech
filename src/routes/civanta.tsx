import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  const studioFrame = useRef<HTMLIFrameElement>(null);
  const [studioHeight, setStudioHeight] = useState(2250);
  useEffect(() => {
    const iframe = studioFrame.current;
    if (!iframe) return;
    let resizeObserver: ResizeObserver | null = null;
    const measure = () => {
      const next = iframe.contentDocument?.documentElement?.scrollHeight;
      if (typeof next === "number" && Number.isFinite(next)) {
        setStudioHeight(Math.min(60000, Math.max(700, Math.ceil(next + 12))));
      }
    };
    const onLoad = () => {
      resizeObserver?.disconnect();
      const body = iframe.contentDocument?.body;
      if (body && typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(body);
      }
      measure();
    };
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframe.contentWindow) return;
      if (event.data?.type === "civanta-studio-height" && Number.isFinite(event.data.height)) {
        setStudioHeight(Math.min(60000, Math.max(700, Math.ceil(event.data.height + 12))));
      }
    };
    iframe.addEventListener("load", onLoad);
    window.addEventListener("message", receive);
    if (iframe.contentDocument?.readyState === "complete") onLoad();
    return () => {
      resizeObserver?.disconnect();
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("message", receive);
    };
  }, []);
  return (
    <main className="civanta-page civanta-page--studio">
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

        <section className="civanta-studio-section" aria-label="CIVanta Unified Studio">
          <div className="civanta-studio-section-heading">
            <div>
              <h2>Unified CIVanta Studio</h2>
              <p>Build a pathway, run a screening CI calculation, explore sensitivities, and evaluate conditional LCFS, RFS RIN and 45Z estimates.</p>
            </div>
            <span>Public preview · illustrative screening model</span>
          </div>
          <iframe
            ref={studioFrame}
            src="/tools/civanta-studio.html"
            title="CIVanta Unified Studio — interactive pathway, optimization and credit screening"
            className="civanta-studio-frame"
            style={{ height: studioHeight }}
            loading="eager"
          />
          <p className="civanta-studio-disclaimer">
            This unified interface is a public preview and does not yet use the validated production CI engines.
            Live production tools remain available below; complete calculation exports continue to require authenticated Pro access.
          </p>
        </section>
        <details className="civanta-legacy-tools">
          <summary>Open original CI Workspace, Credit Calculator and Optimizer</summary>
        <nav className="civanta-tools" aria-label="Original CIVanta tools">
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
        </details>
      </div>
    </main>
  );
}
