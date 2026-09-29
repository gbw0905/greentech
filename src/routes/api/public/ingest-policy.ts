import { createFileRoute } from "@tanstack/react-router";

/** Called hourly by the scheduled job, and on demand by the dashboard's rescan button. */
async function run() {
  const { ingestPolicyUpdates } = await import("@/features/policy/server/policy-ingest.server");
  try {
    const result = await ingestPolicyUpdates();
    return Response.json({ ok: true, ...result });
  } catch (e) {
    console.error("ingest-policy failed", e);
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/public/ingest-policy")({
  server: { handlers: { GET: run, POST: run } },
});
