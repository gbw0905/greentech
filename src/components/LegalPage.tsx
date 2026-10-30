import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import "./PageDesign.css";

export function LegalPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="desk-design legal-page">
      <header className="banner">
        <div className="wrap">
          <h1>{title}</h1>
          <p className="hero-lede">{subtitle}</p>
          <nav className="tabs" aria-label="Site policies">
            <Link to="/privacy" activeOptions={{ exact: true }}>
              Privacy policy
            </Link>
            <Link to="/terms">Terms of use</Link>
          </nav>
        </div>
      </header>
      <div className="wrap content">{children}</div>
    </main>
  );
}
