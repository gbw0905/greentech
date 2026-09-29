import { createFileRoute } from "@tanstack/react-router";

// Daily LinkedIn draft → owner approval email. Triggered by pg_cron at 13:00 UTC.

async function run() {
  const { createAndEmailDraft } = await import("@/features/linkedin/server/linkedin-draft.server");
  const recipient = process.env["LINKEDIN_DRAFT_EMAIL"] ?? process.env["TRAFFIC_DIGEST_EMAIL"];
  if (!recipient) {
    return Response.json({ ok: false, error: "recipient email not configured" }, { status: 500 });
  }
  const result = await createAndEmailDraft(recipient);
  return Response.json(result);
}

export const Route = createFileRoute("/api/public/daily-linkedin-draft")({
  server: { handlers: { GET: run, POST: run } },
});
