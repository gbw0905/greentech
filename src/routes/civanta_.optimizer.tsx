import { createFileRoute } from "@tanstack/react-router";
import { OptimizerPage } from "@/features/optimizer/OptimizerPage";
export const Route = createFileRoute("/civanta_/optimizer")({
  head: () => ({
    meta: [
      { title: "CIVanta Optimizer | Global Bioenergy Watch" },
      {
        name: "description",
        content:
          "Compare operating measures, solve for a carbon intensity target and review fuel pathway economics.",
      },
    ],
  }),
  component: OptimizerPage,
});
