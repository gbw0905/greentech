import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { FuelType, Region } from "./policy-taxonomy";
import type { PolicyFeed } from "./policy-types";

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

async function readFeed(): Promise<PolicyFeed> {
  const fetchedAt = new Date().toISOString();
  const { data, error } = await publicClient()
    .from("policy_updates")
    .select(
      "url,title,summary,source,published_at,region,country_slug,country_name,fuels,created_at,category",
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(400);

  if (error) return { updates: [], fetchedAt, error: error.message };

  return {
    updates: (data ?? []).map((r) => ({
      id: r.url,
      title: r.title,
      category: ((r as { category?: string }).category === "market" ? "market" : "policy") as
        | "policy"
        | "market",
      summary: r.summary ?? "",
      url: r.url,
      source: r.source ?? "",
      publishedAt: r.published_at,
      createdAt: r.created_at ?? fetchedAt,
      region: (r.region ?? "Global") as Region,
      countrySlug: r.country_slug,
      countryName: r.country_name,
      fuels: (r.fuels ?? []) as FuelType[],
    })),
    fetchedAt,
    error: null,
  };
}

export const getPolicyFeed = createServerFn({ method: "GET" }).handler(async () => {
  const feed = await readFeed();
  if (feed.updates.length > 0) return feed;
  // Cold start: fill the archive on the very first visit.
  const { ingestPolicyUpdates } = await import("./policy-ingest.server");
  try {
    await ingestPolicyUpdates();
  } catch (e) {
    return { ...feed, error: e instanceof Error ? e.message : String(e) };
  }
  return readFeed();
});

export const refreshPolicyFeed = createServerFn({ method: "POST" }).handler(async () => {
  const { ingestPolicyUpdates } = await import("./policy-ingest.server");
  const result = await ingestPolicyUpdates();
  return { ...(await readFeed()), ingested: result.kept };
});
