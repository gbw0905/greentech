import { polishWorkbook, REPORT_FORMAT } from "@/features/ci-workspace/workbook-style";
import { FIELD_LABELS } from "./fields";
import {
  pathwayFor,
  MEASURES,
  regulatoryRows,
  sensitivity,
  type Inputs,
  type Analysis,
} from "./engine";
type Value = string | number | null;
export async function exportOptimizerReport(
  input: Inputs,
  analysis: Analysis,
  format: "excel" | "csv",
) {
  const pathway = pathwayFor(input.pathwayId),
    focus = analysis.focus;
  const tables: Record<string, Value[][]> = {
    "Scenario inputs": [
      ["Input", "Value", "Unit"],
      ["Pathway", pathway.label, ""],
      ...Object.entries(FIELD_LABELS).map(([key, [label, unit]]) => [
        label,
        input[key as keyof typeof FIELD_LABELS],
        unit,
      ]),
      ...MEASURES.flatMap((m) => [
        [`${m.name} capital`, input.costs[m.id].capex, "USD"],
        [`${m.name} operating cost`, input.costs[m.id].opex, "USD/year"],
      ]),
    ],
    Scenarios: [
      [
        "Scenario",
        "CI gCO2e/MJ",
        "Capital USD",
        "Incremental opex USD/yr",
        "Annualized USD/yr",
        "Gross credit value USD/yr",
        "Net benefit USD/yr",
        "Meets target",
        "Pareto-efficient",
      ],
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
    ],
    "Abatement ranking": [
      ["Measure", "CI reduction g/MJ", "Avoided tonnes/yr", "Annualized USD/yr", "Cost USD/tonne"],
      ...analysis.mac.map((m) => [m.name, m.dCi, m.avoidedT, m.annualized, m.mac]),
    ],
    "CI waterfall": [
      ["Step", "From g/MJ", "To g/MJ", "Change g/MJ"],
      ["Baseline", analysis.baseline.ci, analysis.baseline.ci, 0],
      ...analysis.waterfall.map((s) => [s.name, s.from, s.to, s.delta]),
      ["Final CI", focus.ci, focus.ci, 0],
    ],
    Sensitivity: [
      [
        "Assumption (±20%)",
        "Delta CI low",
        "Delta CI high",
        "Delta net low USD/yr",
        "Delta net high USD/yr",
      ],
      ...sensitivity(input, focus.measures, 20).map((s) => [
        s.label,
        s.ciLo,
        s.ciHi,
        s.nbLo,
        s.nbHi,
      ]),
    ],
    "Regulatory context": [
      [
        "Program",
        "2026 reference CI",
        "Gap g/MJ",
        "Relative saving %",
        "Reference type",
        "Source URL",
      ],
      ...regulatoryRows(input, focus.ci).map((p) => [
        p.name,
        p.benchmark,
        p.gap,
        p.saving,
        p.kind,
        p.url,
      ]),
    ],
    Evidence: [
      ["Item", "Detail"],
      ["Source", "https://globalbioenergywatch.org/civanta/optimizer"],
      ["Imported", "2026-10-15"],
      ["Natural gas", "63 gCO2e/MJ"],
      ["Transport", "Truck 100 and rail 22 gCO2e/t-km"],
      [
        "PPA",
        "Modeled grid electricity emissions replaced with zero; upstream PPA emissions not separately modeled.",
      ],
      [
        "Recommendation",
        "Least annualized cost among the 16 modeled combinations meeting the CI target. If none meets it, the lowest-CI combination is shown.",
      ],
      ["Capital recovery", "r / (1 - (1+r)^(-years)); 1/years when r=0"],
      [
        "Net benefit",
        "Incremental conditional credit value minus annualized cost, relative to the baseline.",
      ],
      [
        "Credit assumptions",
        "EER 1; all annual energy assumed eligible. Credit value floors at zero; deficits, RINs, taxes and other incentives are excluded.",
      ],
      [
        "Scope",
        "Screening model, not certified CI, approved pathway eligibility or an investment recommendation.",
      ],
      [
        "Regulatory context",
        "2026 references shared with the CI Workspace. Numerical gaps do not establish eligibility.",
      ],
      ["Sensitivity", "Fixed recommended measures; each assumption varied independently by ±20%."],
      ["Default pathway CI", pathway.ci],
    ],
  };
  const date = new Date().toISOString().slice(0, 10);
  let blob: Blob;
  if (format === "csv") {
    const csv = Object.entries(tables)
      .flatMap(([name, rows]) => [[name], ...rows, []])
      .map((row) =>
        row
          .map((cell) => {
            let text = String(cell ?? "");
            if (typeof cell === "string" && /^[=+@\-\t\r]/.test(text)) text = "'" + text;
            return '"' + text.replaceAll('"', '""') + '"';
          })
          .join(","),
      )
      .join("\r\n");
    blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  } else {
    const { Workbook } = await import("exceljs");
    const book = new Workbook();
    book.created = new Date();
    book.addWorksheet("Overview");
    Object.entries(tables).forEach(([name, rows]) => book.addWorksheet(name).addRows(rows));
    await polishWorkbook(book, "CIVanta Optimizer", pathway.label, {
      metrics: [
        { label: "Optimized CI", value: focus.ci, unit: "gCO2e/MJ", format: REPORT_FORMAT.decimal },
        { label: "Capital required", value: focus.capex, unit: "USD", format: REPORT_FORMAT.money },
        {
          label: "Net annual benefit",
          value: focus.netBenefit,
          unit: "USD/year",
          format: REPORT_FORMAT.money,
        },
      ],
      facts: [
        { label: "Pathway", value: pathway.label },
        { label: "Recommended measures", value: focus.name },
        { label: "Target CI (gCO2e/MJ)", value: input.target },
        { label: "Target status", value: analysis.recommended ? "Feasible" : "Not reached" },
        { label: "Baseline CI", value: analysis.baseline.ci },
        { label: "Annual energy (MJ)", value: input.volumeMj },
        { label: "Credit price (USD/tonne)", value: input.creditPrice },
        { label: "Combinations compared", value: 16 },
      ],
      notes: [
        "Screening estimate. Default costs and model factors require project-specific review.",
        "Conditional credit value assumes EER 1 and all modeled energy eligible; no credit entitlement is established.",
        "See Scenario inputs, Scenarios, Abatement ranking, CI waterfall, Sensitivity, Regulatory context and Evidence for the complete report.",
      ],
    });
    const bytes = await book.xlsx.writeBuffer();
    blob = new Blob([new Uint8Array(bytes)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = `civanta-optimizer-${input.pathwayId}-${date}.${format === "excel" ? "xlsx" : "csv"}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
