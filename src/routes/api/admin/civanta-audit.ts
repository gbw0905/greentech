import { readForm, readJson } from "@/infrastructure/http/server/request-body.server";
import { createFileRoute } from "@tanstack/react-router";

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
// Non-admins get the same 404 as a missing route, so the endpoint is not advertised.
const notFound = () => new Response("Not found", { status: 404, headers });

async function admin(request: Request) {
  const { adminFromRequest } = await import("@/features/admin/admin-access.server");
  return adminFromRequest(request);
}

export const Route = createFileRoute("/api/admin/civanta-audit")({
  server: {
    handlers: {
      // Lists documents and reports, or ?download=<documentId> for a signed file link.
      GET: async ({ request }) => {
        const audit = await import("@/features/admin/civanta-audit.server");
        try {
          if (!(await admin(request))) return notFound();
          const download = new URL(request.url).searchParams.get("download");
          if (download)
            return Response.json({ url: await audit.documentDownloadUrl(download) }, { headers });
          return Response.json(await audit.listAudit(), { headers });
        } catch (error) {
          return audit.auditErrorResponse(error, "Could not load the audit.");
        }
      },
      // multipart "file" uploads a reference document; JSON {documentId} runs an AI check.
      POST: async ({ request }) => {
        const audit = await import("@/features/admin/civanta-audit.server");
        try {
          const user = await admin(request);
          if (!user) return notFound();
          if (request.headers.get("content-type")?.includes("multipart/form-data")) {
            const file = (await readForm(request, 15 * 1024 * 1024 + 64 * 1024)).get("file");
            if (!(file instanceof File))
              return Response.json({ error: "Choose a file." }, { status: 400, headers });
            return Response.json(await audit.uploadDocument(user, file), { status: 201, headers });
          }
          const { assertAiQuota } = await import("@/infrastructure/ai/quota.server");
          assertAiQuota(`civanta-audit:${user.userId}`, 3);
          const report = await audit.runCheck(
            user,
            await readJson(request, 32_768),
            new URL(request.url).origin,
          );
          return Response.json(report, { status: 201, headers });
        } catch (error) {
          return audit.auditErrorResponse(error, "The audit request failed.");
        }
      },
      DELETE: async ({ request }) => {
        const audit = await import("@/features/admin/civanta-audit.server");
        try {
          if (!(await admin(request))) return notFound();
          await audit.deleteDocument(new URL(request.url).searchParams.get("id"));
          return Response.json({ ok: true }, { headers });
        } catch (error) {
          return audit.auditErrorResponse(error, "Could not delete the document.");
        }
      },
    },
  },
});
