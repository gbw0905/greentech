import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface SavedProgram {
  id: string;
  label: string;
  jurisdiction: string;
  benchmark: number | null;
  savingPct: number | null;
  gapPerMj: number | null;
  meetsThreshold: boolean | null;
}

export interface SavedCiRun {
  id: string;
  name: string;
  pathwayId: string;
  pathwayLabel: string;
  feedstockLabel: string;
  regionLabel: string;
  ciTotal: number;
  grossCi: number;
  creditsCi: number;
  annualEnergyMj: number;
  annualTonnesCo2e: number;
  programs: SavedProgram[];
  createdAt: string;
}

interface SaveInput {
  name: string;
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

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

type Row = {
  id: string;
  name: string;
  pathway_id: string;
  pathway_label: string;
  feedstock_label: string;
  region_label: string;
  ci_total: number | string;
  gross_ci: number | string;
  credits_ci: number | string;
  annual_energy_mj: number | string;
  annual_tonnes_co2e: number | string;
  programs: unknown;
  created_at: string;
};

function toRun(r: Row): SavedCiRun {
  return {
    id: r.id,
    name: r.name,
    pathwayId: r.pathway_id,
    pathwayLabel: r.pathway_label,
    feedstockLabel: r.feedstock_label,
    regionLabel: r.region_label,
    ciTotal: Number(r.ci_total),
    grossCi: Number(r.gross_ci),
    creditsCi: Number(r.credits_ci),
    annualEnergyMj: Number(r.annual_energy_mj),
    annualTonnesCo2e: Number(r.annual_tonnes_co2e),
    programs: Array.isArray(r.programs) ? (r.programs as SavedProgram[]) : [],
    createdAt: r.created_at,
  };
}

/** Persist the current calculator scenario to the member's own dashboard. */
export const saveCiRunFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: SaveInput) => data)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("ci_runs")
      .insert({
        user_id: context.userId,
        name: (data.name || "Untitled scenario").slice(0, 120),
        pathway_id: String(data.pathwayId).slice(0, 80),
        pathway_label: String(data.pathwayLabel).slice(0, 200),
        feedstock_label: String(data.feedstockLabel ?? "").slice(0, 200),
        region_label: String(data.regionLabel ?? "").slice(0, 200),
        ci_total: n(data.ciTotal),
        gross_ci: n(data.grossCi),
        credits_ci: n(data.creditsCi),
        annual_energy_mj: n(data.annualEnergyMj),
        annual_tonnes_co2e: n(data.annualTonnesCo2e),
        inputs: JSON.parse(JSON.stringify(data.inputs ?? {})),
        programs: JSON.parse(JSON.stringify(data.programs ?? [])),
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return toRun(row as unknown as Row);
  });

/** All saved results for the signed-in member, newest first. */
export const listCiRunsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("ci_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as Row[]).map(toRun);
  });

/** Remove one of the member's own saved results. */
export const deleteCiRunFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("ci_runs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Rename one of the member's own saved results. */
export const renameCiRunFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; name: string }) => data)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("ci_runs")
      .update({ name: (data.name || "Untitled scenario").slice(0, 120) })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
