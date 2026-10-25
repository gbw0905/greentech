import {
  columnLetter,
  layoutWorkspaceSpec,
  type WorkspaceSpec,
  type FormulaCell,
} from "./workbook-model.ts";
import type { Cell, Worksheet } from "exceljs";

const C = {
  navy: "FF0E2A43",
  green: "FF126F56",
  pale: "FFE6F3EE",
  ink: "FF15354B",
  muted: "FF62788B",
  line: "FFDCE6ED",
  wash: "FFF2F7FA",
  white: "FFFFFFFF",
  input: "FFFFF4D6",
};
const DECIMAL = '#,##0.0000;-#,##0.0000;"—"';
function paint(cell: Cell, color: string) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
}
function band(sheet: Worksheet, number: number, label: string, width: number) {
  sheet.mergeCells(number, 1, number, width);
  const cell = sheet.getCell(number, 1);
  cell.value = label;
  cell.font = { name: "Arial", size: 11, bold: true, color: { argb: C.navy } };
  cell.alignment = { vertical: "middle", indent: 1 };
  paint(cell, C.pale);
  sheet.getRow(number).height = 29;
}

/** Browser export and file-level verification share the same builder. */
export async function createWorkspaceWorkbook(spec: WorkspaceSpec, logo?: ArrayBuffer) {
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  const layout = layoutWorkspaceSpec(spec);
  book.creator = "Global Bioenergy Watch";
  book.company = "Global Bioenergy Watch";
  book.title = spec.title;
  book.subject = spec.pathwayLabel;
  book.created = new Date();
  book.calcProperties.fullCalcOnLoad = true;
  const imageId = logo ? book.addImage({ buffer: logo as never, extension: "png" }) : undefined;
  for (const data of layout.sheets) {
    const sheet = book.addWorksheet(data.name);
    const width = Math.max(...data.sections.map((s) => s.headers.length), 2);
    sheet.columns = data.widths.map((columnWidth) => ({ width: columnWidth }));
    sheet.properties.tabColor = { argb: data.name === "Calculation" ? C.navy : C.green };
    for (let r = 1; r <= 6; r++) sheet.mergeCells(r, 1, r, Math.min(width, 6));
    sheet.getCell("A1").value =
      `${imageId === undefined ? "" : "          "}Global Bioenergy Watch`;
    sheet.getCell("A2").value = spec.title;
    sheet.getCell("A3").value = `${data.name} / ${spec.pathwayLabel}`;
    sheet.getCell("A4").value = {
      text: `Exported ${book.created.toISOString().slice(0, 10)} · globalbioenergywatch.org`,
      hyperlink: "https://globalbioenergywatch.org",
    };
    sheet.getCell("A5").value = data.intro;
    sheet.getCell("A6").value =
      "CIvanta scenario workspace · Indicative screening result, not a certified pathway CI score.";
    for (let r = 1; r <= 6; r++) {
      const cell = sheet.getCell(r, 1);
      cell.font = {
        name: "Arial",
        size: r === 1 ? 17 : r === 2 ? 15 : 11,
        bold: r <= 2,
        color: { argb: r === 4 ? C.green : r <= 2 ? C.navy : C.muted },
      };
      cell.alignment = { vertical: "middle", wrapText: true };
      sheet.getRow(r).height = r === 1 ? 48 : r === 5 ? 43 : r === 6 ? 32 : 30;
    }
    sheet.getCell("A4").border = { bottom: { style: "medium", color: { argb: C.green } } };
    if (imageId !== undefined)
      sheet.addImage(imageId, {
        tl: { col: 0.05, row: 0.05 },
        ext: { width: 50, height: 50 },
        editAs: "absolute",
      });
    for (const section of data.sections) {
      band(sheet, section.titleRow, section.title, section.headers.length);
      const header = sheet.getRow(section.headerRow);
      section.headers.forEach((label, c) => {
        const cell = header.getCell(c + 1);
        cell.value = label;
        cell.font = { name: "Arial", size: 11, bold: true, color: { argb: C.white } };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        paint(cell, C.navy);
        cell.border = { right: { style: "thin", color: { argb: C.white } } };
      });
      header.height = 44;
      for (const item of section.rows) {
        const row = sheet.getRow(item.number);
        let lines = 1;
        item.cells.forEach((raw, c) => {
          const cell = row.getCell(c + 1);
          const calculated = raw !== null && typeof raw === "object";
          cell.value = calculated
            ? { formula: (raw as FormulaCell).formula, result: (raw as FormulaCell).result }
            : raw === ""
              ? null
              : raw;
          const number =
            typeof raw === "number" ||
            (calculated && typeof (raw as FormulaCell).result === "number");
          cell.font = {
            name: "Arial",
            size: 11,
            bold: item.total === true,
            color: { argb: calculated ? C.green : C.ink },
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: number ? "right" : "left",
            wrapText: true,
          };
          paint(
            cell,
            item.total
              ? C.pale
              : item.editable?.includes(c + 1)
                ? C.input
                : (item.number - section.headerRow) % 2
                  ? C.wash
                  : C.white,
          );
          if (number) {
            const numericValue = calculated ? Number((raw as FormulaCell).result) : Number(raw);
            cell.numFmt =
              (calculated ? (raw as FormulaCell).format : undefined) ??
              (/^sign$|^allocation$/.test(section.headers[c]?.toLowerCase() ?? "")
                ? "0.####"
                : Math.abs(numericValue) > 0 && Math.abs(numericValue) < 0.0001
                  ? "0.000000E+00"
                  : DECIMAL);
          }
          if (c === 1 && item.key?.startsWith("divisor-"))
            cell.dataValidation = {
              type: "decimal",
              operator: "greaterThan",
              formulae: [0],
              showErrorMessage: true,
              errorTitle: "Positive divisor required",
              error: "Enter a fuel-energy divisor greater than zero.",
            };
          if (c === 1 && item.key === "raw-dairy.inventory.reportingMonths")
            cell.dataValidation = {
              type: "whole",
              operator: "between",
              formulae: [1, 12],
              showErrorMessage: true,
              error: "Reporting months must be an integer from 1 to 12.",
            };
          if (calculated && (raw as FormulaCell).formula.startsWith("FORMULATEXT"))
            cell.font = { name: "Arial", size: 10, color: { argb: C.muted } };
          if (typeof raw === "string" && /^https:\/\//.test(raw)) {
            cell.value = { text: raw, hyperlink: raw };
            cell.font = { name: "Arial", size: 11, color: { argb: C.green }, underline: true };
          }
          const text = calculated ? String((raw as FormulaCell).result) : String(raw ?? "");
          lines = Math.max(
            lines,
            ...text
              .split("\n")
              .map((line) => Math.ceil(line.length / ((data.widths[c] ?? 25) * 0.9))),
          );
          cell.border = {
            bottom: { style: item.total ? "thin" : "hair", color: { argb: C.line } },
          };
        });
        row.height = Math.min(409, Math.max(29, lines * 15 + 10));
      }
    }
    const firstHeader = data.sections[0]?.headerRow ?? 9;
    sheet.views = [
      {
        state: "frozen",
        ySplit: firstHeader,
        xSplit: width > 8 ? 2 : 0,
        showGridLines: false,
        zoomScale: 90,
      },
    ];
    sheet.pageSetup = {
      paperSize: 9,
      orientation: width > 3 ? "landscape" : "portrait",
      fitToPage: true,
      fitToWidth: width > 8 ? 0 : 1,
      fitToHeight: 0,
      printTitlesRow: `1:${firstHeader}`,
      ...(width > 8 ? { printTitlesColumn: "A:B" } : {}),
      printArea: `A1:${columnLetter(width)}${data.rowCount}`,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    };
    sheet.headerFooter = { oddFooter: `&LGlobal Bioenergy Watch · ${data.name}&RPage &P of &N` };
    if (data.name === "Calculation") {
      const contributions = data.sections.find(
        (s) => s.title === "Lifecycle contribution by emission source",
      );
      if (contributions && contributions.rows.length > 1)
        sheet.addConditionalFormatting({
          ref: `C${contributions.rows[0]!.number}:C${contributions.rows.at(-2)!.number}`,
          rules: [
            {
              type: "colorScale",
              priority: 1,
              cfvo: [
                { type: "num", value: 0 },
                { type: "num", value: 1 },
              ],
              color: [{ argb: C.white }, { argb: C.pale }],
            },
          ],
        });
    }
  }
  return { book, layout };
}
