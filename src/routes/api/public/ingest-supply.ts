import { createFileRoute } from "@tanstack/react-router";

async function run({ request }: { request: Request }) {
  const { authorizeSupplyIngest } = await import("@/features/supply/server/ingest-auth.server");
  const unauthorized = authorizeSupplyIngest(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const dataset = url.searchParams.get("dataset") || "ethanol";
  const { ingestSupplyDataset } = await import("@/features/supply/server/supply-ingest.server");

  try {
    const results = await ingestSupplyDataset(dataset);
    return Response.json({ ok: results.every((r) => r.ok), dataset, results });
  } catch (error) {
    console.error("ingest-supply failed", error);
    return Response.json(
      { ok: false, dataset, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/public/ingest-supply")({
  server: { handlers: { GET: run, POST: run } },
});
