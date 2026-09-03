import { useState } from "react";
import { Download, Lock } from "lucide-react";
import { downloadBrandedCsv, type BrandedExport } from "@/lib/branded-export";
import { useAuthSession } from "@/hooks/useAuthSession";
import { SignInPrompt } from "@/components/SignInPrompt";

/** Shared "Export CSV" action for chart panels. Requires a signed-in user. */
export function ExportCsvButton({
  build,
  disabled,
}: {
  build: () => BrandedExport;
  disabled?: boolean;
}) {
  const { signedIn, loading } = useAuthSession();
  const [askSignIn, setAskSignIn] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!signedIn) {
            setAskSignIn(true);
            return;
          }
          downloadBrandedCsv(build());
        }}
        disabled={disabled || loading}
        title={signedIn ? "Download the current view as CSV" : "Sign in to download CSV"}
        className="inline-flex items-center gap-1.5 border border-ink bg-ink px-2.5 py-1.5 text-xs font-semibold text-ink-foreground transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        {signedIn ? <Download className="size-3.5" /> : <Lock className="size-3.5" />}
        Export CSV
      </button>

      {askSignIn && !signedIn ? <SignInPrompt action="download this data as CSV" /> : null}
    </>
  );
}
