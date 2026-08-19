import { createFileRoute } from "@tanstack/react-router";

/** Instant alerts are disabled — all subscribers now receive the daily digest only. */
async function run() {
  return Response.json({ ok: true, sent: 0, reason: "instant_cadence_disabled" });
}

export const Route = createFileRoute("/api/public/instant-brief-alerts")({
  server: { handlers: { GET: run, POST: run } },
});
