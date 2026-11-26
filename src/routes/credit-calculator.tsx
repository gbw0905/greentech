import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/credit-calculator")({
  beforeLoad: () => {
    throw redirect({ to: "/civanta", replace: true });
  },
});
