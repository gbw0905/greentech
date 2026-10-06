import { IntelligencePipeline } from "@/components/IntelligencePipeline";
import { MotionReveal } from "@/components/MotionReveal";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  FileText,
  Newspaper,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const CAPABILITIES = [
  {
    title: "Global policy intelligence",
    icon: ShieldCheck,
    description:
      "Monitor government agencies, regulators, and credible media outlets for policy developments affecting ethanol, biodiesel, renewable diesel, SAF, and emerging feedstocks.",
    tags: ["Mandates", "Regulation", "Country tracking"],
    to: "/",
    hash: "map",
    tracking: "Bioenergy signals worldwide",
  },
  {
    title: "Fuel and feedstock markets",
    icon: TrendingUp,
    description:
      "Follow market developments across the bioenergy sector and benchmark crude oil, equities, and natural gas alongside policy intelligence.",
    tags: ["Crude oil", "Equities", "Natural gas"],
    to: "/",
    hash: "markets",
    tracking: "Policy and market developments",
  },
  {
    title: "Live development tracker",
    icon: FileText,
    description:
      "Policy acts and market moves are classified by jurisdiction and fuel type, then published to a live tracker with source citations.",
    tags: ["Latest updates", "Jurisdictions", "Source citations"],
    to: "/",
    hash: "updates",
    tracking: "Developments across jurisdictions",
  },
  {
    title: "Sector company intelligence",
    icon: BriefcaseBusiness,
    description:
      "Explore the companies moving the sector — oil majors, SAF airlines, fuel retailers, marine suppliers, and used cooking oil traders.",
    tags: ["Producers", "Suppliers", "Users"],
    to: "/supply",
    tracking: "Companies across the value chain",
  },
  {
    title: "AI-powered briefings",
    icon: Sparkles,
    description:
      "AI-powered summaries turn dense regulatory filings into readable briefings delivered by email on demand. Verify generated summaries against their original sources.",
    tags: ["AI summaries", "Daily digest", "Email alerts"],
    to: "/get-alerts",
    tracking: "Policy and market briefings",
  },
  {
    title: "Bioenergy careers",
    icon: Newspaper,
    description:
      "Connect with bioenergy careers across biorefineries, policy teams, trading desks, and research and development — with openings organised by function, seniority, and region.",
    tags: ["Jobs", "Companies", "Careers"],
    to: "/jobs",
    tracking: "Careers across the bioenergy sector",
  },
] as const;

const AUDIENCES = ["Analysts", "Researchers", "Investors", "Policymakers", "Journalists"];

export function IntelligenceSection() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<number | null>(0);
  const [active, setActive] = useState(0);
  const capability = CAPABILITIES[active] ?? CAPABILITIES[0];
  const [automatic, setAutomatic] = useState(true);
  const visualRef = useRef<HTMLDivElement>(null);
  const inView = useInView(visualRef, { amount: 0.35 });
  useEffect(() => {
    if (reduced || !inView || !automatic) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setActive((current) => (current + 1) % CAPABILITIES.length);
      setOpen((current) => ((current ?? 0) + 1) % CAPABILITIES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [automatic, inView, reduced]);
  return (
    <div className="intelligence-surface">
      <section
        id="disclaimer"
        className="intelligence-section scroll-mt-[88px]"
        aria-labelledby="intelligence-title"
      >
        <MotionReveal as="header" className="intelligence-heading">
          <div>
            <p className="intelligence-eyebrow">The global bioenergy intelligence desk</p>
            <h2 id="intelligence-title">
              One sector.
              <br />
              <span>Every signal.</span>
            </h2>
          </div>
          <div className="intelligence-intro">
            <p>
              We connect policy, markets, companies, and careers to help you understand the forces
              shaping the global bioenergy economy.
            </p>
            <span>
              <i />
              Continuously monitoring global developments
            </span>
          </div>
        </MotionReveal>
        <div className="intelligence-grid">
          <MotionReveal delay={0.09}>
            <div ref={visualRef} className="intelligence-pipeline-container">
              <IntelligencePipeline active={active} running={inView && !reduced} />
              <div className="intelligence-network-bottom">
                <div>
                  <span>Now showing</span>
                  <p>{capability.title}</p>
                </div>
                <Link
                  to={capability.to}
                  hash={"hash" in capability ? capability.hash : ""}
                  aria-label={`Explore ${capability.title}`}
                >
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </MotionReveal>
          <div className="intelligence-accordion">
            {CAPABILITIES.map((item, index) => {
              const Icon = item.icon;
              const expanded = open === index;
              return (
                <MotionReveal
                  as="article"
                  delay={(index + 1) * 0.08}
                  key={item.title}
                  className={`intelligence-item ${expanded ? "is-open" : ""}`}
                >
                  <h3>
                    <button
                      type="button"
                      id={`intelligence-trigger-${index}`}
                      aria-expanded={expanded}
                      aria-controls={`intelligence-panel-${index}`}
                      onClick={() => {
                        setAutomatic(false);
                        setOpen(expanded ? null : index);
                        setActive(index);
                      }}
                    >
                      <span className="intelligence-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>{item.title}</span>
                      <Icon
                        className="intelligence-item-icon"
                        size={19}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      <ChevronDown className="intelligence-chevron" size={16} aria-hidden="true" />
                    </button>
                  </h3>
                  <motion.div
                    id={`intelligence-panel-${index}`}
                    role="region"
                    aria-labelledby={`intelligence-trigger-${index}`}
                    aria-hidden={!expanded}
                    inert={!expanded}
                    initial={false}
                    animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
                    transition={{ duration: reduced ? 0 : 0.35, ease: [0.2, 0.7, 0.2, 1] }}
                    className="intelligence-panel-motion"
                  >
                    <div className="intelligence-item-content">
                      <p>{item.description}</p>
                      <div className="intelligence-tags">
                        {item.tags.map((tag) => (
                          <Link key={tag} to={item.to} hash={"hash" in item ? item.hash : ""}>
                            {tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </MotionReveal>
              );
            })}
          </div>
        </div>
        <MotionReveal className="intelligence-audience">
          <p>Built for people who move the sector forward</p>
          <div>
            {AUDIENCES.map((audience) => (
              <span key={audience}>{audience}</span>
            ))}
          </div>
          <Link to="/about/mission-vision" aria-label="Read our mission and vision">
            <ArrowRight size={18} />
          </Link>
        </MotionReveal>
      </section>
    </div>
  );
}
