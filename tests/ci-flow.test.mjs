import test from "node:test";
import assert from "node:assert/strict";
import { buildCiFlow, renderCiFlow } from "../public/tools/ci-flow.mjs";
import { assess, newScenario, PRESETS } from "../public/tools/workspace-engine.mjs";
for (const id of ["rng-dairy", ...PRESETS.map((p) => p.id)]) {
  test(`CI flow reconciles every ledger row: ${id}`, () => {
    const result = assess(newScenario(id));
    assert.deepEqual(result.errors, []);
    const model = buildCiFlow(result);
    assert.equal(model.reconciled, true);
    const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7);
    close(
      model.groups.reduce((a, g) => a + g.value, 0),
      result.grossCi,
    );
    close(
      model.sources.reduce((a, g) => a + g.value, 0),
      result.grossCi,
    );
    close(model.gross + model.adjustments, result.ciTotal);
    assert.ok(model.sources.every((s) => s.value > 0));
    const html = renderCiFlow(result);
    assert.ok(!/NaN|Infinity/.test(html));
  });
}
test("Zero and negative-only scenarios do not create negative-width flows", () => {
  for (const n of [0, -200]) {
    const r = {
      lineItems: [{ label: "<unsafe>", gPerMj: n }],
      grossCi: 0,
      creditsCi: n,
      ciTotal: n,
      pathway: { id: "test", label: "Test" },
    };
    const html = renderCiFlow(r);
    assert.ok(!html.includes("ci-flow-svg"));
    assert.ok(!html.includes("<unsafe>"));
    assert.ok(html.includes("No positive emissions"));
    assert.equal(buildCiFlow(r).reconciled, true);
  }
});
test("Reconciliation detects mismatched headline totals", () => {
  const r = assess(newScenario("rd-uco"));
  assert.equal(buildCiFlow({ ...r, ciTotal: r.ciTotal + 1 }).reconciled, false);
});
test("Dense groups retain every source in the Other group", () => {
  const rows = Array.from({ length: 20 }, (_, i) => ({
    label: `Source ${i}`,
    category: "Process energy",
    gPerMj: i + 1,
  }));
  const r = { lineItems: rows, grossCi: 210, creditsCi: 0, ciTotal: 210 };
  const m = buildCiFlow(r);
  assert.equal(m.sources.length, 4);
  assert.equal(m.sources.flatMap((s) => s.rows).length, 20);
});
