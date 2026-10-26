import test from "node:test";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
const { Workbook } = ExcelJS;
import { applyCreditFormulas } from "../src/features/ci-workspace/credit-workbook-formulas.ts";
import { prepareOptimizerFormulas } from "../src/features/optimizer/workbook-formulas.ts";
import { FIELD_LABELS } from "../src/features/optimizer/fields.ts";
import {
  PATHWAYS,
  MEASURES,
  defaultInputs,
  analyze,
  regulatoryRows,
  sensitivity,
  scenario,
} from "../src/features/optimizer/engine.ts";
import { defaults, calculate } from "../public/tools/credit-engine.mjs";

export function creditBook(state) {
  const result = calculate(state),
    book = new Workbook();
  assert.deepEqual(result.errors, []);
  for (const name of ["Overview", "Executive summary", "Scenario", "Results", "Conversion factors"])
    book.addWorksheet(name);
  const scenario = book.getWorksheet("Scenario");
  scenario.addRows([
    ["Input", "Value"],
    ["Fuel", state.fuel],
    ["Version", "test"],
    ["Reviewed", "test"],
    ...Object.entries(state),
  ]);
  book
    .getWorksheet("Results")
    .addRows([
      ["Metric", "Value"],
      ...Object.entries(result).map(([k, v]) => [k, Array.isArray(v) ? v.join(" | ") : v]),
    ]);
  book.getWorksheet("Conversion factors").addRows([
    ["Factor", "Value"],
    ["Btu to MJ", 0.00105505585262],
    ["Litres per gallon", 3.785411784],
  ]);
  for (const sheet of book.worksheets)
    if (sheet.name !== "Overview") sheet.spliceRows(1, 0, [], [], [], []);
  applyCreditFormulas(book, state, result);
  return { book, result };
}
export function optimizerBook(input) {
  const analysis = analyze(input),
    book = new Workbook();
  for (const name of [
    "Overview",
    "Scenario inputs",
    "Scenarios",
    "Abatement ranking",
    "CI waterfall",
    "Sensitivity",
    "Regulatory context",
    "Evidence",
  ])
    book.addWorksheet(name);
  book.getWorksheet("Scenario inputs").addRows([
    ["Input", "Value", "Unit"],
    ["Pathway", input.pathwayId],
    ...Object.entries(FIELD_LABELS).map(([key, [label, unit]]) => [label, input[key], unit]),
    ...MEASURES.flatMap((m) => [
      [`${m.name} capital`, input.costs[m.id].capex, "USD"],
      [`${m.name} operating cost`, input.costs[m.id].opex, "USD/year"],
    ]),
  ]);
  book
    .getWorksheet("Scenarios")
    .addRows([
      ["Scenario", "CI", "Capital", "Opex", "Annualized", "Credit", "Net", "Target", "Pareto"],
      ...analysis.all.map((s) => [
        s.name,
        s.ci,
        s.capex,
        s.opex,
        s.annualized,
        s.creditValue,
        s.netBenefit,
        s.feasible ? "Yes" : "No",
        s.pareto ? "Yes" : "No",
      ]),
    ]);
  for (const [name, rows] of Object.entries({
    "Abatement ranking": analysis.mac.map((s) => [s.name, s.dCi, s.avoidedT, s.annualized, s.mac]),
    "CI waterfall": [
      ["Baseline", analysis.baseline.ci, analysis.baseline.ci, 0],
      ...analysis.waterfall.map((s) => [s.name, s.from, s.to, s.delta]),
      ["Final CI", analysis.focus.ci, analysis.focus.ci, 0],
    ],
    Sensitivity: sensitivity(input, analysis.focus.measures, 20).map((s) => [
      s.label,
      s.ciLo,
      s.ciHi,
      s.nbLo,
      s.nbHi,
    ]),
    "Regulatory context": regulatoryRows(input, analysis.focus.ci).map((s) => [
      s.name,
      s.benchmark,
      s.gap,
      s.saving,
      s.kind,
      s.url,
    ]),
    Evidence: [["Source", "test"]],
  }))
    book.getWorksheet(name).addRows([["Header"], ...rows]);
  const apply = prepareOptimizerFormulas(book, input, analysis);
  for (const sheet of book.worksheets)
    if (sheet.name !== "Overview") sheet.spliceRows(1, 0, [], [], [], []);
  apply();
  return { book, analysis };
}
async function saveRecalculationFixture(book, name, changes = []) {
  if (!process.env.REPORT_FORMULA_CHECK_DIR) return;
  const base = process.env.REPORT_FORMULA_CHECK_DIR + "/" + name;
  await book.xlsx.writeFile(base + ".xlsx");
  const expected = [];
  for (const sheet of book.worksheets)
    sheet.eachRow((row) =>
      row.eachCell((cell) => {
        if (cell.formula)
          expected.push({ sheet: sheet.name, cell: cell.address, value: cell.result ?? "" });
      }),
    );
  await writeFile(base + ".json", JSON.stringify({ expected, changes }));
}
function referencesExist(book) {
  for (const sheet of book.worksheets)
    sheet.eachRow((row) =>
      row.eachCell((cell) => {
        if (!cell.formula) return;
        assert(
          !/undefined|#REF!/.test(cell.formula),
          `${sheet.name}!${cell.address}: ${cell.formula}`,
        );
        for (const match of cell.formula.matchAll(/'([^']+)'!\$?([A-Z]+)\$?(\d+)/g)) {
          const source = book.getWorksheet(match[1]);
          assert(source, match[1]);
          assert.notEqual(
            source.getCell(match[2] + match[3]).value,
            null,
            `${sheet.name}!${cell.address} references empty ${match[0]}`,
          );
        }
      }),
    );
}
for (const fuel of ["rd", "bd", "ethanol", "rng"])
  for (const mode of ["both", "rfs", "lcfs"]) {
    test(`Credit formulas preserve ${fuel}/${mode} results and null eligibility`, async () => {
      const state = {
        ...defaults(),
        fuel,
        mode,
        unit: fuel === "rng" ? "MMBtu" : "litre",
        basis: "HHV",
        dcode: "D4",
        lcfsConfirmed: true,
        rfsConfirmed: true,
      };
      const { book, result } = creditBook(state);
      await saveRecalculationFixture(book, `credit-${fuel}-${mode}`, [
        {
          sheet: "Scenario",
          cell: "B" + (Object.keys(state).indexOf("quantity") + 9),
          value: state.quantity * 2,
          checks: [
            {
              sheet: "Overview",
              cell: "D7",
              value: calculate({ ...state, quantity: state.quantity * 2 }).rins ?? "",
            },
          ],
        },
      ]);
      referencesExist(book);
      for (const key of ["rins", "energyMj", "combined", "lcfsTonnes"]) {
        const row = Object.keys(result).indexOf(key) + 6;
        const cell = book.getWorksheet("Results").getCell(row, 2);
        assert(cell.formula);
        assert.equal(cell.result, result[key] ?? "");
      }
      const restored = new Workbook();
      await restored.xlsx.load(await book.xlsx.writeBuffer());
      assert.equal(
        restored.getWorksheet("Overview").getCell("D7").formula,
        book.getWorksheet("Overview").getCell("D7").formula,
      );
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(await book.xlsx.writeBuffer());
      assert.match(await zip.file("xl/workbook.xml").async("string"), /fullCalcOnLoad="1"/);
    });
  }
