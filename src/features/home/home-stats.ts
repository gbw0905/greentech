import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { COUNTRIES } from "@/features/policy/taxonomy";

export interface HomeStats {
  total: number;
  countries: number;
  policy: number;
  market: number;
}

export const getHomeStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomeStats> => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    const url = process.env["SUPABASE_URL"];
    if (!key || !url) throw new Error("Policy database is unavailable");

    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    // Exact database counts include updates beyond the 1,000-row display feed.
    const [all, policy] = await Promise.all([
      client.from("policy_updates").select("id", { count: "exact", head: true }),
      client
        .from("policy_updates")
        .select("id", { count: "exact", head: true })
        .neq("category", "market"),
    ]);
    if (all.error || policy.error || all.count === null || policy.count === null) {
      throw new Error(
        all.error?.message ?? policy.error?.message ?? "Policy counts are unavailable",
      );
    }

    return {
      total: all.count,
      countries: COUNTRIES.length,
      policy: policy.count,
      market: all.count - policy.count,
    };
  },
);

export const homeStatsQuery = queryOptions({
  queryKey: ["home-stats"],
  queryFn: () => getHomeStats(),
  staleTime: 5 * 60 * 1000,
  refetchInterval: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
  retry: 2,
});
