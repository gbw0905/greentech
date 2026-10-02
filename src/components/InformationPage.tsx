import type { ComponentType, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Globe2 } from "lucide-react";
import { MotionReveal } from "@/components/MotionReveal";

const PAGES = [
  { to: "/about", label: "About us", key: "about" },
  { to: "/about/mission-vision", label: "Mission & vision", key: "mission" },
  { to: "/about/team", label: "Team members", key: "team" },
  { to: "/contact", label: "Contact", key: "contact" },
] as const;

/** Shared presentation for the desk's informational pages; site chrome lives in SiteLayout. */
export function InformationPage({
  active,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  active: (typeof PAGES)[number]["key"];
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className={`information-page information-page-${active}`}>
      <main className="information-main">
        <MotionReveal as="header" className="information-hero">
          <div className="information-hero-copy">
            <span className="information-eyebrow">
              <Icon className="size-3.5" />
              {active === "contact" ? "Contact" : "Global Bioenergy Watch"}
            </span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="information-emblem" aria-hidden="true">
            <div className="information-emblem-ring" />
            <div className="information-emblem-core">
              <Globe2 />
            </div>
            <i className="information-emblem-dot information-emblem-dot-one" />
            <i className="information-emblem-dot information-emblem-dot-two" />
            <i className="information-emblem-dot information-emblem-dot-three" />
          </div>
        </MotionReveal>
        <nav className="information-nav" aria-label="About the desk">
          {PAGES.map((page) => (
            <Link
              key={page.key}
              to={page.to}
              activeOptions={{ exact: true }}
              aria-current={active === page.key ? "page" : undefined}
              className={active === page.key ? "is-current" : undefined}
            >
              {page.label}
            </Link>
          ))}
        </nav>
        <MotionReveal className="information-content">{children}</MotionReveal>
      </main>
    </div>
  );
}
