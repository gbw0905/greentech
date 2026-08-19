import { Download } from "lucide-react";
import { downloadBrandedCsv, type BrandedExport } from "@/lib/branded-export";

/** Shared "Export CSV" action for chart panels. */
export function ExportCsvButton({
  build,
  disabled,
}: {
  build: () => BrandedExport;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => downloadBrandedCsv(build())}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 border border-ink bg-ink px-2.5 py-1.5 text-xs font-semibold text-ink-foreground transition-opacity hover:opacity-85 disabled:opacity-40"
    >
      <Download className="size-3.5" />
      Export CSV
    </button>
  );
}
