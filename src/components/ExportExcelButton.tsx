import { useState } from "react";
import { Download, Lock } from "lucide-react";
import { capture } from "@/features/analytics/client";
import { downloadExcelWorkbook, type WorkbookExport } from "@/shared/export/excel-workbook";
import { SignInPrompt } from "@/features/auth/components/SignInPrompt";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";

/** Sign-in gated multi-sheet Excel download. */
export function ExportExcelButton({
  build,
  disabled,
  label = "Export Excel",
}: {
  build: () => WorkbookExport;
  disabled?: boolean;
  label?: string;
}) {
  const { signedIn, loading } = useAuthSession();
  const [askSignIn, setAskSignIn] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (!signedIn) {
            setAskSignIn(true);
            return;
          }
          setBusy(true);
          try {
            await downloadExcelWorkbook(build());
            capture("excel_export_downloaded");
          } finally {
            setBusy(false);
          }
        }}
        disabled={disabled || loading || busy}
        title={
          signedIn ? "Download the full calculation as an Excel workbook" : "Sign in to download"
        }
        className="inline-flex items-center gap-1.5 border border-ink bg-ink px-2.5 py-1.5 text-xs font-semibold text-ink-foreground transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        {signedIn ? <Download className="size-3.5" /> : <Lock className="size-3.5" />}
        {busy ? "Preparing…" : label}
      </button>

      {askSignIn && !signedIn ? <SignInPrompt action="download this workbook" /> : null}
    </>
  );
}
