import assert from "node:assert/strict";
import test from "node:test";
import { activityToCi, changedInputs } from "../public/tools/workspace-activity.mjs";

test("annual activity converts to CI once on the finished-fuel energy basis", () => {
  const result = activityToCi(
    {
      feedstockTonnes: 50_000,
      feedstockFactorKgPerTonne: 12,
      transportTonnes: 50_000,
      transportKm: 100,
      transportFactorKgPerTonneKm: 0.08,
    },
    100_000_000,
  );
  assert.deepEqual(result, { errors: [], feedstock: 6, transport: 4 });
});

test("activity mode rejects missing factors instead of reporting a zero contribution", () => {
  const result = activityToCi(
    {
      feedstockTonnes: 50_000,
      feedstockFactorKgPerTonne: Number.NaN,
      transportTonnes: 50_000,
      transportKm: 100,
      transportFactorKgPerTonneKm: 0.08,
    },
    100_000_000,
  );
  assert.ok(result.errors.length);
  assert.equal(result.feedstock, undefined);
});

test("baseline change list distinguishes an electricity factor edit from unchanged values", () => {
  const start = {
    annualVolume: 100,
    energyDensity: 1,
    direct: { feedstock: 5 },
    energy: { electricity: 0.01 },
    factors: { electricity: 386 },
  };
  const next = { ...start, factors: { electricity: 100 } };
  assert.deepEqual(changedInputs(start, next), [
    { label: "Emission factor · electricity", previous: 386, current: 100 },
  ]);
});

test("baseline change list includes activity inputs and newly supplied values", () => {
  const before = {
    annualVolume: 1000,
    energyDensity: 120,
    activityData: { feedstockTonnes: 200, transportKm: NaN },
  };
  const after = {
    ...before,
    activityData: { feedstockTonnes: 250, transportKm: 80 },
  };
  const changes = changedInputs(before, after);
  assert.deepEqual(
    changes.map(({ label }) => label),
    ["Feedstock quantity · tonnes/year", "Haul distance · km"],
  );
});
