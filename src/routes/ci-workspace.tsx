import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/ci-workspace")({
  beforeLoad: () => {
    throw redirect({ to: "/civanta", replace: true });
  },
});
