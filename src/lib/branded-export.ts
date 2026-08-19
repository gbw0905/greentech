import logoUrl from "@/assets/logo.png";

const SITE = "Global Bioenergy Watch";
const SITE_URL = "https://www.globalbioenergywatch.org";

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const esc = (v: string | number) =>
  String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function logoDataUri(): Promise<string | null> {
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = () => resolve(null);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export type BrandedExport = {
  title: string;
  filename: string; // without extension
  header: string[];
  rows: (string | number)[][];
  note?: string;
};

/** CSV with a branded text banner on top (CSV cannot hold images). */
export function downloadBrandedCsv(x: BrandedExport) {
  const stamp = new Date().toISOString().slice(0, 10);
  const banner = [
    [SITE],
    [x.title],
    [`Exported ${stamp}`],
    [SITE_URL],
    ...(x.note ? [[x.note]] : []),
    [],
  ];
  const csv = [...banner, x.header, ...x.rows]
    .map((r) => r.map(cell).join(","))
    .join("\r\n");
  save(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), `${x.filename}-${stamp}.csv`);
}

/** Excel-compatible workbook (.xls via HTML) with the actual logo image embedded. */
export async function downloadBrandedExcel(x: BrandedExport) {
  const stamp = new Date().toISOString().slice(0, 10);
  const src = await logoDataUri();
  const cols = x.header.length;
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8" /></head>
<body>
<table border="0">
<tr><td colspan="${cols}">${src ? `<img src="${src}" width="120" height="120" alt="${SITE}" />` : ""}</td></tr>
<tr><td colspan="${cols}" style="font-size:18pt;font-weight:bold;color:#0b1f3a">${esc(SITE)}</td></tr>
<tr><td colspan="${cols}" style="font-size:12pt;font-weight:bold">${esc(x.title)}</td></tr>
<tr><td colspan="${cols}">Exported ${stamp} — ${SITE_URL}</td></tr>
${x.note ? `<tr><td colspan="${cols}">${esc(x.note)}</td></tr>` : ""}
<tr><td colspan="${cols}"></td></tr>
<tr>${x.header.map((h) => `<th style="background:#0b1f3a;color:#fff;text-align:left">${esc(h)}</th>`).join("")}</tr>
${x.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}
</table>
</body></html>`;
  save(new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" }), `${x.filename}-${stamp}.xls`);
}
