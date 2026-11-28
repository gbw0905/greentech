import { createHash } from "node:crypto";
import { z } from "zod";
import { readJson, RequestBodyError } from "@/infrastructure/http/server/request-body.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

// The workspace and profile call these through /api/civanta-* with the member's
// cookie session. Every query is scoped to that member's user id.

const MAX_BODY_BYTES = 400_000;
const PLANT_SUMMARY = "id,name,pathway_id,pathway_label,calculated,latest_ci,created_at,updated_at";
const CALCULATION_SUMMARY =
  "id,plant_id,plant_name,pathway_id,pathway_label,ci,engine_version,created_at";

export class CivantaHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const jsonObject = z.record(z.string(), z.unknown());

const plantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  pathwayId: z.string().max(100).default(""),
  pathwayLabel: z.string().max(200).default(""),
  model: jsonObject.nullable(),
});

const calculationSchema = z.object({
  plantId: z.string().uuid(),
  pathwayId: z.string().min(1).max(100),
  pathwayLabel: z.string().max(200).default(""),
  ci: z.number().finite(),
  parts: z.record(z.string(), z.number().finite()),
  inputs: jsonObject,
  engineVersion: z.string().min(1).max(60),
});

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await readJson(request, MAX_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyError) throw new CivantaHttpError(error.status, error.message);
    throw error;
  }
}

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new CivantaHttpError(400, "Invalid plant data.");
  return result.data;
}

export async function listPlants(userId: string, summary: boolean) {
  const { data, error } = await supabaseAdmin
    .from("civanta_plants")
    .select(summary ? PLANT_SUMMARY : `${PLANT_SUMMARY},model`)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

export async function savePlant(userId: string, input: unknown) {
  const plant = parse(plantSchema, input);
  const ci = plant.model?.["ci"];
  const calculated = plant.model?.["calculated"] === true && Number.isFinite(ci);
  const row = {
    name: plant.name,
    pathway_id: plant.pathwayId,
    pathway_label: plant.pathwayLabel,
    calculated,
    latest_ci: calculated ? (ci as number) : null,
    model: plant.model as Json,
  };
  // Update first so a client-chosen id can never overwrite another member's plant.
  const updated = await supabaseAdmin
    .from("civanta_plants")
    .update(row)
    .eq("id", plant.id)
    .eq("user_id", userId)
    .select("id,updated_at")
    .maybeSingle();
  if (updated.error) throw updated.error;
  if (updated.data) return updated.data;
  const inserted = await supabaseAdmin
    .from("civanta_plants")
    .insert({ ...row, id: plant.id, user_id: userId })
    .select("id,updated_at")
    .single();
  if (inserted.error?.code === "23505")
    throw new CivantaHttpError(409, "Plant id is already in use.");
  if (inserted.error) throw inserted.error;
  return inserted.data;
}

export async function deletePlant(userId: string, id: string | null) {
  if (!id || !z.string().uuid().safeParse(id).success)
    throw new CivantaHttpError(400, "Missing plant id.");
  const { error } = await supabaseAdmin
    .from("civanta_plants")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function recordCalculation(userId: string, input: unknown) {
  const calc = parse(calculationSchema, input);
  const { data: plant, error: plantError } = await supabaseAdmin
    .from("civanta_plants")
    .select("id,name")
    .eq("id", calc.plantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (plantError) throw plantError;
  if (!plant) throw new CivantaHttpError(404, "Save the plant before recording a calculation.");

  const inputHash = createHash("sha256")
    .update(JSON.stringify([calc.engineVersion, calc.inputs]))
    .digest("hex");
  // Pressing Calculate again on unchanged inputs keeps the history free of duplicates.
  const { data: latest, error: latestError } = await supabaseAdmin
    .from("civanta_calculations")
    .select(`${CALCULATION_SUMMARY},input_hash`)
    .eq("plant_id", plant.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw latestError;
  if (latest?.input_hash === inputHash) {
    const { input_hash: _hash, ...summary } = latest;
    return { ...summary, duplicate: true };
  }

  const { data, error } = await supabaseAdmin
    .from("civanta_calculations")
    .insert({
      user_id: userId,
      plant_id: plant.id,
      plant_name: plant.name,
      pathway_id: calc.pathwayId,
      pathway_label: calc.pathwayLabel,
      ci: calc.ci,
      parts: calc.parts,
      inputs: calc.inputs as Json,
      input_hash: inputHash,
      engine_version: calc.engineVersion,
    })
    .select(CALCULATION_SUMMARY)
    .single();
  if (error) throw error;
  return { ...data, duplicate: false };
}

export async function listCalculations(userId: string, params: URLSearchParams) {
  const plantId = params.get("plantId");
  const limit = Math.min(Math.max(Number(params.get("limit")) || 100, 1), 500);
  let query = supabaseAdmin
    .from("civanta_calculations")
    .select(CALCULATION_SUMMARY)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (plantId) {
    if (!z.string().uuid().safeParse(plantId).success)
      throw new CivantaHttpError(400, "Invalid plant id.");
    query = query.eq("plant_id", plantId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getCalculation(userId: string, id: string | null) {
  if (!id || !z.string().uuid().safeParse(id).success)
    throw new CivantaHttpError(400, "Missing calculation id.");
  const { data, error } = await supabaseAdmin
    .from("civanta_calculations")
    .select(`${CALCULATION_SUMMARY},parts,inputs`)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new CivantaHttpError(404, "Calculation not found.");
  return data;
}

export function civantaErrorResponse(error: unknown, fallback: string) {
  if (error instanceof CivantaHttpError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error(fallback, error);
  return Response.json({ error: fallback }, { status: 500 });
}
