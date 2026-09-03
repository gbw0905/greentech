import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

/** Inline notice shown when a gated action (CSV export, email summary) needs sign-in. */
export function SignInPrompt({ action }: { action: string }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-sm border border-border bg-background p-3">
      <Lock className="size-3.5 shrink-0 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Sign in to {action}. It is free.</p>
      <Link
        to="/auth"
        className="inline-flex items-center gap-1.5 border border-ink bg-ink px-2.5 py-1.5 text-xs font-semibold text-ink-foreground transition-opacity hover:opacity-85"
      >
        Sign in
      </Link>
    </div>
  );
}
