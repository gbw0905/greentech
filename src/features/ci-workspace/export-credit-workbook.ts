import { polishWorkbook, REPORT_FORMAT } from "./workbook-style";
import { pathwayExportFilename } from "./export-filename";
import { z } from "zod";
const scalar = z.union([z.string().max(4000), z.number().finite(), z.boolean(), z.null()]);
const schema = z.object({
  version: z.string().max(50),
  reviewed: z.string().max(50),
  fuelName: z.string().max(100),
  state: z.record(z.string(), scalar),
  result: z.record(z.string(), z.union([scalar, z.array(z.string().max(4000)).max(100)])),
  warnings: z.array(z.string().max(4000)).max(100),
  sources: z
    .array(z.object({ title: z.string().max(500), url: z.string().url().max(2000) }))
    .max(30),
});
export async function exportCreditWorkbook(payload: unknown) {
  const data = schema.parse(payload);
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Global Bioenergy Watch";
  workbook.created = new Date();
  workbook.addWorksheet("Overview");
  function sheet(name: string, rows: unknown[][]) {
    const page = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    const names: Record<string, string> = {
      year: "Compliance year",
      quantity: "Renewable fuel quantity",
      fuel: "Fuel code",
      unit: "Quantity unit",
      basis: "Energy basis",
      hhvToLhv: "LHV / HHV ratio",
      lcfsBasisFactor: "LCFS energy basis multiplier",
      energy: "Fuel energy (MJ/US gallon)",
      ci: "Pathway CI (gCO2e/MJ)",
      benchmark: "Annual benchmark (gCO2e/MJ)",
      reference: "Displaced fuel",
      benchmarkMode: "Benchmark source",
      eer: "Energy economy ratio",
      lcfsShare: "Quantity eligible for LCFS (%)",
      rfsShare: "Quantity eligible for RFS (%)",
      lcfsPrice: "LCFS price (USD/tonne)",
      rinPrice: "RIN price (USD/RIN)",
      dcode: "Registered D-code",
      evMode: "Equivalence value source",
      customEV: "Approved RINs per gallon",
      lcfsConfirmed: "LCFS assumptions confirmed",
      rfsConfirmed: "RFS assumptions confirmed",
      energyMj: "Total fuel energy LHV (MJ)",
      lcfsEnergy: "LCFS-eligible energy (MJ)",
      delta: "Benchmark × EER − pathway CI",
      lcfsTonnes: "Signed LCFS credits (tonnes)",
      rins: "Estimated RIN quantity",
      lcfsValue: "Gross LCFS value (USD)",
      rinValue: "Gross RIN value (USD)",
      combined: "Combined planning value (USD)",
      rinError: "RIN eligibility note",
      warnings: "Assumptions to review",
      gallons: "Standardized US gallons",
      ev: "RINs per gallon",
      mode: "Calculation mode",
    };
    page.addRows(
      rows.map((row) => [
        typeof row[0] === "string" ? (names[row[0]] ?? row[0]) : row[0],
        ...row.slice(1),
      ]),
    );
    page.getColumn(1).width = 44;
    page.getColumn(2).width = 85;
    page.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    page.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0E2A43" } };
    page.eachRow((row) => {
      row.alignment = { vertical: "top", wrapText: true };
    });
  }
  sheet("Executive summary", [
    ["Metric", "Value", "Unit"],
    ["Fuel", data.fuelName, ""],
    ["LCFS credits / deficits", data.result["lcfsTonnes"] ?? "Not applicable", "tonnes CO2e"],
    [
      "Estimated RINs",
      data.result["rins"] ??
        (data.state["mode"] === "lcfs"
          ? "Not applicable"
          : (data.result["rinError"] ?? "Not calculated")),
      "gallon-RINs",
    ],
    ["Gross LCFS value", data.result["lcfsValue"], "USD"],
    ["Gross RIN value", data.result["rinValue"], "USD"],
    [
      "Combined planning value",
      data.result["combined"] ??
        (data.state["mode"] === "both" ? "Pending eligibility confirmation" : "Not applicable"),
      "USD",
    ],
    ["Use", "Conditional planning estimate; confirm approved pathway and entitlement", ""],
  ]);
  sheet("Scenario", [
    ["Input", "Value"],
    ["Fuel", data.fuelName],
    ["Engine version", data.version],
    ["Reference review date", data.reviewed],
    ...Object.entries(data.state),
  ]);
  sheet("Results", [
    ["Metric", "Value"],
    ...Object.entries(data.result).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(" | ") : value,
    ]),
  ]);
  sheet("Assumptions", [
    ["Review", "Details"],
    ...data.warnings.map((warning, index) => [index + 1, warning]),
  ]);
  sheet("Sources", [
    ["Source", "URL"],
    ...data.sources.map((source) => [source.title, source.url]),
  ]);
  await polishWorkbook(
    workbook,
    "Credit & RIN planning estimate",
    `${data.fuelName} · Engine ${data.version}`,
    {
      metrics: [
        {
          label: "LCFS credits / deficits",
          value: typeof data.result["lcfsTonnes"] === "number" ? data.result["lcfsTonnes"] : null,
          unit: "tonnes CO2e",
          format: '#,##0.00;[Red](#,##0.00);"—"',
        },
        {
          label: "Estimated RINs",
          value: typeof data.result["rins"] === "number" ? data.result["rins"] : null,
          unit: "gallon-RINs",
          format: REPORT_FORMAT.integer,
        },
        {
          label: "Combined planning value",
          value: typeof data.result["combined"] === "number" ? data.result["combined"] : null,
          unit: "USD · subject to eligibility",
          format: REPORT_FORMAT.money,
        },
      ],
      facts: [
        { label: "Fuel", value: data.fuelName },
        { label: "Compliance year", value: data.state["year"] as number, format: "0" },
        {
          label: "Calculation mode",
          value:
            data.state["mode"] === "both"
              ? "LCFS and RFS"
              : data.state["mode"] === "rfs"
                ? "RFS only"
                : "LCFS only",
        },
        {
          label: "Registered pathway D-code",
          value: String(data.state["dcode"] || "Not selected"),
        },
        {
          label: "Gross LCFS value (USD)",
          value: typeof data.result["lcfsValue"] === "number" ? data.result["lcfsValue"] : null,
          format: REPORT_FORMAT.money,
        },
        {
          label: "Gross RIN value (USD)",
          value: typeof data.result["rinValue"] === "number" ? data.result["rinValue"] : null,
          format: REPORT_FORMAT.money,
        },
        {
          label: "Eligibility assumptions",
          value:
            (data.state["mode"] === "rfs" || data.state["lcfsConfirmed"]) &&
            (data.state["mode"] === "lcfs" || data.state["rfsConfirmed"])
              ? "Active programs confirmed by user"
              : "Review eligibility assumptions",
        },
      ],
      notes: [
        "Conditional planning estimate. Program eligibility, approved pathway and credit ownership must be confirmed separately. Prices are user assumptions.",
        ...data.warnings,
      ],
    },
  );
  const summary = workbook.getWorksheet("Executive summary")!;
  [8].forEach((row) => {
    summary.getCell(row, 2).numFmt = '#,##0;[Red](#,##0);"—"';
  });
  [9, 10, 11].forEach((row) => {
    summary.getCell(row, 2).numFmt = '$#,##0.00;[Red]($#,##0.00);"—"';
  });
  for (const page of workbook.worksheets.filter((sheet) => sheet.name !== "Overview")) {
    for (let r = 6; r <= page.rowCount; r++) {
      const label = String(page.getCell(r, 1).value ?? "");
      if (/year/.test(label)) page.getCell(r, 2).numFmt = "0";
      else if (/RIN quantity|Estimated RINs/.test(label)) page.getCell(r, 2).numFmt = "#,##0";
      if (/eligible.*\(%\)/.test(label)) page.getCell(r, 2).numFmt = '0.0"%"';
      if (/value.*USD|price.*USD/.test(label))
        page.getCell(r, 2).numFmt = '$#,##0.00;[Red]($#,##0.00);"—"';
    }
  }
  const bytes = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = pathwayExportFilename(data.fuelName, "credit");
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
