import assert from "node:assert/strict";
import { test } from "node:test";
import { windowChange } from "./window-change.ts";

const close = (day: string, c: number) => ({ t: Date.parse(day + "T20:00:00Z"), c });

test("14 calendar days uses dated closes, not the 14th trading observation", () => {
  const result = windowChange(
    [close("2026-09-01", 80), close("2026-09-15", 100), close("2026-09-29", 110)],
    14,
  )!;
  assert.equal(result.baseline.c, 100);
  assert.equal(result.change, 10);
  assert.equal(result.changePct, 10);
  assert.equal(result.elapsedDays, 14);
  assert.equal(result.partial, false);
});

test("non-trading dates use the previous available close", () => {
  const result = windowChange([close("2026-10-02", 100), close("2026-10-05", 95)], 1)!;
  assert.equal(result.elapsedDays, 3);
  assert.equal(result.changePct, -5);
  assert.equal(result.partial, false);
});

test("short history is explicitly partial and never invents a 30-day quote", () => {
  const result = windowChange([close("2026-09-08", 90), close("2026-10-05", 90)], 30)!;
  assert.equal(result.days, 30);
  assert.equal(result.elapsedDays, 27);
  assert.equal(result.partial, true);
  assert.equal(result.changePct, 0);
});

test("empty, invalid and one-date histories cannot produce a change", () => {
  assert.equal(windowChange([], 14), null);
  assert.equal(windowChange([{ t: NaN, c: 10 }, close("2026-10-05", 20)], 14), null);
  assert.equal(windowChange([close("2026-10-05", 20), close("2026-10-05", 21)], 14), null);
});

test("sorts without mutation, keeps the latest quote per UTC date, and guards zero", () => {
  const points = [close("2026-10-05", 10), close("2026-10-01", 5), close("2026-10-01", 0)];
  const original = structuredClone(points);
  const result = windowChange(points, 4)!;
  assert.equal(result.baseline.c, 0);
  assert.equal(result.change, 10);
  assert.equal(result.changePct, null);
  assert.deepEqual(points, original);
});

test("keeps selections within 1–30 days", () => {
  const points = [close("2026-09-01", 100), close("2026-10-01", 150)];
  assert.equal(windowChange(points, 0)?.days, 1);
  assert.equal(windowChange(points, 31)?.days, 30);
  assert.equal(windowChange(points, NaN)?.days, 14);
});
