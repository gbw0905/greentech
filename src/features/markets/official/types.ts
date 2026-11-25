/**
 * Shared shapes for the official (public-domain government) price data that
 * replaced the unofficial Yahoo Finance feed. Safe to import from client code.
 */

export interface PricePoint {
  /** UTC midnight of the observation date, in ms. */
  t: number;
  c: number;
}

export interface OfficialSeries {
  id: string;
  /** Full daily history, oldest first. */
  points: PricePoint[];
  /** EIA "Release Date" for the page, ms (UTC midnight). */
  releasedAt: number | null;
  sourceUrl: string;
}

export interface LcfsMonth {
  /** e.g. "Aug-26" as printed by CARB. */
  period: string;
  /** UTC ms of the first day of the month. */
  t: number;
  transfers: number;
  volumeMt: number;
  avgPrice: number;
}

export interface LcfsReport {
  /** Month the report covers, e.g. "August 2026". */
  reportMonth: string;
  postedAt: number | null;
  months: LcfsMonth[];
  quarters: Array<{ period: string; avgPrice: number; volumeMt: number }>;
  years: Array<{ period: string; avgPrice: number; volumeMt: number }>;
  priceRange: { low: number; high: number } | null;
  sourceUrl: string;
  sourcePage: string;
}

export interface UsdaPriceLine {
  /** Average of the per-state "Average" column. */
  average: number;
  /** Average of the per-state "Year Ago" column where printed. */
  yearAgo: number | null;
  low: number;
  high: number;
  rows: number;
  unit: string;
}

export interface UsdaEthanolReport {
  /** "Report for 11/9/2026 - 11/13/2026" → start/end UTC ms. */
  weekStart: number | null;
  weekEnd: number | null;
  publishedAt: number | null;
  ethanol: UsdaPriceLine | null;
  ddgs: UsdaPriceLine | null;
  cornOil: UsdaPriceLine | null;
  sourceUrl: string;
  sourcePage: string;
}
