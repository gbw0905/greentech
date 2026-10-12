import { createFileRoute, redirect } from "@tanstack/react-router";

// Preserve bookmarked links while contact information now lives in the shared footer.
export const Route = createFileRoute("/contact")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "footer-contact", replace: true });
  },
});
