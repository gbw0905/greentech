type DailyClose = { t: number; c: number };

const DAY = 86_400_000;
const utcDay = (timestamp: number) => Math.floor(timestamp / DAY) * DAY;

/** Compare the latest close with the last available close on/before N calendar days ago. */
export function windowChange(series: readonly DailyClose[], requestedDays: number) {
  const days = Number.isFinite(requestedDays)
    ? Math.max(1, Math.min(30, Math.round(requestedDays)))
    : 14;
  const daily = new Map<number, DailyClose>();
  for (const point of [...series].sort((a, b) => a.t - b.t)) {
    if (Number.isFinite(point.t) && Number.isFinite(point.c)) daily.set(utcDay(point.t), point);
  }
  const closes = [...daily.values()];
  const latest = closes.at(-1);
  if (!latest || closes.length < 2) return null;

  const target = utcDay(latest.t) - days * DAY;
  const baseline = [...closes].reverse().find((point) => utcDay(point.t) <= target) ?? closes[0]!;
  const change = latest.c - baseline.c;
  return {
    days,
    baseline,
    latest,
    change,
    changePct: baseline.c === 0 ? null : (change / Math.abs(baseline.c)) * 100,
    elapsedDays: (utcDay(latest.t) - utcDay(baseline.t)) / DAY,
    partial: utcDay(baseline.t) > target,
  };
}
