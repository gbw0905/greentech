import { MotionReveal } from "@/components/MotionReveal";
import { Link } from "@tanstack/react-router";
import { DottedPolicyGlobe } from "./DottedPolicyGlobe";
import styles from "./HomeHero.module.css";

export function HomeHero({
  stats,
}: {
  stats: { total: number; countries: number; policy: number };
}) {
  return (
    <section className={styles["hero"]} aria-labelledby="home-hero-title">
      <div className={styles["layout"]}>
        <MotionReveal className={styles["copy"]}>
          <div className={styles["live"]}>Live policy and market intelligence</div>
          <h1 id="home-hero-title" className={styles["title"]}>
            <span>Global bioenergy policy</span>
            <span>and markets, in one place.</span>
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
        </MotionReveal>
        <MotionReveal className={styles["visual"]} delay={0.12}>
          <DottedPolicyGlobe />
        </MotionReveal>
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
            <dd>{stat.value.toLocaleString("en-US")}</dd>
            <dt>{stat.label}</dt>
            <p>{stat.note}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
