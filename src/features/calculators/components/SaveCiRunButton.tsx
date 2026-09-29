import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, Save } from "lucide-react";
import { saveCiRunFn, type SavedProgram } from "@/features/calculators/server-functions";

export interface CiRunPayload {
  pathwayId: string;
  pathwayLabel: string;
  feedstockLabel: string;
  regionLabel: string;
  ciTotal: number;
  grossCi: number;
  creditsCi: number;
  annualEnergyMj: number;
  annualTonnesCo2e: number;
  inputs: unknown;
  programs: SavedProgram[];
}

/** Saves the current scenario to the member's own results dashboard. */
export function SaveCiRunButton({ build }: { build: () => CiRunPayload }) {
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      const payload = build();
      return saveCiRunFn({ data: { ...payload, name: name.trim() || payload.pathwayLabel } });
    },
    onSuccess: () => {
      setSaved(true);
      setName("");
      queryClient.invalidateQueries({ queryKey: ["ci-runs"] });
    },
  });

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <div className="flex w-full flex-wrap items-center gap-2">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          placeholder="Name this scenario"
          aria-label="Scenario name"
          className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground focus:border-accent focus:outline-none sm:w-56 sm:flex-none"
        />
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="inline-flex items-center gap-1.5 border border-ink bg-ink px-2.5 py-1.5 text-xs font-semibold text-ink-foreground transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          {saved ? <Check className="size-3.5" /> : <Save className="size-3.5" />}
          {save.isPending ? "Saving…" : saved ? "Saved" : "Save to my dashboard"}
        </button>
      </div>
      {saved ? (
        <p className="text-xs text-muted-foreground">
          Saved.{" "}
          <Link to="/my-results" className="font-semibold text-foreground underline">
            Open my results dashboard
          </Link>
        </p>
      ) : null}
      {save.isError ? (
        <p className="text-xs text-muted-foreground">
          Could not save this scenario. Please try again.
        </p>
      ) : null}
    </div>
  );
}
