import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import "./PageDesign.css";

const PAGES = [
  { to: "/about", label: "About us", key: "about" },
  { to: "/about/mission-vision", label: "Mission & vision", key: "mission" },
  { to: "/about/team", label: "Team members", key: "team" },
] as const;
export function InformationPage({
  active,
  title,
  subtitle,
  children,
}: {
  active: (typeof PAGES)[number]["key"];
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="desk-design about-page">
      <header className="banner">
        <div className="wrap">
          <h1>{title}</h1>
          <p className="hero-lede">{subtitle}</p>
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
