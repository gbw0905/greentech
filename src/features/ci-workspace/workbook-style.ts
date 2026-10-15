import type { Cell, Workbook, Worksheet } from "exceljs";
import siteLogo from "@/assets/logo.png";

const BRAND = {
  navy: "FF0E2A43",
  green: "FF178A6B",
  pale: "FFE6F3EE",
  ink: "FF15354B",
  muted: "FF62788B",
  line: "FFDCE6ED",
  wash: "FFF2F7FA",
  white: "FFFFFFFF",
  blue: "FF2866A0",
};
export const REPORT_FORMAT = {
  decimal: '#,##0.0000;-#,##0.0000;"—"',
  integer: '#,##0;[Red](#,##0);"—"',
  money: '$#,##0.00;[Red]($#,##0.00);"—"',
};
type ReportValue = string | number | null;
export type ReportOverview = {
  metrics: { label: string; value: ReportValue; unit: string; format?: string }[];
  facts: { label: string; value: ReportValue; format?: string }[];
  contributions?: { label: string; value: number }[];
  notes: string[];
};

let logoData: Promise<string> | undefined;
async function loadLogo() {
  // The same bundled asset used by the website header. Embedded in the workbook,
  // so the logo remains visible offline and when the report is shared.
  logoData ??= fetch(siteLogo)
    .then(async (response) => {
      if (!response.ok) throw new Error("Could not load the report logo.");
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not embed the report logo."));
        reader.readAsDataURL(blob);
      });
    })
    .catch((error) => {
      logoData = undefined;
      throw error;
    });
  return logoData;
}
function fillRow(sheet: Worksheet, row: number, last: number, color: string) {
  for (let col = 1; col <= last; col++)
    sheet.getCell(row, col).fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
}
function header(
  sheet: Worksheet,
  columns: number,
  title: string,
  subtitle: string,
  image: number,
  exported: string,
) {
  for (let row = 1; row <= 4; row++)
    sheet.mergeCells(row, 1, row, sheet.name === "Overview" ? columns : Math.min(columns, 6));
  sheet.getCell("A1").value = "\u00a0".repeat(10) + "Global Bioenergy Watch";
  sheet.getCell("A1").font = {
    name: "Aptos Display",
    size: 19,
    bold: true,
    color: { argb: BRAND.navy },
  };
  sheet.getCell("A1").alignment = { vertical: "middle" };
  sheet.getRow(1).height = 44;
  sheet.addImage(image, {
    tl: { col: 0.1, row: 0 },
    ext: { width: 44, height: 57 },
    editAs: "absolute",
  });
  sheet.getCell("A2").value = title;
  sheet.getCell("A2").font = {
    name: "Aptos Display",
    size: 17,
    bold: true,
    color: { argb: BRAND.navy },
  };
  sheet.getCell("A2").alignment = { vertical: "middle", wrapText: true };
  sheet.getRow(2).height = 34;
  sheet.getCell("A3").value = `${sheet.name}  /  ${subtitle}`;
  sheet.getCell("A3").font = { name: "Aptos", size: 10, color: { argb: BRAND.muted } };
  sheet.getCell("A3").alignment = { vertical: "middle", wrapText: true };
  sheet.getRow(3).height = 34;
  sheet.getCell("A4").value = {
    text: `Exported ${exported}   ·   globalbioenergywatch.org`,
    hyperlink: "https://globalbioenergywatch.org",
  };
  sheet.getCell("A4").font = { name: "Aptos", size: 9, color: { argb: BRAND.green } };
  sheet.getCell("A4").alignment = { vertical: "middle" };
  sheet.getRow(4).height = 25;
  sheet.getCell("A4").border = { bottom: { style: "medium", color: { argb: BRAND.green } } };
  sheet.properties.tabColor = { argb: BRAND.green };
  sheet.headerFooter = { oddFooter: `&LGlobal Bioenergy Watch · ${sheet.name}&RPage &P of &N` };
}
function numeric(cell: Cell) {
  if (typeof cell.value !== "number") return;
  cell.numFmt =
    Math.abs(cell.value) > 0 && Math.abs(cell.value) < 0.0001
      ? "0.000000E+00"
      : REPORT_FORMAT.decimal;
  cell.alignment = { vertical: "middle", horizontal: "right" };
}
function section(sheet: Worksheet, row: number, title: string) {
  sheet.mergeCells(row, 1, row, 8);
  const cell = sheet.getCell(row, 1);
  cell.value = title;
  cell.font = { name: "Aptos", size: 11, bold: true, color: { argb: BRAND.navy } };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.pale } };
  cell.alignment = { vertical: "middle", indent: 1 };
  sheet.getRow(row).height = 28;
}
function overviewSheet(sheet: Worksheet, overview: ReportOverview) {
  sheet.columns = [20, 20, 3, 20, 20, 3, 20, 20].map((width) => ({ width }));
  sheet.properties.tabColor = { argb: BRAND.navy };
  sheet.views = [{ showGridLines: false, zoomScale: 90 }];
  sheet.getRow(5).height = 16;
  overview.metrics.slice(0, 3).forEach((metric, index) => {
    const start = [1, 4, 7][index]!;
    for (let row = 6; row <= 9; row++) {
      sheet.mergeCells(row, start, row, start + 1);
      const cell = sheet.getCell(row, start);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: index === 0 ? BRAND.navy : BRAND.wash },
      };
      cell.alignment = { vertical: "middle", indent: 1 };
      cell.font = {
        name: "Aptos",
        size: 10,
        color: { argb: index === 0 ? BRAND.white : BRAND.ink },
      };
    }
    sheet.getCell(6, start).value = metric.label;
    sheet.getCell(6, start).font = {
      name: "Aptos",
      size: 10,
      bold: true,
      color: { argb: index === 0 ? "FFBFE7D9" : BRAND.muted },
    };
    const value = sheet.getCell(7, start);
    value.value = metric.value ?? "Not calculated";
    value.numFmt = (metric.format ?? REPORT_FORMAT.decimal).replaceAll("[Red]", "");
    value.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    value.font = {
      name: "Aptos Display",
      size: typeof metric.value === "number" ? 23 : 14,
      bold: true,
      color: { argb: index === 0 ? BRAND.white : BRAND.green },
    };
    sheet.getCell(8, start).value = metric.unit;
    sheet.getCell(9, start).value = null;
  });
  [6, 7, 8, 9].forEach((row, index) => {
    sheet.getRow(row).height = [28, 40, 24, 8][index]!;
  });
  section(sheet, 11, "Scenario summary");
  let row = 12;
  for (const fact of overview.facts) {
    sheet.mergeCells(row, 1, row, 4);
    sheet.mergeCells(row, 5, row, 8);
    sheet.getCell(row, 1).value = fact.label;
    const value = sheet.getCell(row, 5);
    value.value = fact.value ?? "Not applicable";
    value.numFmt = fact.format ?? REPORT_FORMAT.decimal;
    fillRow(sheet, row, 8, row % 2 ? BRAND.white : BRAND.wash);
    sheet.getRow(row).height = typeof fact.value === "string" && fact.value.length > 54 ? 42 : 29;
    sheet.getRow(row).font = { name: "Aptos", size: 11, color: { argb: BRAND.ink } };
    sheet.getRow(row).alignment = { vertical: "middle", wrapText: true };
    value.font = { name: "Aptos", size: 11, bold: true, color: { argb: BRAND.navy } };
    if (typeof fact.value === "number")
      value.alignment = { horizontal: "right", vertical: "middle" };
    row++;
  }
  if (overview.contributions?.length) {
    row += 1;
    section(sheet, row++, "Lifecycle contributions");
    sheet.mergeCells(row, 1, row, 4);
    sheet.mergeCells(row, 5, row, 6);
    sheet.mergeCells(row, 7, row, 8);
    sheet.getCell(row, 1).value = "Contribution";
    sheet.getCell(row, 5).value = "gCO2e/MJ";
    sheet.getCell(row, 7).value = "Share of absolute total";
    fillRow(sheet, row, 8, BRAND.navy);
    sheet.getRow(row).height = 28;
    sheet.getRow(row).font = { name: "Aptos", size: 10, bold: true, color: { argb: BRAND.white } };
    sheet.getRow(row).alignment = { vertical: "middle", wrapText: true };
    const absolute = overview.contributions.reduce((sum, item) => sum + Math.abs(item.value), 0);
    const first = ++row;
    for (const item of overview.contributions) {
      sheet.mergeCells(row, 1, row, 4);
      sheet.mergeCells(row, 5, row, 6);
      sheet.mergeCells(row, 7, row, 8);
      sheet.getCell(row, 1).value = item.label;
      sheet.getCell(row, 5).value = item.value;
      sheet.getCell(row, 5).numFmt = REPORT_FORMAT.decimal;
      sheet.getCell(row, 7).value = absolute ? Math.abs(item.value) / absolute : 0;
      sheet.getCell(row, 7).numFmt = "0.0%";
      fillRow(sheet, row, 8, row % 2 ? BRAND.white : BRAND.wash);
      sheet.getRow(row).height = 28;
      sheet.getRow(row).font = {
        name: "Aptos",
        size: 10,
        color: { argb: item.value < 0 ? BRAND.blue : BRAND.ink },
      };
      sheet.getRow(row).alignment = { vertical: "middle" };
      row++;
    }
    sheet.addConditionalFormatting({
      ref: `G${first}:G${row - 1}`,
      rules: [
        {
          type: "colorScale",
          cfvo: [
            { type: "num", value: 0 },
            { type: "num", value: 1 },
          ],
          color: [{ argb: BRAND.white }, { argb: "FF9BD1BF" }],
          priority: 1,
        },
      ],
    });
  }
  section(sheet, ++row, "Report details");
  for (const detail of sheet.workbook.worksheets.filter((page) => page !== sheet)) {
    row++;
    sheet.mergeCells(row, 1, row, 8);
    const cell = sheet.getCell(row, 1);
    cell.value = { text: detail.name, hyperlink: `#'${detail.name.replaceAll("'", "''")}'!A1` };
    cell.font = { name: "Aptos", size: 11, color: { argb: BRAND.green }, underline: true };
    cell.alignment = { vertical: "middle", indent: 1 };
    sheet.getRow(row).height = 25;
  }
  if (overview.notes.length) {
    section(sheet, (row += 2), "Assumptions and interpretation");
    for (const note of overview.notes) {
      row++;
      sheet.mergeCells(row, 1, row, 8);
      sheet.getCell(row, 1).value = note;
      sheet.getCell(row, 1).font = { name: "Aptos", size: 10, color: { argb: BRAND.muted } };
      sheet.getCell(row, 1).alignment = { wrapText: true, vertical: "middle" };
      sheet.getRow(row).height = Math.max(28, Math.ceil(note.length / 130) * 15 + 10);
    }
  }
  sheet.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printArea: `A1:H${row}`,
    margins: { left: 0.35, right: 0.35, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
  };
}

