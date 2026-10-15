import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  assess,
  newScenario,
  changeBasis,
  applyOverrides,
  scopeContributions,
  PROGRAM,
} from "../public/tools/workspace-engine.mjs";
import { calculate, defaults, BTU_TO_MJ } from "../public/tools/credit-engine.mjs";
const close = (actual, expected) =>
  assert.ok(
    Math.abs(actual - expected) <= 1e-7 * Math.max(1, Math.abs(expected)),
    `${actual} != ${expected}`,
  );
const fixture = JSON.parse(
  fs.readFileSync(new URL("./fixtures/ci-defaults.json", import.meta.url)),
);
for (const expected of fixture)
  test("CI baseline " + expected.id, () => {
    const r = assess(newScenario(expected.id));
    assert.deepEqual(r.errors, []);
    close(r.ciTotal, expected.ci);
    close(r.annualEnergyMj, expected.annualEnergy);
    close(
      r.ciTotal,
      r.lineItems.reduce((s, x) => s + x.gPerMj, 0),
    );
    close(
      r.ciTotal,
      r.stages.reduce((s, x) => s + x.value, 0),
    );
  });
test("CI per-MJ / per-unit round trip preserves results", () => {
  const s = newScenario("rd-uco");
  close(assess(s).ciTotal, assess(changeBasis(s, "perUnit")).ciTotal);
  close(assess(s).ciTotal, assess(changeBasis(changeBasis(s, "perUnit"), "perMJ")).ciTotal);
});
test("CI custom annual emissions normalize once and reconcile", () => {
  const s = newScenario("rd-uco");
  const before = assess(s);
  s.customEmissions = [{ id: "a", activity: 20, factor: 3, fMass: "kg", aUnit: "unit", scope: 1 }];
  const r = assess(s);
  close(r.ciTotal, before.ciTotal + 60000 / r.annualEnergyMj);
  close(
    r.ciTotal,
    r.stages.reduce((a, x) => a + x.value, 0),
  );
});
test("CI rejects invalid custom mass unit and scope", () => {
  for (const fields of [{ fMass: "invalid" }, { scope: 99 }]) {
    const s = newScenario("rd-uco");
    s.customEmissions = [{ id: "a", activity: 20, factor: 3, fMass: "kg", scope: 1, ...fields }];
    assert(assess(s).errors.length);
  }
});
test("CI rejects invalid factors and negative production", () => {
  for (const change of [
    (s) => (s.factors.electricity = NaN),
    (s) => (s.energy.naturalGas = -1),
    (s) => (s.annualVolume = -1),
  ]) {
    const s = newScenario("rd-uco");
    change(s);
    assert(assess(s).errors.length);
  }
});
test("dairy default manure allocation is physically bounded", () => {
  const s = newScenario("rng-dairy"),
    i = s.dairy.inventory;
  for (let n = 0; n < i.livestock.length; n++)
    close(i.livestock[n].msAnaerobic + i.otherStorage.reduce((a, x) => a + x.fractions[n], 0), 1);
  assert.deepEqual(assess(s).errors, []);
});
test("dairy rejects manure allocation above 100%", () => {
  const s = newScenario("rng-dairy");
  s.dairy.inventory.livestock[0].msAnaerobic = 1;
  assert(assess(s).errors.length);
});
test("dairy rejects methane sent to upgrading above raw production", () => {
  const s = newScenario("rng-dairy");
  s.dairy.inventory.biogasToUpgradingScf = s.dairy.inventory.rawBiogasScf * 10;
  assert(assess(s).errors.length);
});
test("dairy ledger equations equal each displayed contribution", () => {
  const r = assess(newScenario("rng-dairy"));
  assert.deepEqual(r.errors, []);
  for (const row of r.lineItems)
    close(
      ((row.activity * row.factor) / (row.divisor || 1)) * (row.sign ?? 1) * (row.allocation ?? 1),
      row.gPerMj,
    );
  close(r.annualEnergyMj, (r.dairyResult.periodMj * 12) / 5);
});
test("signed stage overrides preserve negative credits", () => {
  const s = newScenario("rd-uco"),
    before = assess(s);
  s.overrides = { coProductCredit: { activity: -5 } };
  close(assess(s).ciTotal, before.ciTotal - 3);
});
test("stage overrides reject nonfinite data", () => {
  const s = newScenario("rd-uco");
  s.overrides = { electricity: { factor: Infinity } };
  assert(assess(s).errors.length);
});
test("zero stage allocation stays zero", () => {
  const s = newScenario("rd-uco"),
    r = assess(s);
  const row = { ...r.lineItems[0], activity: 0, allocation: 0, gPerMj: 0 };
  const base = { ...r, lineItems: [row], stages: [{ label: row.category, value: 0 }], ciTotal: 0 };
  s.overrides = { [row.key]: { activity: 10 } };
  close(applyOverrides(s, base).ciTotal, 0);
});
const credit = (overrides = {}) => ({ ...defaults(), dcode: "D4", ...overrides });
test("LCFS independently computed sample and signed deficit", () => {
  let s = credit(),
    r = calculate(s);
  close(r.lcfsTonnes, ((80.17 - 30) * 1000000 * 131) / 1e6);
  s.ci = 100;
  r = calculate(s);
  assert(r.lcfsTonnes < 0);
  close(r.lcfsTonnes, (80.17 - 100) * 131);
});
test("EER adjusts benchmark, not the entire CI difference", () => {
  close(calculate(credit({ eer: 2 })).lcfsTonnes, (80.17 * 2 - 30) * 131);
});
test("gallons and litres produce equivalent credits and RINs", () => {
  const a = calculate(credit()),
    b = calculate(credit({ unit: "litre", quantity: 3785411.784 }));
  close(a.lcfsTonnes, b.lcfsTonnes);
  close(a.rins, b.rins);
});
test("2026/2027 renewable diesel RIN factors", () => {
  close(calculate(credit()).rins, 1700000);
  close(calculate(credit({ year: 2027, mode: "rfs" })).rins, 1500000);
});
test("RNG LHV and HHV conversion / MJ equivalence", () => {
  const s = credit({ fuel: "rng", quantity: 77000, unit: "MMBtu", dcode: "D3" });
  close(calculate(s).rins, 1000000);
  close(calculate({ ...s, basis: "HHV" }).rins, 900000);
  close(calculate({ ...s, unit: "MJ", quantity: 77000 * 1e6 * BTU_TO_MJ }).rins, 1000000);
});
test("LCFS-only ignores blank RFS inputs", () => {
  const r = calculate(
    credit({ mode: "lcfs", customEV: NaN, evMode: "custom", rfsShare: NaN, rinPrice: NaN }),
  );
  assert.deepEqual(r.errors, []);
  assert.equal(r.ev, null);
});
test("RFS-only ignores blank LCFS inputs", () => {
  const r = calculate(
    credit({ mode: "rfs", ci: NaN, benchmark: NaN, lcfsShare: NaN, lcfsPrice: NaN, eer: NaN }),
  );
  assert.deepEqual(r.errors, []);
  close(r.rins, 1700000);
  assert.equal(r.delta, null);
  assert.equal(r.lcfsEnergy, null);
});
test("missing D-code stays unavailable, zero eligible quantity stays zero", () => {
  assert.equal(calculate(credit({ dcode: "" })).rins, null);
  const r = calculate(credit({ lcfsShare: 0, rfsShare: 0 }));
  assert.equal(r.rins, 0);
  assert.equal(r.lcfsTonnes, 0);
});
test("combined value requires genuine boolean confirmation", () => {
  assert.equal(calculate(credit()).combined, null);
  const r = calculate(credit({ lcfsConfirmed: true, rfsConfirmed: true }));
  close(r.combined, 2192920.25);
  assert(calculate(credit({ lcfsConfirmed: "false", rfsConfirmed: "false" })).errors.length);
});
test("reject malformed state and inherited property fuel names", () => {
  for (const s of [null, {}, credit({ fuel: "toString" })]) assert(calculate(s).errors.length);
});
test("negative/nonfinite inputs and percentages above 100 are rejected", () => {
  for (const invalid of [
    { quantity: -1 },
    { quantity: Infinity },
    { eer: 0 },
    { lcfsShare: 101 },
    { rfsShare: -1 },
    { rinPrice: -1 },
    { fuel: "rng", unit: "MMBtu", basis: "HHV", hhvToLhv: 1.1 },
  ])
    assert(calculate(credit(invalid)).errors.length);
});

