import logoUrl from "@/assets/logo.png";

const SITE = "Global Bioenergy Watch";
const SITE_URL = "https://www.globalbioenergywatch.org";
const NAVY = "FF0B1F3A";

export type SheetSection = {
  title?: string;
  header?: string[];
  rows: (string | number)[][];
};

export type SheetSpec = {
  name: string;
  intro?: string;
  sections: SheetSection[];
  columnWidths?: number[];
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
        const row = ws.addRow(r);
        row.eachCell((c) => {
          c.font = { name: "Arial", size: 10 };
          c.alignment = { vertical: "top", wrapText: true };
        });
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
