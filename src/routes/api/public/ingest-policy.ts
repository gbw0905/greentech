import { createFileRoute } from "@tanstack/react-router";

async function run({ request }: { request: Request }) {
  const { authorizeCron } = await import("@/features/supply/server/ingest-auth.server");
  const unauthorized = authorizeCron(request);
  if (unauthorized) return unauthorized;
  const { ingestPolicyUpdates } = await import("@/features/policy/server/policy-ingest.server");
  try {
    const result = await ingestPolicyUpdates();
    return Response.json({ ok: true, ...result });
  } catch (e) {
    console.error("ingest-policy failed", e);
    return Response.json({ ok: false, error: "Policy refresh failed." }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/ingest-policy")({
  server: { handlers: { GET: run, POST: run } },
});
