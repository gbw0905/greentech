import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { countryBySlug } from "@/features/policy/taxonomy";
import { getErrorMessage } from "@/shared/errors";

export const Route = createFileRoute("/countries/$slug")({
  beforeLoad: ({ params }) => {
    if (!countryBySlug(params.slug)) throw notFound();
  },
  component: () => <Outlet />,
  errorComponent: ({ error }) => (
    <div className="p-10 text-sm text-destructive" role="alert">
      {getErrorMessage(error)}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-10 text-sm text-muted-foreground">Country profile not tracked yet.</div>
  ),
});
