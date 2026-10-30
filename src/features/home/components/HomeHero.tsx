import { useEffect, useRef } from "react";
import type { HomeStats } from "../home-stats";
import type { BioenergyMarketValue } from "../bioenergy-market-value";
import { DottedPolicyGlobe } from "./DottedPolicyGlobe";
import styles from "./HomeHero.module.css";

export function HomeHero({
  stats,
  marketValue,
}: {
  stats: HomeStats | null;
  marketValue: BioenergyMarketValue | null;
}) {
  return (
    <section
      className={`${styles["hero"]} home-hero`}
      aria-labelledby="home-hero-title"
      data-motion-owned="true"
    >
      <div className={`${styles["layout"]} home-container`}>
        <div className={styles["copy"]}>
          <div className={styles["live"]}>Live policy and market intelligence</div>
          <h1 id="home-hero-title" className={styles["title"]}>
            <span>
              <span>
                Global <em className={styles["accent"]}>bioenergy</em> policy
              </span>
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
        </div>
        <div className={styles["visual"]}>
          <DottedPolicyGlobe />
        </div>
      </div>
      <dl className={`${styles["stats"]} home-container`}>
        {[
          {
            value: stats?.total ?? null,
            label: "Updates in archive",
            note: "Rolling 180 days · refreshed as sources are reviewed.",
          },
          {
            value: stats?.countries ?? null,
            label: "Jurisdictions",
            note: "Countries and regions with a policy profile.",
          },
          {
            value: stats?.policy ?? null,
            label: "Policy updates",
            note: "Classified policy updates in the archive.",
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
        <div className={styles["stat"]}>
          <dd>
            {marketValue
              ? `$${(marketValue.usd / 1_000_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}B`
              : "—"}
          </dd>
          <dt>Global bioenergy market</dt>
          <p>
            {marketValue
              ? `${marketValue.year} annual market estimate`
              : "Data temporarily unavailable"}
          </p>
        </div>
      </dl>
    </section>
  );
}

function HeroStat({ value }: { value: number | null }) {
  const numberRef = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);
  const formatted = value === null ? "—" : value.toLocaleString("en-US");
  useEffect(() => {
    const element = numberRef.current;
    if (!element) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (value === null || animated.current || value <= 0 || media.matches) {
      element.textContent = formatted;
      return;
    }
    let frame = 0;
    let started: number | null = null;
    const draw = (now: number) => {
      started ??= now;
      const progress = Math.min(1, (now - started) / 1800);
      const count = value * (1 - (1 - progress) ** 3);
      element.textContent = Math.round(count).toLocaleString("en-US");
      if (progress < 1) frame = requestAnimationFrame(draw);
      else {
        element.textContent = formatted;
        animated.current = true;
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        frame = requestAnimationFrame(draw);
      },
      { threshold: 0.5 },
    );
    const finish = () => {
      if (!media.matches) return;
      observer.disconnect();
      cancelAnimationFrame(frame);
      element.textContent = formatted;
      animated.current = true;
    };
    observer.observe(element);
    media.addEventListener("change", finish);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      media.removeEventListener("change", finish);
    };
  }, [value, formatted]);
  return (
    <>
      <span aria-hidden="true" ref={numberRef}>
        {formatted}
      </span>
      <span className="sr-only">{formatted}</span>
    </>
  );
}
