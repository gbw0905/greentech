import { createFileRoute } from "@tanstack/react-router";

// One-click LinkedIn publish approval. GET renders a confirmation page (so
// email-link scanners never auto-publish); POST performs the actual publish.

const PAGE_STYLE = `
  body { margin: 0; font-family: Calibri, Carlito, 'Segoe UI', Arial, sans-serif; background: #f4f6f9; color: #0b1220; }
  .wrap { max-width: 640px; margin: 48px auto; padding: 0 16px; }
  .card { background: #ffffff; border: 1px solid #e4e8ef; border-radius: 12px; overflow: hidden; }
  .banner { background: linear-gradient(90deg, #0f766e 0%, #1d4ed8 55%, #7c3aed 100%); color: #ffffff; padding: 20px 24px; }
  .banner h1 { margin: 0; font-size: 22px; }
  .banner p { margin: 6px 0 0; font-size: 13px; color: #dbeafe; }
  .inner { padding: 20px 24px; }
  .post { white-space: pre-wrap; background: #f8fafc; border: 1px solid #e4e8ef; border-left: 4px solid #1d4ed8; border-radius: 10px; padding: 14px 16px; font-size: 14px; line-height: 1.55; }
  .note { font-size: 13px; color: #4a5364; line-height: 1.5; }
  button { background: #0f766e; color: #ffffff; border: 0; border-radius: 8px; padding: 12px 22px; font-size: 15px; font-weight: 700; cursor: pointer; }
  .err { color: #b91c1c; }
  a { color: #1d4ed8; }
`;

function page(title: string, innerHtml: string) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} · Global Bioenergy Watch</title><style>${PAGE_STYLE}</style></head><body><div class="wrap"><div class="card"><div class="banner"><h1>Global Bioenergy Watch</h1><p>LinkedIn publishing</p></div><div class="inner">${innerHtml}</div></div></div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export const Route = createFileRoute("/api/public/linkedin-publish")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = new URL(request.url).searchParams.get("token") ?? "";
        const { previewDraftByToken } = await import("@/lib/linkedin-draft.server");
        const draft = await previewDraftByToken(token);

        if (!draft) {
          return page(
            "Invalid link",
            `<p class="err"><strong>This approval link is invalid or has already been replaced.</strong></p><p class="note">Request a fresh draft or check the latest email. <a href="https://globalbioenergywatch.org">Back to the tracker</a>.</p>`,
          );
        }

        if (draft.status === "published") {
          return page(
            "Already published",
            `<p><strong>This post was already published to LinkedIn.</strong></p><div class="post">${escapeHtml(draft.postText)}</div><p class="note">Nothing else to do. <a href="https://globalbioenergywatch.org">Back to the tracker</a>.</p>`,
          );
        }

        // Describe the real destination: direct company-page posting when the
        // custom OAuth app is connected, personal profile + mention otherwise.
        const { getLinkedInSettings } = await import("@/lib/linkedin-settings.server");
        const { getOrgConnectionStatus } = await import("@/lib/linkedin-org-oauth.server");
        const settings = await getLinkedInSettings();
        const orgConn =
          settings.postingMode === "company_page" ? await getOrgConnectionStatus() : null;

        const destinationNote = orgConn?.connected
          ? `Confirming publishes this exact text <strong>directly to the ${escapeHtml(orgConn.orgName ?? "Global Bioenergy Watch")} company page</strong>, using your custom LinkedIn app (organization posting permission).`
          : settings.postingMode === "company_page"
            ? `Company-page posting is selected but the custom LinkedIn app is not connected, so this will fall back to your <strong>personal LinkedIn profile</strong> with the company page tagged. Connect the custom app in <a href="/settings/linkedin">settings</a> to post directly to the page.`
            : `Confirming publishes this exact text to your <strong>personal LinkedIn profile</strong> with the Global Bioenergy Watch page tagged as a mention.`;

        return page(
          "Confirm publication",
          `<p><strong>Review today's post before it goes live</strong> (draft of ${escapeHtml(draft.dayKey)}):</p><div class="post">${escapeHtml(draft.postText)}</div><p class="note">${destinationNote}</p><form method="POST" action="/api/public/linkedin-publish"><input type="hidden" name="token" value="${escapeHtml(token)}"><button type="submit">Confirm — publish to LinkedIn</button></form>`,
        );
      },

      POST: async ({ request }) => {
        let token = "";
        const contentType = request.headers.get("content-type") ?? "";
        if (contentType.includes("application/x-www-form-urlencoded")) {
          token = (await request.formData()).get("token")?.toString() ?? "";
        } else {
          const body = (await request.json().catch(() => ({}))) as { token?: string };
          token = body.token ?? "";
        }

        const { publishDraftByToken } = await import("@/lib/linkedin-draft.server");
        const result = await publishDraftByToken(token);

        if (result.ok) {
          const urn = escapeHtml(result.urn);
          const where =
            result.via === "organization"
              ? "Published directly to the Global Bioenergy Watch company page."
              : result.via === "personal"
                ? "Published to your personal LinkedIn profile with the company page tagged."
                : "";
          return page(
            result.already ? "Already published" : "Published",
            `<p><strong>${result.already ? "This post was already live." : "Published to LinkedIn."}</strong></p>${where ? `<p class="note">${where}</p>` : ""}<p class="note">Post reference: <code>${urn}</code></p><p class="note"><a href="https://www.linkedin.com/feed/">Open LinkedIn</a> · <a href="https://globalbioenergywatch.org">Back to the tracker</a></p>`,
          );
        }

        if (result.reason === "invalid-token") {
          return page(
            "Invalid link",
            `<p class="err"><strong>This approval link is invalid or has already been used.</strong></p><p class="note"><a href="https://globalbioenergywatch.org">Back to the tracker</a>.</p>`,
          );
        }

        return page(
          "Publishing failed",
          `<p class="err"><strong>LinkedIn rejected the post.</strong></p><p class="note">Details were logged server-side. You can retry from the same link; if it keeps failing, reconnect LinkedIn in the project settings.</p>`,
        );
      },
    },
  },
});
