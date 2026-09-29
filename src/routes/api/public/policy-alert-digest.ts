import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/policy-alert-digest")({
  server: {
    handlers: {
      GET: runDigest,
      POST: runDigest,
    },
  },
});

async function runDigest() {
  const { sendDailyAlertDigest } =
    await import("@/features/alerts/server/send-daily-digest.server");
  return sendDailyAlertDigest();
}
