import siteLogo from "@/assets/logo.png";
import { pathwayExportFilename } from "./export-filename";
import { buildWorkspaceSpec } from "./workbook-model";
import { createWorkspaceWorkbook } from "./workbook-renderer";
import { chartImage, type WorkbookChart } from "@/shared/export/excel-workbook";
import type { FormulaCell } from "./workbook-model";

export async function exportWorkspaceWorkbook(input: unknown) {
  const spec = buildWorkspaceSpec(input);
  const response = await fetch(siteLogo);
  if (!response.ok) throw new Error("Could not load the workbook logo.");
  const { book, layout } = await createWorkspaceWorkbook(spec, await response.arrayBuffer());
  const calculation = layout.sheets[0]!;
  const contributions = calculation.sections
    .find((s) => s.title === "Lifecycle contribution by emission source")!
    .rows.slice(0, -1);
  const charts: WorkbookChart[] = [
    {
      title: "Lifecycle contribution by emission source",
      kind: "contribution",
      categories: contributions.map((r) => String(r.cells[0])),
      series: [
        {
          name: "Contribution",
          values: contributions.map((r) => Number((r.cells[1] as FormulaCell).result)),
          color: "#178A6B",
        },
      ],
      unit: "gCO2e/MJ · Export-time chart; linked tables recalculate when inputs change",
    },
  ];
  const programs = calculation.sections.find(
    (s) => s.title === "Regulatory program comparison",
  )!.rows;
  if (programs.length)
    charts.push({
      title: "Regulatory program comparison",
      kind: "comparison",
      categories: programs.map((r) => String(r.cells[0])),
      series: [
        {
          name: "Pathway CI",
          values: programs.map((r) => Number((r.cells[2] as FormulaCell).result)),
          color: "#178A6B",
        },
        { name: "Benchmark", values: programs.map((r) => Number(r.cells[1])), color: "#2866A0" },
      ],
      unit: "gCO2e/MJ · Export-time chart; see live comparison table above",
    });
  const sheet = book.getWorksheet("Calculation")!;
  let next = sheet.rowCount + 3;
  for (const chart of charts) {
    const png = chartImage(chart);
    if (!png) continue;
    const image = book.addImage({ base64: png, extension: "png" });
    sheet.addImage(image, { tl: { col: 0, row: next - 1 }, ext: { width: 1000, height: 500 } });
    for (let r = next; r < next + 28; r++) sheet.getRow(r).height = 15;
    next += 30;
  }
  sheet.pageSetup.printArea = `A1:L${next}`;
  const buffer = await book.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(buffer)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = pathwayExportFilename(spec.pathwayLabel, "workspace");
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