for (const patch of [
  { dcode: "" },
  { energy: 100, dcode: "D4" },
  { dcode: "D4", lcfsConfirmed: false },
  { dcode: "D4", year: 2027, benchmarkMode: "custom" },
  { dcode: "D4", evMode: "custom", customEV: 1.23 },
  { dcode: "D4", ci: 100 },
])
  test(`Credit boundary ${JSON.stringify(patch)}`, () => {
    const { book, result } = creditBook({ ...defaults(), ...patch });
    assert.equal(book.getWorksheet("Overview").getCell("G7").result, result.combined ?? "");
    assert.equal(book.getWorksheet("Executive summary").getCell("B8").result, result.rins ?? "");
    referencesExist(book);
  });
for (const p of PATHWAYS)
  test(`Optimizer formulas preserve results: ${p.id}`, async () => {
    const { book, analysis } = optimizerBook(defaultInputs(p.id));
    if (p.id === "rd-uco")
      await saveRecalculationFixture(book, "optimizer", [
        {
          sheet: "Scenario inputs",
          cell: "B14",
          value: 1000000000,
          checks: [
            {
              sheet: "Overview",
              cell: "G7",
              value: analyze({ ...defaultInputs(), volumeMj: 1000000000 }).focus.netBenefit,
            },
          ],
        },
        {
          sheet: "Scenario inputs",
          cell: "B7",
          value: -100,
          checks: [
            {
              sheet: "Overview",
              cell: "A7",
              value: analyze({ ...defaultInputs(), volumeMj: 1000000000, target: -100 }).focus.ci,
            },
          ],
        },
        {
          sheet: "Scenario inputs",
          cell: "B18",
          value: 0,
          checks: [
            {
              sheet: "Overview",
              cell: "G7",
              value: analyze({
                ...defaultInputs(),
                volumeMj: 1000000000,
                target: -100,
                discountRate: 0,
              }).focus.netBenefit,
            },
          ],
        },
        {
          sheet: "Scenario inputs",
          cell: "B7",
          value: 100,
          checks: [
            {
              sheet: "Overview",
              cell: "A7",
              value: analyze({
                ...defaultInputs(),
                volumeMj: 1000000000,
                target: 100,
                discountRate: 0,
              }).focus.ci,
            },
            {
              sheet: "CI waterfall",
              cell: "C11",
              value: analyze({
                ...defaultInputs(),
                volumeMj: 1000000000,
                target: 100,
                discountRate: 0,
              }).focus.ci,
            },
            ...sensitivity(defaultInputs(), analysis.focus.measures, 20).flatMap((v, i) => {
              const changed = {
                ...defaultInputs(),
                volumeMj: 1000000000,
                target: 100,
                discountRate: 0,
              };
              const focus = analyze(changed).focus;
              const low = scenario({ ...changed, [v.key]: changed[v.key] * 0.8 }, focus.measures);
              return [
                { sheet: "Sensitivity", cell: `B${i + 6}`, value: low.ci - focus.ci },
                {
                  sheet: "Sensitivity",
                  cell: `D${i + 6}`,
                  value: low.netBenefit - focus.netBenefit,
                },
              ];
            }),
          ],
        },
        {
          sheet: "Scenario inputs",
          cell: "B7",
          value: -100,
          checks: [
            {
              sheet: "Overview",
              cell: "A7",
              value: analyze({
                ...defaultInputs(),
                volumeMj: 1000000000,
                target: -100,
                discountRate: 0,
              }).focus.ci,
            },
            {
              sheet: "CI waterfall",
              cell: "C11",
              value: analyze({
                ...defaultInputs(),
                volumeMj: 1000000000,
                target: -100,
                discountRate: 0,
              }).focus.ci,
            },
          ],
        },
      ]);
    referencesExist(book);
    analysis.all.forEach((s, i) => {
      const row = book.getWorksheet("Scenarios").getRow(i + 6);
      [s.ci, s.capex, s.opex, s.annualized, s.creditValue, s.netBenefit].forEach((v, j) => {
        assert(row.getCell(j + 2).formula);
        assert.equal(row.getCell(j + 2).result, v);
      });
    });
    assert.equal(book.getWorksheet("Overview").getCell("A7").result, analysis.focus.ci);
    const waterfall = book.getWorksheet("CI waterfall");
    assert.equal(waterfall.getCell("C11").result, analysis.focus.ci);
    assert.equal(waterfall.rowCount, 11);
    for (let row = 7; row <= 10; row++) assert.match(waterfall.getCell(`C${row}`).formula, /MATCH/);
    const support = book.getWorksheet("Sensitivity calculations");
    assert.match(support.getCell("J6").formula, /MATCH/);
    assert.match(book.getWorksheet("Sensitivity").getCell("D6").formula, /MATCH/);
  });
test("Optimizer zero interest, no target met, and saved formula references", async () => {
  const { book, analysis } = optimizerBook({ ...defaultInputs(), discountRate: 0, target: -100 });
  assert.equal(analysis.recommended, null);
  assert.equal(book.getWorksheet("Scenarios").getCell("S6").result, 1 / 15);
  const restored = new Workbook();
  await restored.xlsx.load(await book.xlsx.writeBuffer());
  referencesExist(restored);
  assert.match(restored.getWorksheet("Overview").getCell("A7").formula, /MATCH/);
});
