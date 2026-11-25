import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { FuelType, Region } from "./taxonomy";
import type { PolicyFeed } from "./contracts";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/**
 * When the archive last received data from the collection job. `updated_at` is
 * bumped by a trigger whenever the ingest upserts a row, so the newest value is
 * the time of the last successful collection — not the time of this request.
 */
async function lastCollectedAt(): Promise<string | null> {
  const { data, error } = await publicClient()
    .from("policy_updates")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data.updated_at;
}

async function readFeed(): Promise<PolicyFeed> {
  const [collectedAt, result] = await Promise.all([
    lastCollectedAt(),
    publicClient()
      .from("policy_updates")
      .select(
        "url,title,summary,source,published_at,region,country_slug,country_name,fuels,created_at,category",
      )
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);
  const { data, error } = result;
  // Empty string (not "now") when unknown, so the UI never shows today's date
  // for data that may be older.
  const fetchedAt = collectedAt ?? "";

  if (error) return { updates: [], fetchedAt, error: error.message };

  return {
    updates: (data ?? []).map((r) => ({
      id: r.url,
      title: r.title,
      category: ((r as { category?: string }).category === "market" ? "market" : "policy") as
        "policy" | "market",
      summary: r.summary ?? "",
      url: r.url,
      source: r.source ?? "",
      publishedAt: r.published_at,
      createdAt: r.created_at ?? r.published_at ?? "",
      region: (r.region ?? "Global") as Region,
      countrySlug: r.country_slug,
      countryName: r.country_name,
      fuels: (r.fuels ?? []) as FuelType[],
    })),
    fetchedAt,
    error: null,
  };
}

/**
 * Read-only: visitors never trigger collection. The archive is filled by the
 * scheduled ingest (`/api/public/ingest-policy` and `/api/public/scheduled-jobs`).
 */
export const getPolicyFeed = createServerFn({ method: "GET" }).handler(async () => readFeed());
