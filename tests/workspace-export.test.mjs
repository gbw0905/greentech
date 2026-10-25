import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildWorkspaceSpec,
  layoutWorkspaceSpec,
} from "../src/features/ci-workspace/workbook-model.ts";
import { createWorkspaceWorkbook } from "../src/features/ci-workspace/workbook-renderer.ts";
import { buildWorkspacePayload } from "../public/tools/workspace-export.mjs";
import {
  newScenario,
  assess,
  PRESETS,
  changeBasis,
  PROGRAM,
} from "../public/tools/workspace-engine.mjs";

const close = (actual, expected) =>
  assert.ok(
    Math.abs(actual - expected) <= 1e-8 * Math.max(1, Math.abs(expected)),
    `${actual} != ${expected}`,
  );
for (const id of ["rng-dairy", ...PRESETS.map((p) => p.id)]) {
  test(`Excel reproduces every ledger row and keeps all source data: ${id}`, () => {
    const scenario = newScenario(id);
    const result = assess(scenario);
    const payload = buildWorkspacePayload(scenario, result);
    const spec = layoutWorkspaceSpec(buildWorkspaceSpec(payload));
    assert.deepEqual(
      spec.sheets.map((s) => s.name),
      ["Calculation", "Inputs", "Emission factors", "Global factor library", "Keys"],
    );
    const cells = spec.sheets.flatMap((s) => s.sections.flatMap((section) => section.rows));
    for (const [index, item] of result.lineItems.entries()) {
      const row = cells.find((r) => r.key === `line-${index}`);
      close(row.cells[8].result, item.gPerMj);
      close(row.cells[9].result, (item.gPerMj * result.annualEnergyMj) / 1e6);
      assert.match(row.cells[8].formula, /^C\d+\*E\d+\/G\d+\*H\d+$/);
      assert.match(row.cells[2].formula, /^'Inputs'!B\d+$/);
      assert.match(row.cells[4].formula, /^'Emission factors'!C\d+$/);
      assert.match(row.cells[11].result, /^=C\d+\*E\d+\/G\d+\*H\d+$/);
    }
    close(cells.find((r) => r.key === "ciTotal").cells[1].result, result.ciTotal);
    const library = spec.sheets
      .find((s) => s.name === "Global factor library")
      .sections.flatMap((s) => s.rows);
    assert.equal(library.length, payload.library.length);
    assert.deepEqual(
      library.map((r) => JSON.stringify(r.cells)).sort(),
      payload.library
        .map((r) => JSON.stringify([r.item, r.detail, r.value, r.unit, r.source]))
        .sort(),
    );
    for (const row of cells)
      for (const cell of row.cells)
        if (cell && typeof cell === "object") {
          assert(!cell.formula.includes("{{"));
          assert(typeof cell.result === "string" || Number.isFinite(cell.result));
        }
  });
}
test("Signed custom emissions and stage overrides are not double-negated", () => {
  const s = newScenario("rd-uco");
  s.overrides = { coProductCredit: { activity: -5 } };
  s.customEmissions = [
    {
      id: "removal",
      label: "Removal",
      activity: 20,
      factor: -3,
      fMass: "kg",
      aUnit: "unit",
      scope: 3,
    },
  ];
  const spec = buildWorkspaceSpec(buildWorkspacePayload(s));
  const lines = spec.sheets[0].sections
    .flatMap((s) => s.rows)
    .filter((r) => r.key?.startsWith("line-"));
  close(lines.at(-1).cells[8].result, -60000 / assess(s).annualEnergyMj);
});
test("Per-unit process inputs retain the correct normalisation", () => {
  const s = changeBasis(newScenario("rd-uco"), "perUnit");
  const spec = buildWorkspaceSpec(buildWorkspacePayload(s));
  close(spec.sheets[0].sections[0].rows[2].cells[1].result, assess(s).ciTotal);
});
test("An inconsistent payload is rejected instead of exporting an incorrect formula", () => {
  const p = buildWorkspacePayload(newScenario("rd-uco"));
  p.lines[0].gPerMj += 1;
  assert.throws(() => buildWorkspaceSpec(p), /do not reconcile/);
});
test("Program delivery shares and explicit approved-CI overrides are preserved", () => {
  const s = newScenario("rd-uco");
  s.programs = PROGRAM.settings();
  s.programs.rows.ca.share = 35;
  s.programs.rows.or.share = 20;
  s.programs.rows.cfr.share = 10;
  s.programs.rows.cfr.ci = 40;
  const payload = buildWorkspacePayload(s);
  const spec = buildWorkspaceSpec(payload);
  const comparison = spec.sheets[0].sections.find(
    (x) => x.title === "Regulatory program comparison",
  );
  for (const [i, row] of comparison.rows.entries())
    if (payload.programs[i].supported)
      close(
        row.cells[4].result,
        ((payload.programs[i].benchmark - payload.programs[i].ci) * payload.programs[i].energy) /
          1e6,
      );
  const assumptions = spec.sheets[1].sections.find((x) => x.title === "Program assumptions");
  assert.equal(assumptions.rows.find((x) => x.key === "program-ci-override-3").cells[1], 40);
  assert.equal(assumptions.rows.find((x) => x.key === "program-ci-override-0").cells[1], "");
});
test("Saved XLSX retains formulas, cached numbers, logo, formats and cross-sheet references", async () => {
  const { default: ExcelJS } = await import("exceljs");
  const spec = buildWorkspaceSpec(buildWorkspacePayload(newScenario("rng-dairy")));
  const bytes = await readFile(new URL("../src/assets/logo.png", import.meta.url));
  const logo = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const { book, layout } = await createWorkspaceWorkbook(spec, logo);
  const output = await book.xlsx.writeBuffer();
  const restored = new ExcelJS.Workbook();
  await restored.xlsx.load(output);
  assert.equal(restored.worksheets.length, 5);
  for (const sheet of restored.worksheets) assert.equal(sheet.getImages().length, 1);
  const [name, address] = layout.refs.get("ciTotal").split("!");
  const total = restored.getWorksheet(name.replaceAll("'", "")).getCell(address);
  assert.match(total.formula, /SUM\(/);
  close(total.result, assess(newScenario("rng-dairy")).ciTotal);
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(output);
  assert.match(await zip.file("xl/workbook.xml").async("string"), /fullCalcOnLoad="1"/);
});
