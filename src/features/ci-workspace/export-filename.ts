/** Keep workbook names useful when several pathways are downloaded together. */
export function pathwayExportFilename(
  pathwayLabel: string,
  tool: "workspace" | "credit" | "optimizer",
  extension: "xlsx" | "csv" = "xlsx",
  now = new Date(),
): string {
  const pathway =
    pathwayLabel
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\([^)]*\)/g, "")
      .split(/\s+[—–-]\s+/)
      .map((part) =>
        (part.match(/[A-Za-z0-9]+/g) ?? [])
          .map((word) =>
            word.length > 1 && word.length <= 5 && word === word.toUpperCase()
              ? word
              : word[0]!.toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join("")
          .slice(0, 48),
      )
      .filter(Boolean)
      .join("_") || "Pathway";
  const toolName = tool === "workspace" ? "" : tool === "credit" ? "CreditRIN_" : "Optimizer_";
  const timestamp = now.toISOString().replace(/[-:]/g, "").replace("T", "_").slice(0, 15);
  return `CIvanta_${toolName}${pathway}_${timestamp}.${extension}`;
}
