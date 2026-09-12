import logoUrl from "@/assets/logo.png";

const SITE = "Global Bioenergy Watch";
const SITE_URL = "https://www.globalbioenergywatch.org";
const NAVY = "FF0B1F3A";

/** A single cell: literal text/number, or a formula referencing other rows. */
export type CellValue = string | number | { formula: string };

/**
 * A row is either plain cells, or a keyed row whose value cell can be
 * referenced from later formulas via {{cell:KEY}} / {{range:KEY1..KEY2}}.
 */
export type SheetRow =
  | CellValue[]
  | { key?: string; refCol?: number; bold?: boolean; cells: CellValue[] };

export type SheetSection = {
  title?: string;
  header?: string[];
  rows: SheetRow[];
};

export type SheetSpec = {
  name: string;
  intro?: string;
  sections: SheetSection[];
  columnWidths?: number[];
  charts?: WorkbookChart[];
};

export type WorkbookChart = {
  title: string;
  kind: "contribution" | "comparison";
  categories: string[];
  series: { name: string; values: number[]; color: string }[];
  unit: string;
};

export type WorkbookExport = {
  title: string;
  /** Filename without extension. */
  filename: string;
  note?: string;
  sheets: SheetSpec[];
};

async function logoBuffer(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(logoUrl);
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

const chartImage = (chart: WorkbookChart) => {
  const width = 1200;
  const height = 600;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const plot = { left: 92, top: 92, right: 1160, bottom: 480 };
  const values = chart.series.flatMap((series) => series.values);
  const rawMin = Math.min(0, ...values);
  const rawMax = Math.max(0, ...values);
  const span = Math.max(rawMax - rawMin, 1);
  const min = rawMin < 0 ? rawMin - span * 0.08 : 0;
  const max = rawMax + span * 0.12;
  const y = (value: number) => plot.bottom - ((value - min) / (max - min)) * (plot.bottom - plot.top);
  const zeroY = y(0);

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#0B1F3A";
  ctx.font = "bold 28px Arial";
  ctx.fillText(chart.title, plot.left, 42);
  ctx.fillStyle = "#536273";
  ctx.font = "16px Arial";
  ctx.fillText(chart.unit, plot.left, 70);

  ctx.font = "14px Arial";
  for (let i = 0; i <= 4; i += 1) {
    const value = min + ((max - min) * i) / 4;
    const lineY = y(value);
    ctx.strokeStyle = "#DDE3E8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plot.left, lineY);
    ctx.lineTo(plot.right, lineY);
    ctx.stroke();
    ctx.fillStyle = "#536273";
    ctx.textAlign = "right";
    ctx.fillText(value.toFixed(1), plot.left - 12, lineY + 5);
  }
  ctx.strokeStyle = "#0B1F3A";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(plot.left, zeroY);
  ctx.lineTo(plot.right, zeroY);
  ctx.stroke();

  const groupWidth = (plot.right - plot.left) / Math.max(chart.categories.length, 1);
  const barWidth = Math.min(38, (groupWidth * 0.72) / Math.max(chart.series.length, 1));
  chart.categories.forEach((category, categoryIndex) => {
    const center = plot.left + groupWidth * (categoryIndex + 0.5);
    chart.series.forEach((series, seriesIndex) => {
      const value = series.values[categoryIndex] ?? 0;
      const barX = center + (seriesIndex - (chart.series.length - 1) / 2) * barWidth - barWidth * 0.42;
      const valueY = y(value);
      ctx.fillStyle = series.color;
      ctx.fillRect(barX, Math.min(valueY, zeroY), barWidth * 0.84, Math.max(Math.abs(zeroY - valueY), 2));
      ctx.fillStyle = value < 0 ? "#B91C1C" : "#0B1F3A";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(value.toFixed(1), barX + barWidth * 0.42, value < 0 ? valueY + 17 : valueY - 7);
    });
    ctx.save();
    ctx.translate(center, plot.bottom + 18);
    ctx.rotate(-Math.PI / 5);
    ctx.fillStyle = "#263746";
    ctx.font = "12px Arial";
    ctx.textAlign = "right";
    ctx.fillText(category, 0, 0);
    ctx.restore();
  });

  let legendX = plot.left;
  chart.series.forEach((series) => {
    ctx.fillStyle = series.color;
    ctx.fillRect(legendX, 555, 16, 16);
    ctx.fillStyle = "#263746";
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    ctx.fillText(series.name, legendX + 23, 568);
    legendX += ctx.measureText(series.name).width + 64;
  });
  return canvas.toDataURL("image/png");
};

/** Multi-sheet .xlsx export with the site logo embedded on every sheet. */
export async function downloadExcelWorkbook(spec: WorkbookExport) {
  const [{ default: ExcelJS }, logo] = await Promise.all([
    import("exceljs"),
    logoBuffer(),
  ]);

  const stamp = new Date().toISOString().slice(0, 10);
  const wb = new ExcelJS.Workbook();
  wb.creator = SITE;
  wb.created = new Date();

  const imageId =
    logo != null ? wb.addImage({ buffer: logo as never, extension: "png" }) : null;

  wb.calcProperties.fullCalcOnLoad = true;

  const colLetter = (index: number) => {
    let n = index;
    let out = "";
    while (n > 0) {
      const rem = (n - 1) % 26;
      out = String.fromCharCode(65 + rem) + out;
      n = Math.floor((n - 1) / 26);
    }
    return out || "A";
  };
  const refs = new Map<string, string>();
  const resolve = (formula: string, rowNumber: number) =>
    formula
      .replace(/\{\{range:([^}.]+)\.\.([^}]+)\}\}/g, (_m, a: string, b: string) => {
        const from = refs.get(a.trim());
        const to = refs.get(b.trim());
        return from && to ? `${from}:${to}` : "0";
      })
      .replace(/\{\{cell:([^}]+)\}\}/g, (_m, k: string) => refs.get(k.trim()) ?? "0")
      .replace(/\{r\}/g, String(rowNumber));

  for (const sheet of spec.sheets) {
    const ws = wb.addWorksheet(sheet.name.slice(0, 31));
    const widths = sheet.columnWidths ?? [34, 34, 40, 18, 22, 30];
    ws.columns = widths.map((width) => ({ width }));

    if (imageId != null) {
      ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 96, height: 96 } });
    }
    ws.getRow(1).height = 76;
    ws.addRow([]);

    const banner = (text: string, bold = false, size = 11) => {
      const row = ws.addRow([text]);
      row.getCell(1).font = { name: "Arial", bold, size, color: { argb: NAVY } };
      return row;
    };
    banner(SITE, true, 16);
    banner(spec.title, true, 12);
    banner(`${sheet.name} · Exported ${stamp} · ${SITE_URL}`);
    if (sheet.intro) banner(sheet.intro);
    if (spec.note) banner(spec.note);
    ws.addRow([]);

    for (const section of sheet.sections) {
      if (section.title) {
        const t = ws.addRow([section.title]);
        t.getCell(1).font = { name: "Arial", bold: true, size: 12, color: { argb: "FFFFFFFF" } };
        t.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
      }
      if (section.header) {
        const h = ws.addRow(section.header);
        h.eachCell((c) => {
          c.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
          c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4D2E" } };
          c.alignment = { vertical: "middle", wrapText: true };
        });
      }
      for (const r of section.rows) {
        const spec = Array.isArray(r) ? { cells: r } : r;
        const row = ws.addRow(spec.cells.map((c) => (typeof c === "object" ? null : c)));
        if (spec.key) {
          refs.set(spec.key, `${colLetter(spec.refCol ?? 2)}${row.number}`);
        }
        spec.cells.forEach((cell, index) => {
          if (typeof cell === "object" && cell !== null && "formula" in cell) {
            row.getCell(index + 1).value = { formula: resolve(cell.formula, row.number) } as never;
          }
        });
        row.eachCell((c) => {
          c.font = { name: "Arial", size: 10, bold: spec.bold === true };
          c.alignment = { vertical: "top", wrapText: true };
        });
      }
      ws.addRow([]);
    }

    for (const chart of sheet.charts ?? []) {
      const image = chartImage(chart);
      if (!image) continue;
      const titleRow = ws.addRow([chart.title]);
      titleRow.getCell(1).font = { name: "Arial", bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
      const chartStartRow = ws.rowCount + 1;
      const chartId = wb.addImage({ base64: image, extension: "png" });
      ws.addImage(chartId, {
        tl: { col: 0, row: chartStartRow - 1 },
        ext: { width: 900, height: 450 },
      });
      for (let row = chartStartRow; row < chartStartRow + 24; row += 1) {
        ws.getRow(row).height = 15;
      }
      ws.addRow([]);
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${spec.filename}-${stamp}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
