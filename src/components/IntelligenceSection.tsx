import { MotionReveal } from "@/components/MotionReveal";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  FileText,
  Globe2,
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
    href: "/#map",
    tracking: "Bioenergy signals worldwide",
  },
  {
    title: "Fuel and feedstock markets",
    icon: TrendingUp,
    description:
      "Follow market developments across the bioenergy sector and benchmark crude oil, equities, and natural gas alongside policy intelligence.",
    tags: ["Crude oil", "Equities", "Natural gas"],
    href: "/#markets",
    tracking: "Policy and market developments",
  },
  {
    title: "Live development tracker",
    icon: FileText,
    description:
      "Policy acts and market moves are classified by jurisdiction and fuel type, then published to a live tracker with source citations.",
    tags: ["Latest updates", "Jurisdictions", "Source citations"],
    href: "/#updates",
    tracking: "Developments across jurisdictions",
  },
  {
    title: "Sector company intelligence",
    icon: BriefcaseBusiness,
    description:
      "Explore the companies moving the sector — oil majors, SAF airlines, fuel retailers, marine suppliers, and used cooking oil traders.",
    tags: ["Producers", "Suppliers", "Users"],
    href: "/supply",
    tracking: "Companies across the value chain",
  },
  {
    title: "AI-powered briefings",
    icon: Sparkles,
    description:
      "AI-powered summaries turn dense regulatory filings into readable briefings delivered by email on demand. Verify generated summaries against their original sources.",
    tags: ["AI summaries", "Daily digest", "Email alerts"],
    href: "/#alerts",
    tracking: "Policy and market briefings",
  },
  {
    title: "Bioenergy careers",
    icon: Newspaper,
    description:
      "Connect with bioenergy careers across biorefineries, policy teams, trading desks, and research and development — with openings organised by function, seniority, and region.",
    tags: ["Jobs", "Companies", "Careers"],
    href: "/jobs",
    tracking: "Careers across the bioenergy sector",
  },
] as const;

const AUDIENCES = ["Analysts", "Researchers", "Investors", "Policymakers", "Journalists"];

function IntelligenceNetwork({ active }: { active: number }) {
  const capability = CAPABILITIES[active] ?? CAPABILITIES[0];
  return (
    <div className="intelligence-network">
      <div className="intelligence-network-top">
        <span>Intelligence network</span>
        <span>{String(active + 1).padStart(2, "0")} / 06</span>
      </div>
      <div className="intelligence-network-art" aria-hidden="true">
        <svg viewBox="0 0 540 500" fill="none">
          <circle cx="270" cy="250" r="232" stroke="currentColor" opacity=".15" />
          <circle cx="270" cy="250" r="168" stroke="#53bba9" strokeDasharray="2 3" opacity=".25" />
          <circle cx="270" cy="250" r="103" stroke="#53bba9" opacity=".2" />
          <circle cx="270" cy="250" r="84" stroke="#53bba9" opacity=".2" />
          <path
            d="M130 111L311 240M171 210L285 110M163 405L367 302M163 302L316 343"
            stroke="#55c5ac"
            opacity=".65"
          />
          <path
            d="M76 98L130 111M426 80L428 91M69 414L141 419M435 409L480 349"
            stroke="currentColor"
            opacity=".18"
          />
        </svg>
        <div className="intelligence-orbit">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="intelligence-network-core">
          <Globe2 size={30} strokeWidth={1.6} />
          <strong>GBW</strong>
          <span>Live intelligence</span>
        </div>
        <span className="intelligence-node intelligence-node-policy">Policy</span>
        <span className="intelligence-node intelligence-node-markets">Markets</span>
        <span className="intelligence-node intelligence-node-careers">Careers</span>
        <span className="intelligence-node intelligence-node-companies">Companies</span>
      </div>
      <div className="intelligence-network-bottom">
        <div>
          <span>Tracking</span>
          <p>{capability.tracking}</p>
        </div>
        <a href={capability.href} aria-label={`Explore ${capability.title}`}>
          <ArrowRight size={18} />
        </a>
      </div>
    </div>
  );
}

export function IntelligenceSection() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState<number | null>(0);
  const [active, setActive] = useState(0);
  return (
    <div className="intelligence-surface">
      <section className="intelligence-section" aria-labelledby="intelligence-title">
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
            <IntelligenceNetwork active={active} />
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
                          <a key={tag} href={item.href}>
                            {tag}
                          </a>
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
