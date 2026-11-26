import { createFileRoute, notFound } from "@tanstack/react-router";
import { CivantaAuditPage } from "@/features/admin/CivantaAuditPage";
import { getAdminAccessFn } from "@/features/admin/server-functions";

export const Route = createFileRoute("/admin/civanta-audit")({
  // Only emails in the server-side ADMIN_EMAILS variable see this page; everyone else gets a 404.
  loader: async () => {
    if (!(await getAdminAccessFn()).admin) throw notFound();
  },
  head: () => ({
    meta: [
      { title: "CIVanta engine audit | Global Bioenergy Watch" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CivantaAuditPage,
});
