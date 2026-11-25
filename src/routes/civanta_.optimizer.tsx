import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/civanta_/optimizer")({
  beforeLoad: () => {
    throw redirect({ to: "/civanta", replace: true });
  },
});