export async function polishWorkbook(
  book: Workbook,
  title: string,
  subtitle: string,
  overview: ReportOverview,
) {
  book.creator = "Global Bioenergy Watch · CIVanta";
  book.company = "Global Bioenergy Watch";
  book.subject = title;
  book.title = title;
  const image = book.addImage({ base64: await loadLogo(), extension: "png" });
  const exported = (book.created ?? new Date()).toISOString().slice(0, 10);
  for (const sheet of book.worksheets) {
    if (sheet.name === "Overview") {
      header(sheet, 8, title, subtitle, image, exported);
      continue;
    }
    const columns = Math.max(2, sheet.columnCount);
    sheet.spliceRows(1, 0, [], [], [], []);
    header(sheet, columns, title, subtitle, image, exported);
    sheet.getRow(5).height = 32;
    sheet.getRow(5).eachCell((cell) => {
      cell.font = { name: "Aptos", size: 10, bold: true, color: { argb: BRAND.white } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.navy } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });
    for (let r = 6; r <= sheet.rowCount; r++) {
      sheet.getRow(r).eachCell((cell) => {
        if (cell.value === "") cell.value = null;
        cell.font = { name: "Aptos", size: 11, color: { argb: BRAND.ink } };
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: r % 2 === 0 ? BRAND.wash : BRAND.white },
        };
        cell.border = { bottom: { style: "hair", color: { argb: BRAND.line } } };
        numeric(cell);
        const columnHeader = String(sheet.getCell(5, cell.col).value ?? "");
        if (/^sign$|^review$/i.test(columnHeader)) cell.numFmt = "0";
        if (typeof cell.value === "string" && /^https:\/\//.test(cell.value)) {
          cell.value = { text: cell.value, hyperlink: cell.value };
          cell.font = { name: "Aptos", size: 10, color: { argb: BRAND.green }, underline: true };
        }
      });
    }
    sheet.columns.forEach((column, index) => {
      const label = String(sheet.getCell(5, index + 1).value ?? "");
      column.width = /source|url|detail|pathway|input|label|classification/i.test(label)
        ? 46
        : /sign|allocation/i.test(label)
          ? 12
          : index === 0
            ? 36
            : columns === 2
              ? 68
              : 23;
    });
    for (let r = 6; r <= sheet.rowCount; r++) {
      let lines = 1;
      sheet.getRow(r).eachCell((cell, column) => {
        const value = cell.text;
        const wrappedLines = value
          .split("\n")
          .reduce(
            (total, line) =>
              total +
              Math.max(1, Math.ceil(line.length / ((sheet.getColumn(column).width ?? 24) * 0.78))),
            0,
          );
        lines = Math.max(lines, wrappedLines);
      });
      sheet.getRow(r).height = Math.min(409, Math.max(29, lines * 15 + 10));
    }
    sheet.views = [
      {
        state: "frozen",
        ySplit: 5,
        xSplit: columns > 8 ? 2 : 0,
        showGridLines: false,
        zoomScale: 90,
      },
    ];
    sheet.autoFilter = {
      from: { row: 5, column: 1 },
      to: { row: Math.max(5, sheet.rowCount), column: columns },
    };
    sheet.pageSetup = {
      paperSize: 9,
      orientation: columns > 3 ? "landscape" : "portrait",
      fitToPage: true,
      fitToWidth: columns > 8 ? 0 : 1,
      fitToHeight: 0,
      printTitlesRow: "1:5",
      ...(columns > 8 ? { printTitlesColumn: "A:B" } : {}),
      printArea: `A1:${sheet.getColumn(columns).letter}${sheet.rowCount}`,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
    };
  }
  overviewSheet(book.getWorksheet("Overview")!, overview);
}
