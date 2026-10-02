import { Link } from "@tanstack/react-router";
import { BriefcaseBusiness } from "lucide-react";
import { MotionReveal } from "@/components/MotionReveal";
import { EMPLOYERS, JOB_BOARDS } from "@/features/jobs/data";

export function JobsHero() {
  return (
    <header className="jobs-hero">
      <MotionReveal className="jobs-hero-copy">
        <span className="jobs-eyebrow">
          <i /> Bioenergy careers desk
        </span>
        <h1>
          Biofuel and
          <br />
          bioenergy
          <br />
          jobs, worldwide.
        </h1>
        <p>
          Find your next role across biorefineries, policy teams, trading floors and R&amp;D labs —
          searchable by function, seniority and region across trusted global sources.
        </p>
        <div className="jobs-hero-actions">
          <a className="jobs-button jobs-button-primary" href="#job-search">
            Browse jobs
          </a>
          <Link className="jobs-button" to="/" hash="alerts">
            Get email alerts
          </Link>
        </div>
      </MotionReveal>
      <MotionReveal className="jobs-discovery" delay={0.12}>
        <div className="jobs-lens" aria-hidden="true">
          <div className="jobs-lens-highlight" />
        </div>
        <div className="jobs-floating-sources" aria-hidden="true">
          {JOB_BOARDS.slice(0, 6).map((board, index) => (
            <div key={board.name} className={`jobs-floating-card jobs-floating-card-${index}`}>
              <span>
                <BriefcaseBusiness size={10} /> {board.name}
              </span>
              <i />
              <i />
            </div>
          ))}
        </div>
        <span className="jobs-discovery-label jobs-discovery-label-top">
          <i /> Global opportunities
        </span>
        <span className="jobs-discovery-label jobs-discovery-label-right">
          <i /> {EMPLOYERS.length} employers
        </span>
        <span className="jobs-discovery-label jobs-discovery-label-left">
          <i /> {JOB_BOARDS.length} trusted sources
        </span>
        <span className="jobs-discovery-label jobs-discovery-label-bottom">
          <i /> Hiring news feed
        </span>
      </MotionReveal>
    </header>
  );
}