test("gross scopes exclude credits and reconcile with the CI ledger", () => {
  const r = assess(newScenario("rng-dairy"));
  const parts = { 1: 0, 2: 0, 3: 0, adjustments: 0, unallocated: 0 };
  for (const row of r.lineItems)
    for (const [key, v] of Object.entries(scopeContributions(row))) parts[key] += v;
  close(parts[1] + parts[2] + parts[3], r.grossCi);
  close(parts.adjustments, r.creditsCi);
  close(
    Object.values(parts).reduce((a, x) => a + x, 0),
    r.ciTotal,
  );
  const i = newScenario("rng-dairy").dairy.inventory;
  close(
    parts[2],
    ((i.digesterGridKwh + i.upgradingGridKwh) * newScenario("rng-dairy").dairy.gridFactor) /
      r.dairyResult.periodMj,
  );
  assert(parts[1] > 0);
});

test("California, Oregon and Washington adopted 2026/2027 road-fuel standards", () => {
  const program = Object.fromEntries(PROGRAM.PROGRAMS.map((p) => [p.id, p]));
  assert.deepEqual(program.ca.bench, {
    2026: { gasoline: 75.16, diesel: 80.17 },
    2027: { gasoline: 73.72, diesel: 78.63 },
  });
  assert.deepEqual(program.or.bench, {
    2026: { gasoline: 84.92, diesel: 90.4 },
    2027: { gasoline: 82.99, diesel: 88.34 },
  });
  assert.deepEqual(program.wa.bench, {
    2026: { gasoline: 92, diesel: 93.1 },
    2027: { gasoline: 88.04, diesel: 89.1 },
  });
});

