import { polishWorkbook, REPORT_FORMAT } from "./workbook-style";
import { pathwayExportFilename } from "./export-filename";
import { z } from "zod";

const rowSchema = z.record(z.string(), z.unknown());
const payloadSchema = z
  .object({
    name: z.string().max(120),
    pathwayLabel: z.string().max(240),
    ciTotal: z.number().finite(),
    grossCi: z.number().finite(),
    creditsCi: z.number().finite(),
    annualEnergyMj: z.number().finite().nonnegative(),
    annualTonnesCo2e: z.number().finite(),
    lines: z.array(rowSchema).max(500),
    programs: z.array(rowSchema).max(50),
    factorTable: z.array(rowSchema).max(1000),
    library: z.array(rowSchema).max(5000),
  })
  .passthrough();

type Cell = string | number | boolean | null;
const cell = (value: unknown): Cell =>
  Array.isArray(value)
    ? value.length
      ? value.map(String).join("\n")
      : "None"
    : typeof value === "number"
      ? Number.isFinite(value)
        ? value
        : null
      : typeof value === "string" || typeof value === "boolean"
        ? value
        : value == null
          ? null
          : JSON.stringify(value);

export async function exportWorkspaceWorkbook(input: unknown) {
  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
    );
  }
  const data = parsed.data;
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  book.creator = "Global Bioenergy Watch";
  book.created = new Date();
  book.addWorksheet("Overview");

  function sheet(name: string, headers: string[], rows: Cell[][]) {
    const page = book.addWorksheet(name);
    const labels: Record<string, string> = {
      gPerMj: "Contribution (gCO2e/MJ)",
      scope: "Scope classification",
      label: "Contribution",
      scope1: "Scope 1 (gCO2e/MJ)",
      scope2: "Scope 2 (gCO2e/MJ)",
      scope3: "Scope 3 (gCO2e/MJ)",
      adjustments: "Signed adjustments (gCO2e/MJ)",
      unallocated: "Unallocated (gCO2e/MJ)",
      activityUnit: "Activity unit",
      factorUnit: "Factor unit",
      divisor: "Fuel energy divisor (MJ)",
      ci: "CI (gCO2e/MJ)",
      energy: "Fuel energy (MJ)",
      credits: "Conditional credits (tonnes)",
      url: "Source URL",
    };
    page.addRow(
      headers.map(
        (header) =>
          labels[header] ??
          header
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/^./, (letter) => letter.toUpperCase()),
      ),
    );
    page.addRows(rows);
    page.views = [{ state: "frozen", ySplit: 1 }];
    page.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, page.rowCount), column: headers.length },
    };
    page.getRow(1).eachCell((item) => {
      item.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0E2A43" } };
      item.font = { bold: true, color: { argb: "FFFFFFFF" } };
      item.alignment = { vertical: "middle", wrapText: true };
    });
    page.getRow(1).height = 30;
    page.columns.forEach((column, index) => {
      column.width = index === 0 ? 32 : 24;
    });
    for (let row = 2; row <= page.rowCount; row++) {
      page.getRow(row).alignment = { vertical: "top", wrapText: true };
      if (row % 2 === 0)
        page.getRow(row).eachCell((item) => {
          item.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF3F7" } };
        });
    }
    return page;
  }

  sheet(
    "Scenario",
    ["Metric", "Value", "Unit"],
    [
      ["Scenario", data.name, ""],
      ["Pathway", data.pathwayLabel, ""],
      ["Net CI", data.ciTotal, "gCO2e/MJ"],
      ["Gross emissions", data.grossCi, "gCO2e/MJ"],
      ["Signed adjustments", data.creditsCi, "gCO2e/MJ"],
      ["Annual energy", data.annualEnergyMj, "MJ"],
      ["Annual modeled emissions", data.annualTonnesCo2e, "tonnes CO2e"],
      [
        "Ledger sum",
        data.lines.reduce(
          (sum, row) => sum + (typeof row["gPerMj"] === "number" ? row["gPerMj"] : 0),
          0,
        ),
        "gCO2e/MJ",
      ],
      ["Method", "Inherited GBW screening model; not a certified regulatory pathway score", ""],
      ["Warnings", cell(data["warnings"]), ""],
      ["Program validation", cell(data["programErrors"]), ""],
      ["Model version", cell(data["modelVersion"]), ""],
    ],
  );

  function records(name: string, keys: string[], rows: Record<string, unknown>[]) {
    sheet(
      name,
      keys,
      rows.map((row) => keys.map((key) => cell(row[key]))),
    );
  }
  records(
    "Calculation ledger",
    [
      "label",
      "activity",
      "activityUnit",
      "factor",
      "factorUnit",
      "divisor",
      "allocation",
      "sign",
      "gPerMj",
      "scope",
      "category",
      "detail",
      "scope1",
      "scope2",
      "scope3",
      "adjustments",
      "unallocated",
      "key",
    ],
    data.lines,
  );
  sheet(
    "Scope classifications",
    ["Classification", "gCO2e per MJ", "Annual tonnes CO2e"],
    ["scope1", "scope2", "scope3", "adjustments", "unallocated"].map((key) => {
      const names: Record<string, string> = {
        scope1: "Scope 1 (indicative lifecycle allocation)",
        scope2: "Scope 2 (indicative lifecycle allocation)",
        scope3: "Scope 3 (indicative lifecycle allocation)",
        adjustments: "Lifecycle credits / removals (separate)",
        unallocated: "Unallocated manual contributions",
      };
      const ci = data.lines.reduce(
        (sum, row) => sum + (typeof row[key] === "number" ? row[key] : 0),
        0,
      );
      return [names[key]!, ci, (ci * data.annualEnergyMj) / 1e6];
    }),
  );
  records(
    "Program comparison",
    ["name", "benchmark", "ci", "energy", "credits", "supported", "url"],
    data.programs,
  );
  records("Applied factors", ["key", "label", "value", "unit", "source"], data.factorTable);
  records("Factor library", ["group", "item", "detail", "value", "unit", "source"], data.library);

  const inputs: Cell[][] = [];
  function flatten(prefix: string, value: unknown) {
    if (value != null && typeof value === "object") {
      Object.entries(value).forEach(([key, nested]) => flatten(`${prefix}.${key}`, nested));
    } else inputs.push([prefix, cell(value)]);
  }
  if (data["scenarioSnapshot"]) flatten("Scenario", data["scenarioSnapshot"]);
  else
    [
      "pathwayId",
      "region",
      "inputBasis",
      "annualVolume",
      "energyDensity",
      "comparator",
      "direct",
      "energy",
      "factors",
      "dairy",
      "baseline",
    ].forEach((key) => {
      if (data[key] != null) flatten(key, data[key]);
    });
  if (data["scenarioSnapshot"] && data["baseline"]) flatten("Baseline", data["baseline"]);
  if (data["baselineSnapshot"]) flatten("Baseline inputs", data["baselineSnapshot"]);
  sheet("Scenario inputs", ["Input", "Value"], inputs);
  if (data["rinEstimate"] && typeof data["rinEstimate"] === "object") {
    const rin = data["rinEstimate"] as Record<string, unknown>;
    sheet(
      "RFS estimate",
      ["Metric", "Value", "Unit"],
      [
        ["RIN estimate", cell(rin["rins"] ?? rin["rinError"] ?? "Not applicable"), "gallon-RINs"],
        ["Fuel energy (LHV)", cell(rin["energyMj"]), "MJ / year"],
        ["Standardized liquid volume", cell(rin["gallons"]), "US gallons / year"],
        String(data["pathwayId"] ?? "").startsWith("rng-")
          ? ["RIN energy basis", 77000, "Btu LHV / RIN"]
          : ["Equivalence factor", cell(rin["ev"]), "RINs / US gallon"],
        ["Warnings", cell(rin["warnings"]), ""],
        ["Validation", cell(rin["errors"]), ""],
        [
          "Rule source",
          "https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-80/subpart-M/section-80.1415",
          "",
        ],
      ],
    );
  }

  await polishWorkbook(book, data.name, `${data.pathwayLabel} · Screening estimate`, {
    metrics: [
      { label: "Net lifecycle CI", value: data.ciTotal, unit: "gCO2e/MJ of finished fuel" },
      {
        label: "Annual modeled emissions",
        value: data.annualTonnesCo2e,
        unit: "tonnes CO2e / year",
        format: '#,##0.00;[Red](#,##0.00);"—"',
      },
      {
        label: "Annual fuel energy",
        value: data.annualEnergyMj,
        unit: "MJ / year",
        format: REPORT_FORMAT.integer,
      },
    ],
    facts: [
      { label: "Scenario", value: data.name },
      { label: "Fuel pathway", value: data.pathwayLabel },
      { label: "Gross lifecycle emissions (gCO2e/MJ)", value: data.grossCi },
      { label: "Signed credits / adjustments (gCO2e/MJ)", value: data.creditsCi },
      { label: "Net lifecycle CI (gCO2e/MJ)", value: data.ciTotal },
    ],
    contributions: data.lines.map((line) => ({
      label: String(line["label"] ?? "Contribution"),
      value: Number(line["gPerMj"]) || 0,
    })),
    notes: [
      "Screening model. A modeled CI is not a certified regulatory pathway score. Negative contributions represent signed accounting adjustments.",
      "Lifecycle shares use absolute contributions. Signed values reconcile with the headline CI. Full input precision is retained in the detail sheets.",
      ...(Array.isArray(data["warnings"]) ? data["warnings"].map(String) : []),
      ...(Array.isArray(data["programErrors"]) ? data["programErrors"].map(String) : []),
    ],
  });
  const buffer = await book.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = pathwayExportFilename(data.pathwayLabel, "workspace");
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
