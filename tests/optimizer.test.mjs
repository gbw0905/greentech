import test from "node:test";
import assert from "node:assert/strict";
import {
  PATHWAYS,
  defaultInputs,
  analyze,
  capitalRecovery,
  contributions,
  gasFraction,
  scenario,
  sensitivity,
  solveTarget,
  validateInputs,
  regulatoryRows,
} from "../src/features/optimizer/engine.ts";
const close = (a, b) =>
  assert.ok(Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(b)), `${a} != ${b}`);
test("GBW reference RD-UCO sample preserves baseline, optimum and economics", () => {
  const input = defaultInputs(),
    a = analyze(input);
  close(a.baseline.ci, 16.326);
  close(a.focus.ci, 13.548);
  assert.deepEqual(a.focus.measures, ["ppa", "tuning"]);
  close(a.focus.capex, 150000);
  close(a.focus.opex, 38000);
  close(a.focus.creditValue, 2498325);
  close(a.focus.netBenefit, 48650.568259597);
  assert.equal(a.all.filter((s) => s.pareto).length, 9);
  assert.equal(a.all.length, 16);
  assert.equal(new Set(a.all.map((s) => s.key)).size, 16);
});
for (const p of PATHWAYS)
  test(`preset and optimizer reconciliation: ${p.id}`, () => {
    const input = defaultInputs(p.id),
      a = analyze(input);
    close(a.baseline.ci, p.ci);
    close(a.baseline.ci + a.waterfall.reduce((s, x) => s + x.delta, 0), a.focus.ci);
    assert.ok(a.all.every((s) => Number.isFinite(s.netBenefit)));
    const feasible = a.all.filter((s) => s.feasible);
    if (feasible.length) {
      assert.ok(a.recommended);
      close(a.recommended.annualized, Math.min(...feasible.map((s) => s.annualized)));
    } else assert.equal(a.recommended, null);
    for (const s of a.all)
      close(s.ci, s.parts.fixed + s.parts.ng + s.parts.elec + s.parts.transport);
  });
test("heat recovery and tuning compound rather than add", () => {
  close(gasFraction(defaultInputs(), ["heat", "tuning"]), 0.765);
});
test("capital recovery handles zero discount rate and long lifetimes", () => {
  close(capitalRecovery(0, 15), 1 / 15);
  close(capitalRecovery(8, 15), 0.11682954493602008);
  close(capitalRecovery(8, 100000), 0.08);
});
test("negative CI and infeasible targets remain representable", () => {
  const i = defaultInputs();
  i.target = -100;
  const a = analyze(i);
  assert.equal(a.recommended, null);
  close(a.focus.ci, Math.min(...a.all.map((s) => s.ci)));
});
test("target already met can recommend baseline", () => {
  const i = defaultInputs();
  i.target = 30;
  assert.equal(analyze(i).focus.key, "baseline");
});
test("negative costs, nonfinite numbers, zero denominator and invalid percentages are rejected", () => {
  for (const i of [
    { ...defaultInputs(), volumeMj: 0 },
    { ...defaultInputs(), lifeYears: 0 },
    { ...defaultInputs(), feedstockAdj: NaN },
    { ...defaultInputs(), ppaPremium: -1 },
    { ...defaultInputs(), heatPct: 101 },
    { ...defaultInputs(), target: Infinity },
  ])
    assert.ok(validateInputs(i).length);
  const i = defaultInputs();
  i.costs.rail.opex = -1;
  assert.ok(validateInputs(i).length);
});
test("solver reaches CI boundary for gas, electricity and haul distance", () => {
  for (const variable of ["ng", "kwh", "km"]) {
    const i = defaultInputs();
    i.target = 18;
    const r = solveTarget(i, variable);
    assert.ok(r.feasible);
    close(contributions({ ...i, [variable]: r.value }, []).total, 18);
  }
});
test("renewable solver handles zero emission factors, impossible and already-met targets", () => {
  const i = defaultInputs();
  i.target = 15;
  const r = solveTarget(i, "renewable");
  assert.ok(r.feasible);
  close(
    i.ng * 63 +
      contributions(i, []).fixed +
      contributions(i, []).transport +
      i.kwh * i.gridCi * (1 - r.value / 100),
    15,
  );
  assert.equal(solveTarget({ ...i, target: -100 }, "renewable").feasible, false);
  assert.equal(solveTarget({ ...i, target: 30 }, "renewable").value, 0);
  const z = solveTarget({ ...i, kwh: 0, target: 30 }, "renewable");
  assert.equal(z.value, 0);
  const free = solveTarget({ ...i, gridCi: 0, target: 30 }, "kwh");
  assert.equal(free.value, null);
  assert.equal(free.feasible, true);
});
test("zero sensitivity reconciles to zero and recommended measures stay fixed", () => {
  for (const s of sensitivity(defaultInputs(), ["ppa", "tuning"], 0)) {
    close(s.ciLo, 0);
    close(s.ciHi, 0);
    close(s.nbLo, 0);
    close(s.nbHi, 0);
  }
});
test("annual energy scales credit value and gas savings; PPA premium is incremental", () => {
  const i = defaultInputs();
  const a = scenario(i, ["ppa"]);
  close(a.opex, i.kwh * i.volumeMj * i.ppaPremium);
  close(scenario({ ...i, volumeMj: i.volumeMj * 2 }, ["ppa"]).creditValue, a.creditValue * 2);
});
test("regulatory reference reuses corrected Oregon standard from the existing workspace", () => {
  const r = regulatoryRows(defaultInputs(), 13.548).find((p) => p.id === "or");
  close(r.benchmark, 90.4);
});
