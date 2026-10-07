import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { DottedPolicyGlobe } from "./DottedPolicyGlobe";
import styles from "./HomeHero.module.css";

export function HomeHero({
  stats,
}: {
  stats: { total: number; countries: number; policy: number };
}) {
  return (
    <section className={styles["hero"]} aria-labelledby="home-hero-title" data-motion-owned="true">
      <div className={styles["layout"]}>
        <div className={styles["copy"]}>
          <div className={styles["live"]}>Live policy and market intelligence</div>
          <h1 id="home-hero-title" className={styles["title"]}>
            <span>
              <span>Global bioenergy policy</span>
            </span>
            <span>
              <span>and markets, in one place.</span>
            </span>
          </h1>
          <p className={styles["description"]}>
            Global Bioenergy Watch reads official government sources, regulators and credible energy
            media worldwide, then uses AI to classify and summarise each biofuel policy and market
            update. Open the policy map to browse country profiles.
          </p>
          <div className={styles["actions"]}>
            <a href="#map" className={styles["primary"]}>
              Open the policy map
            </a>
            <a href="#updates" className={styles["secondary"]}>
              Read today&apos;s updates
            </a>
          </div>
          <nav className={styles["topics"]} aria-label="Browse by topic">
            <Link to="/timeline">Ethanol</Link>
            <Link to="/timeline">Biodiesel</Link>
            <Link to="/timeline">Sustainable aviation fuel</Link>
            <Link to="/mandates">Blending mandates</Link>
            <Link to="/timeline">Tax credits</Link>
          </nav>
        </div>
        <div className={styles["visual"]}>
          <DottedPolicyGlobe />
        </div>
      </div>
      <dl className={styles["stats"]}>
        {[
          {
            value: stats.total,
            label: "Updates tracked",
            note: "Policy and market news, classified as it is published.",
          },
          {
            value: stats.countries,
            label: "Jurisdictions",
            note: "Countries and regions, each with its own policy profile.",
          },
          {
            value: stats.policy,
            label: "Policy items",
            note: "Mandates, incentives and rules you can filter by fuel type.",
          },
        ].map((stat) => (
          <div key={stat.label} className={styles["stat"]}>
            <dd>
              <HeroStat value={stat.value} />
            </dd>
            <dt>{stat.label}</dt>
            <p>{stat.note}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HeroStat({ value }: { value: number }) {
  const numberRef = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);
  useEffect(() => {
    const element = numberRef.current;
    if (!element) return;
    if (
      animated.current ||
      value <= 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      element.textContent = value.toLocaleString("en-US");
      return;
    }
    let frame = 0;
    const started = performance.now() + 1100;
    const draw = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - started) / 1500));
      element.textContent = Math.round(value * (1 - (1 - progress) ** 3)).toLocaleString("en-US");
      if (progress < 1) frame = requestAnimationFrame(draw);
      else animated.current = true;
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [value]);
  return (
    <>
      <span aria-hidden="true" ref={numberRef}>
        {value.toLocaleString("en-US")}
      </span>
      <span className="sr-only">{value.toLocaleString("en-US")}</span>
    </>
  );
}
