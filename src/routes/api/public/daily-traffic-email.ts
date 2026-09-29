import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/daily-traffic-email")({
  server: {
    handlers: {
      POST: async () => {
        const { sendDailyTrafficEmail } =
          await import("@/features/traffic/server/send-daily-traffic-email.server");
        return sendDailyTrafficEmail();
      },
    },
  },
});
