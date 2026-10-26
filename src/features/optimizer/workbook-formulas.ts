import type { Workbook, Worksheet } from "exceljs";
import { FIELD_LABELS } from "./fields.ts";
import {
  MEASURES,
  pathwayFor,
  scenario,
  sensitivity,
  capitalRecovery,
  type Inputs,
  type Analysis,
  type MeasureId,
  type Scenario,
} from "./engine.ts";

/** Add supporting calculations before branding, then write formulas at their final addresses. */
export function prepareOptimizerFormulas(book: Workbook, input: Inputs, analysis: Analysis) {
  const inputs = book.getWorksheet("Scenario inputs")!;
  const refs: Record<string, string> = {};
  Object.keys(FIELD_LABELS).forEach((key, i) => {
    refs[key] = `'Scenario inputs'!$B$${i + 7}`;
  });
  const p = pathwayFor(input.pathwayId);
  const factors = [
    ["Fixed pathway CI", p.fixed, "gCO2e/MJ"],
    ["Feedstock mass per energy", p.kgPerMj, "kg/MJ"],
    ["Natural gas emission factor", 63, "gCO2e/MJ"],
    ["Truck emission factor", 100, "gCO2e/t-km"],
    ["Rail emission factor", 22, "gCO2e/t-km"],
  ] as const;
  for (const [key, value, unit] of factors) {
    const row = inputs.addRow([key, value, unit]);
    refs[key] = `'Scenario inputs'!$B$${row.number + 4}`;
  }
  const costStart = 7 + Object.keys(FIELD_LABELS).length;
  MEASURES.forEach((m, i) => {
    refs[`${m.id}Capex`] = `'Scenario inputs'!$B$${costStart + i * 2}`;
    refs[`${m.id}Opex`] = `'Scenario inputs'!$B$${costStart + i * 2 + 1}`;
  });
  const extraHeaders = [
    "Renewable power (0/1)",
    "Rail (0/1)",
    "Heat recovery (0/1)",
    "Tuning (0/1)",
    "Gas fraction",
    "Fixed CI",
    "Gas CI",
    "Electricity CI",
    "Transport CI",
    "Capital recovery factor",
    "Baseline CI",
    "Baseline credit USD/yr",
    "Recommendation rank",
  ];
  const scenarios = book.getWorksheet("Scenarios")!;
  extraHeaders.forEach((label, i) => {
    scenarios.getCell(1, i + 10).value = label;
  });
  // Populate the supporting columns before branding so they receive the same cell styling.
  for (let row = 2; row <= scenarios.rowCount; row++)
    extraHeaders.forEach((_, i) => {
      scenarios.getCell(row, i + 10).value = 0;
    });
  const variations = sensitivity(input, analysis.focus.measures, 20);
  // Reserve every measure so a later recommendation can add or remove any of them.
  const waterfall = book.getWorksheet("CI waterfall")!;
  const applied: MeasureId[] = [];
  let previousCi = analysis.baseline.ci;
  const waterfallValues = analysis.mac.map((measure) => {
    const selected = analysis.focus.measures.includes(measure.id);
    if (selected) applied.push(measure.id);
    const ci = scenario(input, applied).ci;
    const result = { measure, selected, from: previousCi, to: ci, delta: ci - previousCi };
    previousCi = ci;
    return result;
  });
  waterfall.spliceRows(
    2,
    waterfall.rowCount - 1,
    ["Baseline", analysis.baseline.ci, analysis.baseline.ci, 0],
    ...waterfallValues.map((v) => [
      v.selected ? v.measure.name : `${v.measure.name} (not selected)`,
      v.from,
      v.to,
      v.delta,
    ]),
    ["Final CI", analysis.focus.ci, analysis.focus.ci, 0],
  );
  const calc = book.addWorksheet("Sensitivity calculations");
  calc.addRow([
    "Scenario",
    "CI gCO2e/MJ",
    "Capital USD",
    "Incremental opex USD/yr",
    "Annualized USD/yr",
    "Gross credit value USD/yr",
    "Net benefit USD/yr",
    "Meets target",
    "Pareto-efficient",
    ...extraHeaders,
  ]);
  const cases: {
    key: string;
    scale: number;
    measures: readonly MeasureId[];
    value: Scenario;
    row: number;
  }[] = [];
  for (const v of variations)
    for (const scale of [0.8, 1.2]) {
      for (const measures of [analysis.focus.measures]) {
        const changed = { ...input, [v.key]: input[v.key] * scale };
        const value = scenario(changed, measures);
        const row = calc.addRow([
          `${v.label} × ${scale} · ${value.name}`,
          ...Array.from({ length: 21 }, (_, i) => (i === 7 || i === 20 ? "" : 0)),
        ]);
        cases.push({ key: v.key, scale, measures, value, row: row.number + 4 });
      }
    }
  const fixedNotes = book.getWorksheet("Evidence")!;
  fixedNotes.addRow([
    "Workbook edits",
    "Numeric inputs and model factors are editable. Overview, waterfall and sensitivity follow the current recommendation across all 16 combinations. Sensitivity varies one assumption at a time while holding that recommendation's measures fixed. Abatement and sensitivity display order reflect the exported run.",
  ]);

  return () => {
    function set(
      sheet: Worksheet,
      address: string,
      formula: string,
      result: number | string | boolean | null,
    ) {
      sheet.getCell(address).value = { formula, result: result ?? "" };
      if (
        typeof result === "number" &&
        (!sheet.getCell(address).numFmt || sheet.getCell(address).numFmt === "General")
      )
        sheet.getCell(address).numFmt = '#,##0.0000;-#,##0.0000;"—"';
    }
    function write(sheet: Worksheet, row: number, value: Scenario, r: Record<string, string>) {
      const gas = `(1-L${row}*${r["heatPct"]}/100)*(1-M${row}*${r["tuningPct"]}/100)`;
      MEASURES.forEach((m, i) => {
        sheet.getCell(row, i + 10).value = value.measures.includes(m.id) ? 1 : 0;
        sheet.getCell(row, i + 10).numFmt = "0";
      });
      const sumCost = (kind: string) =>
        MEASURES.map((m, i) => `${String.fromCharCode(74 + i)}${row}*${r[m.id + kind]}`).join("+");
      const f: Record<string, [string, number | string]> = {
        B: [`SUM(O${row}:R${row})`, value.ci],
        C: [sumCost("Capex"), value.capex],
        D: [
          `${sumCost("Opex")}+J${row}*${r["kwh"]}*${r["volumeMj"]}*${r["ppaPremium"]}-${r["ng"]}*(1-N${row})*${r["volumeMj"]}*${r["ngPrice"]}`,
          value.opex,
        ],
        E: [`C${row}*S${row}+D${row}`, value.annualized],
        F: [
          `MAX(0,${r["benchmark"]}-B${row})*${r["volumeMj"]}/1000000*${r["creditPrice"]}`,
          value.creditValue,
        ],
        G: [`F${row}-U${row}-E${row}`, value.netBenefit],
        H: [`IF(B${row}<=${r["target"]}+1E-10,"Yes","No")`, value.feasible ? "Yes" : "No"],
        N: [
          gas,
          (value.measures.includes("heat") ? 1 - input.heatPct / 100 : 1) *
            (value.measures.includes("tuning") ? 1 - input.tuningPct / 100 : 1),
        ],
        O: [`${r["Fixed pathway CI"]}*${r["feedstockAdj"]}`, value.parts.fixed],
        P: [`${r["ng"]}*N${row}*${r["Natural gas emission factor"]}`, value.parts.ng],
        Q: [`(1-J${row})*${r["kwh"]}*${r["gridCi"]}`, value.parts.elec],
        R: [
          `${r["Feedstock mass per energy"]}/1000*${r["km"]}*(${r["Truck emission factor"]}+K${row}*(${r["Rail emission factor"]}-${r["Truck emission factor"]}))`,
          value.parts.transport,
        ],
        S: [
          `IF(${r["discountRate"]}=0,1/${r["lifeYears"]},${r["discountRate"]}/100/(1-(1+${r["discountRate"]}/100)^(-${r["lifeYears"]})))`,
          capitalRecovery(input.discountRate, input.lifeYears),
        ],
        T: [
          `${r["Fixed pathway CI"]}*${r["feedstockAdj"]}+${r["ng"]}*${r["Natural gas emission factor"]}+${r["kwh"]}*${r["gridCi"]}+${r["Feedstock mass per energy"]}/1000*${r["km"]}*${r["Truck emission factor"]}`,
          scenario(input, []).ci,
        ],
        U: [`MAX(0,${r["benchmark"]}-T${row})*${r["volumeMj"]}/1000000*${r["creditPrice"]}`, 0],
      };
      for (const [col, [formula, cached]] of Object.entries(f))
        set(sheet, `${col}${row}`, formula, cached);
    }
    analysis.all.forEach((value, i) => {
      const row = i + 6;
      write(scenarios, row, value, refs);
      set(
        scenarios,
        `I${row}`,
        `IF(SUMPRODUCT(--($B$6:$B$21<=B${row}+1E-12),--($E$6:$E$21<=E${row}+1E-9),--((($B$6:$B$21<B${row}-1E-12)+($E$6:$E$21<E${row}-1E-9))>0))=0,"Yes","No")`,
        value.pareto ? "Yes" : "No",
      );
      set(
        scenarios,
        `S${row}`,
        `IF(${refs["discountRate"]}=0,1/${refs["lifeYears"]},${refs["discountRate"]}/100/(1-(1+${refs["discountRate"]}/100)^(-${refs["lifeYears"]})))`,
        capitalRecovery(input.discountRate, input.lifeYears),
      );
      set(
        scenarios,
        `U${row}`,
        `MAX(0,${refs["benchmark"]}-T${row})*${refs["volumeMj"]}/1000000*${refs["creditPrice"]}`,
        analysis.baseline.creditValue,
      );
    });
    for (const c of cases) {
      const changed = { ...input, [c.key]: input[c.key as keyof typeof FIELD_LABELS] * c.scale };
      write(calc, c.row, c.value, { ...refs, [c.key]: `(${refs[c.key]}*${c.scale})` });
      // Cache against the varied baseline, not the unvaried exported baseline.
      const base = scenario(changed, []);
      set(calc, `T${c.row}`, calc.getCell(`T${c.row}`).formula!, base.ci);
      set(calc, `U${c.row}`, calc.getCell(`U${c.row}`).formula!, base.creditValue);
      set(
        calc,
        `S${c.row}`,
        calc.getCell(`S${c.row}`).formula!,
        capitalRecovery(changed.discountRate, changed.lifeYears),
      );
    }
    analysis.all.forEach((value, index) => {
      const row = index + 6;
      const rank = value.feasible
        ? analysis.all.filter(
            (s, i) =>
              s.feasible &&
              (s.annualized < value.annualized ||
                (s.annualized === value.annualized && i <= index)),
          ).length
        : analysis.all.filter((s) => s.feasible).length +
          analysis.all.filter((s, i) => s.ci < value.ci || (s.ci === value.ci && i <= index))
            .length;
      set(
        scenarios,
        `V${row}`,
        `IF(H${row}="Yes",COUNTIFS($H$6:$H$21,"Yes",$E$6:$E$21,"<"&E${row})+COUNTIFS($H$6:H${row},"Yes",$E$6:E${row},E${row}),COUNTIF($H$6:$H$21,"Yes")+COUNTIF($B$6:$B$21,"<"&B${row})+COUNTIF($B$6:B${row},B${row}))`,
        rank,
      );
    });
    const overview = book.getWorksheet("Overview")!;
    const focusIndex = "MATCH(1,'Scenarios'!V6:V21,0)";
    const pick = (column: string) => `INDEX('Scenarios'!${column}6:${column}21,${focusIndex})`;
    const selectedMeasure = (id: MeasureId) =>
      pick(String.fromCharCode(74 + MEASURES.findIndex((m) => m.id === id)));
    for (const c of cases) {
      MEASURES.forEach((measure, i) => {
        set(
          calc,
          `${String.fromCharCode(74 + i)}${c.row}`,
          selectedMeasure(measure.id),
          c.measures.includes(measure.id) ? 1 : 0,
        );
      });
      set(
        calc,
        `A${c.row}`,
        `"${c.key} × ${c.scale} · "&'Overview'!E13`,
        `${c.key} × ${c.scale} · ${analysis.focus.name}`,
      );
    }
    for (const [address, column, cached] of [
      ["A7", "B", analysis.focus.ci],
      ["D7", "C", analysis.focus.capex],
      ["G7", "G", analysis.focus.netBenefit],
      ["E13", "A", analysis.focus.name],
    ] as const)
      set(overview, address, pick(column), cached);
    set(overview, "E14", refs["target"]!, input.target);
    set(
      overview,
      "E15",
      `IF(COUNTIF('Scenarios'!H6:H21,"Yes")>0,"Feasible","Not reached")`,
      analysis.recommended ? "Feasible" : "Not reached",
    );
    set(overview, "E16", "'Scenarios'!B6", analysis.baseline.ci);
    set(overview, "E17", refs["volumeMj"]!, input.volumeMj);
    set(overview, "E18", refs["creditPrice"]!, input.creditPrice);
    const mac = book.getWorksheet("Abatement ranking")!;
    analysis.mac.forEach((m, i) => {
      const row = i + 6,
        source =
          analysis.all.findIndex((s) => s.measures.length === 1 && s.measures[0] === m.id) + 6;
      set(mac, `B${row}`, `'Scenarios'!B6-'Scenarios'!B${source}`, m.dCi);
      set(mac, `C${row}`, `B${row}*${refs["volumeMj"]}/1000000`, m.avoidedT);
      set(mac, `D${row}`, `'Scenarios'!E${source}`, m.annualized);
      set(mac, `E${row}`, `IF(C${row}>0,D${row}/C${row},"")`, m.mac);
    });
    set(waterfall, "B6", "'Scenarios'!B6", analysis.baseline.ci);
    set(waterfall, "C6", "'Scenarios'!B6", analysis.baseline.ci);
    set(waterfall, "D6", "C6-B6", 0);
    const combination: string[] = [];
    waterfallValues.forEach((v, i) => {
      const row = i + 7;
      const bit = 2 ** MEASURES.findIndex((m) => m.id === v.measure.id);
      combination.push(`${selectedMeasure(v.measure.id)}*${bit}`);
      set(
        waterfall,
        `A${row}`,
        `IF(${selectedMeasure(v.measure.id)}=1,"${v.measure.name}","${v.measure.name} (not selected)")`,
        v.selected ? v.measure.name : `${v.measure.name} (not selected)`,
      );
      set(waterfall, `B${row}`, `C${row - 1}`, v.from);
      set(waterfall, `C${row}`, `INDEX('Scenarios'!B6:B21,1+${combination.join("+")})`, v.to);
      set(waterfall, `D${row}`, `C${row}-B${row}`, v.delta);
    });
    set(waterfall, "B11", "'Overview'!A7", analysis.focus.ci);
    set(waterfall, "C11", "'Overview'!A7", analysis.focus.ci);
    set(waterfall, "D11", "C11-B11", 0);
    const sens = book.getWorksheet("Sensitivity")!;
    variations.forEach((v, i) => {
      const row = i + 6,
        low = cases[i * 2]!.row,
        high = cases[i * 2 + 1]!.row;
      for (const [col, source, varied, cached] of [
        ["B", "B", low, v.ciLo],
        ["C", "B", high, v.ciHi],
        ["D", "G", low, v.nbLo],
        ["E", "G", high, v.nbHi],
      ] as const)
        set(
          sens,
          `${col}${row}`,
          `'Sensitivity calculations'!${source}${varied}-${pick(source)}`,
          cached,
        );
    });
    const regulatory = book.getWorksheet("Regulatory context")!;
    for (let row = 6; row <= regulatory.rowCount; row++) {
      const benchmark = Number(regulatory.getCell(row, 2).value);
      set(regulatory, `C${row}`, `B${row}-Overview!A7`, benchmark - analysis.focus.ci);
      set(
        regulatory,
        `D${row}`,
        `C${row}/B${row}*100`,
        ((benchmark - analysis.focus.ci) / benchmark) * 100,
      );
    }
    book.calcProperties.fullCalcOnLoad = true;
  };
}
