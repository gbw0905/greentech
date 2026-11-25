import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  getBioenergyPricesFn,
  type BioenergyPrices,
} from "@/features/markets/bioenergy-prices-server-functions";
import styles from "./BioenergyPrices.module.css";

const day = (t: number | null | undefined) =>
  t
    ? new Date(t).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";
const money = (n: number, digits = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pct = (now: number, before: number | null | undefined) =>
  before ? ((now - before) / before) * 100 : null;

function Change({ value, label }: { value: number | null; label: string }) {
  if (value === null) return null;
  return (
    <span className={value >= 0 ? styles["positive"] : styles["negative"]}>
      {value >= 0 ? "▲" : "▼"} {Math.abs(value).toFixed(1)}% {label}
    </span>
  );
}

function LcfsCard({ lcfs }: { lcfs: NonNullable<BioenergyPrices["lcfs"]> }) {
  const latest = lcfs.months.at(-1)!;
  const previous = lcfs.months.at(-2);
  const max = Math.max(...lcfs.months.map((m) => m.avgPrice));
  return (
    <article className={styles["card"]}>
      <div className={styles["head"]}>
        <h3>California LCFS credit</h3>
        <span className={styles["tag"]}>Monthly · CARB</span>
      </div>
      <div>
        <div className={styles["price"]}>
          ${money(latest.avgPrice, 0)}
          <small>per credit (t CO₂e) · {latest.period}</small>
        </div>
        <p className={styles["sub"]}>
          Volume-weighted average of {latest.transfers.toLocaleString("en-US")} transfers,{" "}
          {(latest.volumeMt / 1e6).toFixed(1)} million credits.{" "}
          <Change value={pct(latest.avgPrice, previous?.avgPrice)} label="vs previous month" />
        </p>
      </div>
      <div className={styles["bars"]} aria-label="Average LCFS credit price by month">
        {lcfs.months.map((m) => (
          <div key={m.period} className={styles["bar"]}>
            <b>${money(m.avgPrice, 0)}</b>
            <i style={{ height: `${Math.max(8, (m.avgPrice / max) * 60)}px` }} />
            <span>{m.period}</span>
          </div>
        ))}
      </div>
      <table className={styles["table"]}>
        <thead>
          <tr>
            <th>Period</th>
            <th>Avg price</th>
            <th>Credits</th>
          </tr>
        </thead>
        <tbody>
          {[...lcfs.quarters, ...lcfs.years].map((row) => (
            <tr key={row.period}>
              <td>{row.period.replace(/^CY /, "Year ")}</td>
              <td>${money(row.avgPrice, 0)}</td>
              <td>{(row.volumeMt / 1e6).toFixed(1)} m</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles["source"]}>
        {lcfs.priceRange
          ? `Trades in ${lcfs.reportMonth} ranged $${lcfs.priceRange.low}–$${lcfs.priceRange.high}. `
          : ""}
        Source:{" "}
        <a href={lcfs.sourceUrl} target="_blank" rel="noopener noreferrer">
          CARB Monthly LCFS Credit Transfer Activity Report, {lcfs.reportMonth}
        </a>
        , posted {day(lcfs.postedAt)}. CARB publishes on the second Tuesday of each month;
        zero-price transfers are excluded.
        {lcfs.stale
          ? " CARB could not be reached at the last check, so this is the last copy we saved."
          : ""}
      </p>
    </article>
  );
}

function EthanolCard({ ethanol }: { ethanol: NonNullable<BioenergyPrices["ethanol"]> }) {
  const e = ethanol.ethanol!;
  return (
    <article className={styles["card"]}>
      <div className={styles["head"]}>
        <h3>U.S. ethanol (plant gate)</h3>
        <span className={styles["tag"]}>Weekly · USDA</span>
      </div>
      <div>
        <div className={styles["price"]}>
          ${money(e.average, 2)}
          <small>per gallon</small>
        </div>
        <p className={styles["sub"]}>
          Average across {e.rows} state quotes, week of {day(ethanol.weekStart)} –{" "}
          {day(ethanol.weekEnd)}. Range ${money(e.low)}–${money(e.high)}.{" "}
          <Change value={pct(e.average, e.yearAgo)} label="vs a year ago" />
        </p>
      </div>
      <table className={styles["table"]}>
        <thead>
          <tr>
            <th>Product</th>
            <th>This week</th>
            <th>Year ago</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Ethanol ($/gal)</td>
            <td>${money(e.average)}</td>
            <td>{e.yearAgo ? `$${money(e.yearAgo)}` : "—"}</td>
          </tr>
          {ethanol.ddgs && (
            <tr>
              <td>Distillers grains, dried ($/short ton)</td>
              <td>${money(ethanol.ddgs.average, 0)}</td>
              <td>{ethanol.ddgs.yearAgo ? `$${money(ethanol.ddgs.yearAgo, 0)}` : "—"}</td>
            </tr>
          )}
          {ethanol.cornOil && (
            <tr>
              <td>Distillers corn oil (¢/lb)</td>
              <td>{money(ethanol.cornOil.average, 1)}¢</td>
              <td>{ethanol.cornOil.yearAgo ? `${money(ethanol.cornOil.yearAgo, 1)}¢` : "—"}</td>
            </tr>
          )}
        </tbody>
      </table>
      <p className={styles["source"]}>
        Simple average of the state averages printed in the report. Source:{" "}
        <a href={ethanol.sourcePage} target="_blank" rel="noopener noreferrer">
          USDA AMS National Weekly Ethanol Report (AMS 3616)
        </a>
        , published {day(ethanol.publishedAt)}. Distillers corn oil is a biodiesel and renewable
        diesel feedstock.
        {ethanol.stale
          ? " USDA could not be reached at the last check, so this is the last copy we saved."
          : ""}
      </p>
    </article>
  );
}

export function BioenergyPricesPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["bioenergy-prices"],
    queryFn: () => getBioenergyPricesFn(),
    staleTime: 30 * 60_000,
    refetchInterval: 60 * 60_000,
  });
  if (isLoading) {
    return (
      <p className={styles["status"]} role="status">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Loading official prices…
      </p>
    );
  }
  const lcfs = data?.lcfs?.months.length ? data.lcfs : null;
  const ethanol = data?.ethanol?.ethanol ? data.ethanol : null;
  if (!lcfs && !ethanol) {
    return (
      <p className={styles["status"]} role="status">
        CARB and USDA could not be reached right now. Please try again later.
      </p>
    );
  }
  return (
    <div className={styles["grid"]}>
      {lcfs && <LcfsCard lcfs={lcfs} />}
      {ethanol && <EthanolCard ethanol={ethanol} />}
    </div>
  );
}
