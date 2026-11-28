import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/policy-alert-digest")({
  server: {
    handlers: {
      GET: runDigest,
      POST: runDigest,
    },
  },
});

async function runDigest({ request }: { request: Request }) {
  const { authorizeCron } = await import("@/features/supply/server/ingest-auth.server");
  const unauthorized = authorizeCron(request);
  if (unauthorized) return unauthorized;
  const { sendDailyAlertDigest } =
    await import("@/features/alerts/server/send-daily-digest.server");
  return sendDailyAlertDigest();
}
