import { Link } from "@tanstack/react-router";
import { MotionReveal } from "@/components/MotionReveal";
import { JobsHuntScene } from "./JobsHuntScene";

export function JobsHero() {
  return (
    <header className="jobs-hero">
      <MotionReveal className="jobs-hero-copy">
        <h1>
          <span className="jobs-title-line">
            <span>Biofuel and</span>
          </span>
          <span className="jobs-title-line">
            <span>bioenergy</span>
          </span>
          <span className="jobs-title-line">
            <span>jobs, worldwide.</span>
          </span>
        </h1>
        <p>
          Find your next role across biorefineries, policy teams, trading floors and R&amp;D labs —
          searchable by function, seniority and region across trusted global sources.
        </p>
        <div className="jobs-hero-actions">
          <a className="jobs-button jobs-button-primary" href="#job-search">
            Browse jobs
          </a>
          <Link className="jobs-button" to="/get-alerts">
            Get email alerts
          </Link>
        </div>
      </MotionReveal>
      <JobsHuntScene />
    </header>
  );
}
