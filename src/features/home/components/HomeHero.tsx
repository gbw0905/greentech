import { useEffect, useRef } from "react";
import { DottedPolicyGlobe } from "./DottedPolicyGlobe";
import styles from "./HomeHero.module.css";

export function HomeHero({
  stats,
}: {
  stats: { total: number; countries: number; policy: number };
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
        </div>
        <div className={styles["visual"]}>
          <DottedPolicyGlobe />
        </div>
      </div>
      <dl className={`${styles["stats"]} home-container`}>
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
          {
            value: 132.7,
            prefix: "$",
            suffix: "B",
            decimals: 1,
            label: "Market value",
            note: "2026 global biofuels estimate.",
          },
        ].map((stat) => (
          <div key={stat.label} className={styles["stat"]}>
            <dd>
              <HeroStat
                value={stat.value}
                prefix={stat.prefix ?? ""}
                suffix={stat.suffix ?? ""}
                decimals={stat.decimals ?? 0}
              />
            </dd>
            <dt>{stat.label}</dt>
            <p>{stat.note}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HeroStat({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const numberRef = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);
  const formatted = `${prefix}${value.toLocaleString("en-US", { maximumFractionDigits: decimals })}${suffix}`;
  useEffect(() => {
    const element = numberRef.current;
    if (!element) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (animated.current || value <= 0 || media.matches) {
      element.textContent = formatted;
      return;
    }
    let frame = 0;
    let started: number | null = null;
    const draw = (now: number) => {
      started ??= now;
      const progress = Math.min(1, (now - started) / 1800);
      const count = value * (1 - (1 - progress) ** 3);
      element.textContent = `${prefix}${count.toLocaleString("en-US", { maximumFractionDigits: decimals })}${suffix}`;
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
  }, [value, prefix, suffix, decimals, formatted]);
  return (
    <>
      <span aria-hidden="true" ref={numberRef}>
        {formatted}
      </span>
      <span className="sr-only">{formatted}</span>
    </>
  );
}
