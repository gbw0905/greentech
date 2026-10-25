import assert from "node:assert/strict";
import { test } from "node:test";
import { compareCloses } from "./comparison.ts";
const close = (day: string, c: number, hour = "20") => ({
  t: Date.parse(`${day}T${hour}:00:00Z`),
  c,
});

test("aligns UTC dates and indexes different units from the same shared start", () => {
  const primary = [close("2026-10-01", 80), close("2026-10-02", 100), close("2026-10-05", 110)];
  const secondary = [close("2026-10-02", 1000, "21"), close("2026-10-05", 900, "21")];
  const original = structuredClone(primary);
  const result = compareCloses(primary, secondary);
  assert.equal(result[0]!.value, 100);
  assert.equal(result[0]!.otherValue, 100);
  assert.ok(Math.abs(result[1]!.value - 110) < 1e-10);
  assert.equal(result[1]!.otherValue, 90);
  assert.equal(result[0]!.t, Date.parse("2026-10-02T00:00:00Z"));
  assert.deepEqual(primary, original);
});
test("does not pair different dates, fabricate history, or divide by zero", () => {
  assert.deepEqual(compareCloses([], []), []);
  assert.deepEqual(compareCloses([close("2026-10-01", 5)], [close("2026-10-02", 6)]), []);
  const primary = [close("2026-10-01", 0), close("2026-10-02", 10)];
  assert.deepEqual(compareCloses(primary, primary), []);
});
test("sorts, rejects invalid points and uses the latest close on duplicate dates", () => {
  const result = compareCloses(
    [
      close("2026-10-02", 12),
      close("2026-10-01", 5),
      close("2026-10-01", 6, "21"),
      { t: NaN, c: 10 },
    ],
    [close("2026-10-01", 10), close("2026-10-02", 15), close("2026-10-03", NaN)],
  );
  assert.deepEqual(
    result.map((p) => [p.value, p.otherValue]),
    [
      [100, 100],
      [200, 150],
    ],
  );
});

test("aligns coarse long-range histories by month when exchanges close on different dates", () => {
  const primary = [close("2025-01-02", 80), close("2025-04-01", 100)];
  const secondary = [close("2025-01-03", 200), close("2025-04-02", 180)];
  assert.deepEqual(compareCloses(primary, secondary), []);
  const result = compareCloses(primary, secondary, true);
  assert.deepEqual(
    result.map((point) => [point.value, point.otherValue]),
    [
      [100, 100],
      [125, 90],
    ],
  );
});
