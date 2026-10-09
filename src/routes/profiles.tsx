import { createFileRoute, redirect } from "@tanstack/react-router";

// Retain old bookmarks while country profiles are accessed from the policy map.
export const Route = createFileRoute("/profiles")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "map", replace: true });
  },
});
