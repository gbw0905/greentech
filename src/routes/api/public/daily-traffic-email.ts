import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/daily-traffic-email")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { authorizeCron } = await import("@/features/supply/server/ingest-auth.server");
        const unauthorized = authorizeCron(request);
        if (unauthorized) return unauthorized;
        const { sendDailyTrafficEmail } =
          await import("@/features/traffic/server/send-daily-traffic-email.server");
        return sendDailyTrafficEmail();
      },
    },
  },
});
