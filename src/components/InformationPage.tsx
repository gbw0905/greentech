import type { ComponentType, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import "./PageDesign.css";

const PAGES = [
  { to: "/about", label: "About us", key: "about" },
  { to: "/about/mission-vision", label: "Mission & vision", key: "mission" },
  { to: "/about/team", label: "Team members", key: "team" },
] as const;
const CHIPS = {
  about: ["4 fuel streams tracked", "Regulators & credible media", "Daily AI-assisted briefs"],
  mission: ["Independent", "Source-cited", "Updated daily"],
  team: ["4 team members", "Editors & developers", "Open to contributors"],
};

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
  const words = title.split(" ");
  const accent = words.pop();
  return (
    <main className="desk-design">
      <header className="banner">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true">/</span>
            {active !== "about" && (
              <>
                <Link to="/about">About us</Link>
                <span aria-hidden="true">/</span>
              </>
            )}
            <span aria-current="page">{PAGES.find((p) => p.key === active)?.label}</span>
          </nav>
          <span className="eyebrow">
            <Icon className="size-3.5" />
            Global Bioenergy Watch
          </span>
          <h1>
            {words.join(" ")} <em>{accent}</em>
          </h1>
          <p className="hero-lede">{subtitle}</p>
          <div className="chips">
            {CHIPS[active].map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
          <nav className="tabs" aria-label="About the desk">
            {PAGES.map((page) => (
              <Link
                key={page.key}
                to={page.to}
                activeOptions={{ exact: true }}
                aria-current={active === page.key ? "page" : undefined}
                className={active === page.key ? "is-cur" : undefined}
              >
                {page.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="wrap content">{children}</div>
    </main>
  );
}
