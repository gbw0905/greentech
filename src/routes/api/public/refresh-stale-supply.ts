import { createFileRoute } from "@tanstack/react-router";

async function run({ request }: { request: Request }) {
  const { authorizeSupplyIngest } = await import("@/features/supply/server/ingest-auth.server");
  const unauthorized = authorizeSupplyIngest(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const dataset = url.searchParams.get("dataset") || undefined;
  const { refreshStaleSupplyDatasets } = await import(
    "@/features/supply/server/supply-ingest.server"
  );

  try {
    const results = await refreshStaleSupplyDatasets(dataset);
    return Response.json({
      ok: results.every((result) => result.ok),
      dataset: dataset ?? "all-parser-backed",
      results,
    });
  } catch (error) {
    console.error("refresh-stale-supply failed", error);
    return Response.json(
      {
        ok: false,
        dataset: dataset ?? "all-parser-backed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export const Route = createFileRoute("/api/public/refresh-stale-supply")({
  server: { handlers: { GET: run, POST: run } },
});
