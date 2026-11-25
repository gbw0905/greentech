import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/civanta-new")({
  beforeLoad: () => {
    throw redirect({ to: "/civanta", replace: true });
  },
});
