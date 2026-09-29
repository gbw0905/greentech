import { createFileRoute } from "@tanstack/react-router";

// Public OAuth redirect target for the custom LinkedIn app. LinkedIn redirects
// the member's browser here after consent; the route verifies the signed state,
// exchanges the code, and stores the organization token set. Access is safe to
// leave public: the HMAC state blocks CSRF, and the token is only stored when
// the member is an admin of the company page configured in the settings.

function redirectToSettings(params: Record<string, string>) {
  return new Response(null, {
    status: 302,
    headers: { Location: `/settings/linkedin?${new URLSearchParams(params).toString()}` },
  });
}

export const Route = createFileRoute("/api/public/linkedin/oauth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code") ?? "";
        const state = url.searchParams.get("state") ?? "";
        const oauthError = url.searchParams.get("error");

        if (oauthError) {
          const detail = url.searchParams.get("error_description") ?? oauthError;
          return redirectToSettings({ org: "error", detail });
        }

        const { isCustomAppConfigured, verifyState, completeOrgConnect } =
          await import("@/features/linkedin/server/linkedin-org-oauth.server");

        if (!isCustomAppConfigured()) {
          return redirectToSettings({
            org: "error",
            detail: "Custom LinkedIn app credentials are not stored in this project yet.",
          });
        }
        if (!code || !verifyState(state)) {
          return redirectToSettings({
            org: "error",
            detail: "The sign-in session expired or was tampered with. Start the connection again.",
          });
        }

        try {
          const { getLinkedInSettings } =
            await import("@/features/linkedin/server/linkedin-settings.server");
          const settings = await getLinkedInSettings();
          const { orgName, personName } = await completeOrgConnect(code, settings.companyOrgId);
          return redirectToSettings({ org: "connected", orgName, person: personName });
        } catch (e) {
          const detail = e instanceof Error ? e.message : "Unknown error";
          console.error(`LinkedIn org OAuth callback failed: ${detail}`);
          return redirectToSettings({ org: "error", detail });
        }
      },
    },
  },
});
