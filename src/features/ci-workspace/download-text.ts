export function downloadTextFile(name: string, content: string, mime: string) {
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = safeName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
