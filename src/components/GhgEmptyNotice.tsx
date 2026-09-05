import { Leaf } from "lucide-react";

/**
 * Shown in place of a chart when the "GHG savings (reported)" measure is
 * selected but none of the visible entities has published a verified figure.
 * We never estimate emissions savings, so an all-zero chart would be
 * meaningless — this explains the gap instead.
 */
export function GhgEmptyNotice() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
      <Leaf className="h-6 w-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-semibold text-foreground">
        No reported GHG savings in this view
      </p>
      <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
        None of the entities shown here have published a verified greenhouse-gas
        savings figure. We only chart numbers a company or official agency has
        reported — nothing is estimated — so there is nothing to plot yet. Try
        another measure, or check back as more disclosures are added.
      </p>
    </div>
  );
}
