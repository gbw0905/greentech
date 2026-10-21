import { createFileRoute } from "@tanstack/react-router";
import { AccountLayout } from "@/features/account/AccountLayout";
import { HistoryPanel } from "@/features/calculation-history/HistoryPanel";
export const Route = createFileRoute("/calculation-history")({
  head: () => ({
    meta: [
      { title: "Calculation History | Global Bioenergy Watch" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AccountLayout
      title="Calculation history"
      description="Your CI, Credit & RIN and Optimizer calculations, saved to your account and ready to revisit."
      section="history"
    >
      <HistoryPanel />
    </AccountLayout>
  ),
});
