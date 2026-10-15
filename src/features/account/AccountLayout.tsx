import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight, UserRound, LayoutDashboard, Clock3 } from "lucide-react";
import type { ReactNode } from "react";
import "./account.css";

export function AccountLayout({
  title,
  description,
  section,
  children,
}: {
  title: string;
  description: string;
  section: "profile" | "results" | "history";
  children: ReactNode;
}) {
  return (
    <main className="account-page">
      <div className="account-shell">
        <div className="account-breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} />
          <span>My account</span>
        </div>
        <header className="account-heading">
          <span className="account-eyebrow">Your personal workspace</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        <nav className="account-tabs" aria-label="Account pages">
          <Link to="/profile" aria-current={section === "profile" ? "page" : undefined}>
            <UserRound size={17} />
            My profile
          </Link>
          <Link to="/my-results" aria-current={section === "results" ? "page" : undefined}>
            <LayoutDashboard size={17} />
            Saved CI results
          </Link>
          <Link to="/calculation-history" aria-current={section === "history" ? "page" : undefined}>
            <Clock3 size={17} />
            Calculation history
          </Link>
          <Link to="/civanta" className="account-tools-link">
            Explore CIVanta
            <ArrowRight size={16} />
          </Link>
        </nav>
        <div className="account-content">{children}</div>
      </div>
    </main>
  );
}
