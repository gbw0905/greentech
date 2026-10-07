type Close = { t: number; c: number };
export type ComparisonPoint = Close & { other: number; value: number; otherValue: number };

// Match actual UTC trading dates before indexing both prices to the same starting close.
export function compareCloses(primary: Close[], secondary: Close[]): ComparisonPoint[] {
  const daily = (series: Close[]) => {
    const result = new Map<number, Close>();
    for (const point of series
      .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.c))
      .sort((a, b) => a.t - b.t)) {
      result.set(Math.floor(point.t / 86_400_000), point);
    }
    return result;
  };
  const other = daily(secondary);
  const shared = [...daily(primary)].flatMap(([day, point]) => {
    const match = other.get(day);
    return match ? [{ t: day * 86_400_000, c: point.c, other: match.c }] : [];
  });
  const first = shared[0];
  if (shared.length < 2 || !first || first.c === 0 || first.other === 0) return [];
  return shared.map((point) => ({
    ...point,
    value: (point.c / first.c) * 100,
    otherValue: (point.other / first.other) * 100,
  }));
}
