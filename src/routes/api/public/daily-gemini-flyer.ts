import { createFileRoute } from "@tanstack/react-router";
import { generateFlyerImage, emailFlyer } from "@/features/linkedin/server/gemini-flyer.server";

/** Daily cron endpoint: generates today's AI flyer and emails it to the digest address. */
export const Route = createFileRoute("/api/public/daily-gemini-flyer")({
  server: {
    handlers: {
      GET: async () => {
        const recipient = process.env["LINKEDIN_DRAFT_EMAIL"];
        if (!recipient) {
          return Response.json(
            { error: "LINKEDIN_DRAFT_EMAIL is not configured" },
            { status: 500 },
          );
        }

        const generated = await generateFlyerImage();
        if (!generated.ok) {
          return Response.json({ error: generated.error }, { status: 500 });
        }

        const emailed = await emailFlyer(recipient);
        if (!emailed.ok) {
          return Response.json({ error: emailed.error }, { status: 500 });
        }

        return Response.json({
          ok: true,
          dayKey: generated.dayKey,
          imageUrl: generated.imageUrl,
          emailed: emailed.emailed,
          suppressed: emailed.suppressed,
          alreadyExisted: generated.alreadyExisted,
        });
      },
      POST: async () => {
        // Same as GET, for cron jobs that prefer POST.
        const recipient = process.env["LINKEDIN_DRAFT_EMAIL"];
        if (!recipient) {
          return Response.json(
            { error: "LINKEDIN_DRAFT_EMAIL is not configured" },
            { status: 500 },
          );
        }

        const generated = await generateFlyerImage();
        if (!generated.ok) {
          return Response.json({ error: generated.error }, { status: 500 });
        }

        const emailed = await emailFlyer(recipient);
        if (!emailed.ok) {
          return Response.json({ error: emailed.error }, { status: 500 });
        }

        return Response.json({
          ok: true,
          dayKey: generated.dayKey,
          imageUrl: generated.imageUrl,
          emailed: emailed.emailed,
          suppressed: emailed.suppressed,
          alreadyExisted: generated.alreadyExisted,
        });
      },
    },
  },
});
