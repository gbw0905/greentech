import { createFileRoute } from "@tanstack/react-router";

async function run({ request }: { request: Request }) {
  // Every step below costs money or load (RSS sweeps, supply scrapers, paid
  // Gemini calls), so the whole route needs the cron secret. Vercel Cron sends
  // `Authorization: Bearer $CRON_SECRET` automatically.
  const { authorizeSupplyIngest } = await import("@/features/supply/server/ingest-auth.server");
  const unauthorized = authorizeSupplyIngest(request);
  if (unauthorized) return unauthorized;

  const results: { [key: string]: { ok: boolean; [k: string]: unknown } } = {};

  // 1. Policy feed ingestion
  try {
    const { ingestPolicyUpdates } = await import("@/features/policy/server/policy-ingest.server");
    const policyResult = await ingestPolicyUpdates();
    results["policy"] = { ok: true, ...policyResult };
  } catch (e) {
    console.error("scheduled-jobs: policy ingest failed", e);
    results["policy"] = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  // 2. Stale supply refresh
  try {
    const { refreshStaleSupplyDatasets } =
      await import("@/features/supply/server/supply-ingest.server");
    const supplyResults = await refreshStaleSupplyDatasets();
    results["supply"] = { ok: supplyResults.every((r) => r.ok), results: supplyResults };
  } catch (e) {
    console.error("scheduled-jobs: supply refresh failed", e);
    results["supply"] = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  // 3. AI enrichment of stale country profiles
  try {
    const { enrichStaleProfiles } =
      await import("@/features/policy/server/country-enrichment.server");
    const enrichResults = await enrichStaleProfiles();
    results["enrichment"] = {
      ok: enrichResults.every((r) => r.ok),
      enriched: enrichResults.length,
      results: enrichResults,
    };
  } catch (e) {
    console.error("scheduled-jobs: enrichment failed", e);
    results["enrichment"] = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  const allOk = Object.values(results).every((r) => r.ok);
  return Response.json({ ok: allOk, jobs: results }, { status: allOk ? 200 : 207 });
}

export const Route = createFileRoute("/api/public/scheduled-jobs")({
  server: { handlers: { GET: run, POST: run } },
});
