import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dairy-rng-calculator")({
  beforeLoad: () => {
    throw redirect({ to: "/civanta", replace: true });
  },
});
