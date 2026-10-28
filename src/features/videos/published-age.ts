export function publishedAgeMinutes(value: string): number {
  const text = value.toLowerCase().replace(/\u00a0/g, " ");
  if (text.includes("yesterday")) return 24 * 60;
  if (text.includes("today") || text.includes("just now")) return 0;
  const match = text.match(
    /(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|weeks?|months?|mos?|years?|yrs?|[smhdwy])\b/,
  );
  if (!match) return Infinity;
  const amount = Number(match[1]);
  const unit = match[2]!;
  if (unit.startsWith("s")) return amount / 60;
  if (unit.startsWith("m") && unit !== "mo" && !unit.startsWith("mon")) return amount;
  if (unit.startsWith("h")) return amount * 60;
  if (unit.startsWith("d")) return amount * 24 * 60;
  if (unit.startsWith("w")) return amount * 7 * 24 * 60;
  if (unit.startsWith("mo")) return amount * 30 * 24 * 60;
  return amount * 365 * 24 * 60;
}