test("stage override overflow cannot silently retain an old result", () => {
  const s = newScenario("rd-uco"),
    r = assess(s);
  const row = r.lineItems.find((x) => x.activity > 0 && x.sign !== -1);
  s.overrides = { [row.key]: { activity: 1e308, factor: 1e308 } };
  assert(applyOverrides(s, r).errors.length);
});
test("stage override rejects a negative physical activity or emission factor", () => {
  const s = newScenario("rd-uco"),
    r = assess(s);
  const row = r.lineItems.find(
    (x) =>
      x.activity > 0 &&
      x.sign !== -1 &&
      !["coProductCredit", "processNonEnergy", "landUseChange"].includes(x.key),
  );
  for (const override of [{ activity: -1 }, { factor: -1 }]) {
    s.overrides = { [row.key]: override };
    assert(applyOverrides(s, r).errors.length);
  }
});
test("RFS-only liquid fuel still rejects nonpositive reported fuel energy", () => {
  for (const energy of [0, -1]) {
    const s = { ...defaults(), mode: "rfs", fuel: "bd", dcode: "D4", energy };
    assert(calculate(s).errors.length);
  }
});

test("stage overrides reject overflowing annual totals", () => {
  const s = newScenario("rd-uco"),
    r = assess(s);
  const row = r.lineItems.find((x) => x.activity > 0 && x.sign !== -1);
  s.overrides = { [row.key]: { activity: 1e200, factor: 1e100 } };
  assert(applyOverrides(s, { ...r, annualEnergyMj: 1e308 }).errors.length);
});

// Drafts are intentionally allowed to be incomplete; validation remains a Run concern.
import { encodeDraft, decodeDraft, readDraft, writeDraft } from "../public/tools/browser-draft.mjs";
test("browser drafts preserve unfinished inputs, zero, units and baseline", () => {
  const state = newScenario("rd-uco");
  state.annualVolume = NaN;
  state.direct.feedstock = 0;
  const baseline = newScenario("rd-uco");
  const draft = {
    state,
    baseline,
    ui: { ci: "g/MMBtu", mass: "kg" },
    pending: { id: "annualVolume", value: "" },
  };
  const restored = decodeDraft(encodeDraft(draft));
  assert.ok(Number.isNaN(restored.state.annualVolume));
  assert.equal(restored.state.direct.feedstock, 0);
  assert.equal(restored.pending.value, "");
  assert.equal(restored.ui.ci, "g/MMBtu");
  assert.deepEqual(restored.baseline, JSON.parse(JSON.stringify(baseline)));
});
test("autosave does not convert invalid numeric inputs to valid zeroes", () => {
  const restored = decodeDraft(
    encodeDraft({ blank: NaN, overflow: Infinity, negativeOverflow: -Infinity }),
  );
  assert.ok(Number.isNaN(restored.blank));
  assert.equal(restored.overflow, Infinity);
  assert.equal(restored.negativeOverflow, -Infinity);
});
test("draft reading and writing handle corrupt or unavailable storage", () => {
  const blocked = {
    getItem() {
      throw new Error("Blocked");
    },
    setItem() {
      throw new Error("Quota");
    },
  };
  assert.equal(
    readDraft(blocked, "test", () => true),
    null,
  );
  assert.equal(writeDraft(blocked, "test", {}), false);
  assert.equal(
    readDraft({ getItem: () => "{" }, "test", () => true),
    null,
  );
  assert.equal(
    readDraft({ getItem: () => '{"state":{}}' }, "test", (d) => Boolean(d.state.pathwayId)),
    null,
  );
});
test("baseline snapshot remains unchanged after a five-point CI improvement", () => {
  const state = newScenario("rd-uco");
  const baseline = structuredClone(state);
  const before = assess(baseline).ciTotal;
  state.direct.processNonEnergy -= 5;
  const after = assess(state).ciTotal;
  close(after - before, -5);
  close(assess(baseline).ciTotal, before);
});
