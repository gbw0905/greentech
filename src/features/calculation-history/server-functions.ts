import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPremiumStatusFn } from "@/features/premium/server-functions";
import { historyInputSchema, type CalculationRun } from "./contracts";

// Versioned snapshots use the existing private scenario repository and its user RLS.
// Credit metrics live in the JSON snapshot; legacy CI reports exclude these tagged rows.
export const saveCalculationRunFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => historyInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("ci_runs")
      .insert({
        user_id: context.userId,
        name: data.name,
        pathway_id: `civanta/${data.kind}`,
        pathway_label: data.pathway,
        ci_total: data.metrics.ci ?? 0,
        inputs: JSON.parse(JSON.stringify({ civantaHistoryVersion: 1, ...data })),
        programs: [],
      })
      .select("id,created_at")
      .single();
    if (error) throw new Error("Could not save calculation history. Please try again.");
    return { ...data, id: row.id, createdAt: row.created_at } satisfies CalculationRun;
  });
export const listCalculationRunsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        page: z.number().int().min(0).max(100000).default(0),
        kind: z.enum(["ci", "credit", "optimizer"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data: params, context }) => {
    const query = context.supabase
      .from("ci_runs")
      .select("id,created_at,inputs", { count: "exact" })
      .eq("user_id", context.userId)
      .in(
        "pathway_id",
        params.kind
          ? [`civanta/${params.kind}`]
          : ["civanta/ci", "civanta/credit", "civanta/optimizer"],
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(params.page * 15, params.page * 15 + 14);
    const { data, error, count } = await query;
    if (error) throw new Error("Could not load calculation history.");
    const runs = (data ?? []).flatMap((row) => {
      const parsed = historyInputSchema.omit({ snapshot: true }).safeParse(row.inputs);
      return parsed.success ? [{ ...parsed.data, id: row.id, createdAt: row.created_at }] : [];
    });
    return { runs, total: count ?? 0 };
  });
export const getCalculationRunFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (!(await getPremiumStatusFn()).premium)
      throw new Error("CIVanta Pro is required to open saved runs and download reports.");
    const { data: row, error } = await context.supabase
      .from("ci_runs")
      .select("id,created_at,inputs")
      .eq("user_id", context.userId)
      .eq("id", data.id)
      .in("pathway_id", ["civanta/ci", "civanta/credit", "civanta/optimizer"])
      .single();
    if (error || !row) throw new Error("This calculation could not be found in your account.");
    return {
      ...historyInputSchema.parse(row.inputs),
      id: row.id,
      createdAt: row.created_at,
    } satisfies CalculationRun;
  });
