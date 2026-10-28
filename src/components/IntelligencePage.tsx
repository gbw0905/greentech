import type { ComponentType, ReactNode } from "react";
import { MotionReveal } from "./MotionReveal";
import "./IntelligencePage.css";

/** The shared policy and research workspace, with the site's navy and green theme. */
export function IntelligencePage({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  aside,
  className = "",
  children,
}: {
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  eyebrow: string;
  title: string;
  subtitle: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <main className={`intelligence-page ${className}`}>
      <MotionReveal as="header" className="intelligence-page-hero">
        <div className="intelligence-page-intro">
          {eyebrow && (
            <span className="intelligence-page-eyebrow">
              <Icon size={17} aria-hidden />
              {eyebrow}
            </span>
          )}
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {aside && <div className="intelligence-page-aside">{aside}</div>}
      </MotionReveal>
      <div className="intelligence-page-content">{children}</div>
    </main>
  );
}
