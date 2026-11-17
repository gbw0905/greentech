import { useState } from "react";
import { createPortal } from "react-dom";
import { usePostHog } from "@posthog/react";
import { Download, Lock } from "lucide-react";
import { downloadBrandedCsv, type BrandedExport } from "@/shared/export/branded-export";
import { SignInPrompt } from "@/features/auth/components/SignInPrompt";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";

/** Shared "Export CSV" action for chart panels. Requires a signed-in user. */
export function ExportCsvButton({
  build,
  disabled,
  portalTarget,
}: {
  build: () => BrandedExport;
  disabled?: boolean;
  /** When supplied, the sign-in prompt is rendered here instead of inline. */
  portalTarget?: HTMLElement | null;
}) {
  const { signedIn, loading } = useAuthSession();
  const posthog = usePostHog();
  const [askSignIn, setAskSignIn] = useState(false);

  const prompt =
    askSignIn && !signedIn ? <SignInPrompt action="download this data as CSV" /> : null;

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
          posthog.capture("csv_export_downloaded");
        }}
        disabled={disabled || loading}
        title={signedIn ? "Download the current view as CSV" : "Sign in to download CSV"}
        className="inline-flex items-center gap-1.5 border border-ink bg-ink px-2.5 py-1.5 text-xs font-semibold text-ink-foreground transition-opacity hover:opacity-85 disabled:opacity-40"
      >
        {signedIn ? <Download className="size-3.5" /> : <Lock className="size-3.5" />}
        Export CSV
      </button>

      {portalTarget && prompt ? createPortal(prompt, portalTarget) : prompt}
    </>
  );
}
