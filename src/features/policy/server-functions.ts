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

async function readFeed(): Promise<PolicyFeed> {
  const fetchedAt = new Date().toISOString();
  const { data, error } = await publicClient()
    .from("policy_updates")
    .select(
      "url,title,summary,source,published_at,region,country_slug,country_name,fuels,created_at,category",
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1000);

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

const STALE_THRESHOLD = 4 * 60 * 60 * 1000; // 4 hours
let lastBackgroundIngest = 0;

export const getPolicyFeed = createServerFn({ method: "GET" }).handler(async () => {
  const feed = await readFeed();

  if (feed.updates.length === 0) {
    // Cold start: fill the archive on the very first visit.
    const { ingestPolicyUpdates } = await import("./server/policy-ingest.server");
    try {
      await ingestPolicyUpdates();
    } catch (e) {
      return { ...feed, error: e instanceof Error ? e.message : String(e) };
    }
    return readFeed();
  }

  // Smart refresh: if the newest item is older than 4 hours and we haven't
  // recently kicked off an ingest, trigger one in the background so the next
  // poll picks up fresh data. The current request returns immediately.
  const newest = feed.updates[0]?.publishedAt ?? feed.updates[0]?.createdAt;
  const age = newest ? Date.now() - new Date(newest).getTime() : Infinity;
  const sinceLastIngest = Date.now() - lastBackgroundIngest;

  if (age > STALE_THRESHOLD && sinceLastIngest > STALE_THRESHOLD) {
    lastBackgroundIngest = Date.now();
    import("./server/policy-ingest.server")
      .then((m) => m.ingestPolicyUpdates())
      .catch((e) => console.error("background policy ingest failed", e));
  }

  return feed;
});

export const refreshPolicyFeed = createServerFn({ method: "POST" }).handler(async () => {
  const { ingestPolicyUpdates } = await import("./server/policy-ingest.server");
  const result = await ingestPolicyUpdates();
  return { ...(await readFeed()), ingested: result.kept };
});
