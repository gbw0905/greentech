import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// RPC wrappers for the LinkedIn posting settings page (/settings/linkedin).
// All logic lives in ./linkedin-settings.server and ./linkedin-org-oauth.server;
// this module is a thin shell (no runtime helpers at module scope).

export const getLinkedInSettingsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ adminKey: z.string().min(1, "Admin key is required") }).parse(data),
  )
  .handler(async ({ data }) => {
    const { verifyAdminKey, getLinkedInSettings } = await import("./linkedin-settings.server");
    if (!verifyAdminKey(data.adminKey)) {
      throw new Error("Invalid admin key");
    }
    const settings = await getLinkedInSettings();
    // Company-page posting is available once the custom LinkedIn app (with
    // w_organization_social) is connected by a page admin.
    const { getOrgConnectionStatus } = await import("./linkedin-org-oauth.server");
    const orgConnection = await getOrgConnectionStatus();
    const companyPosting = orgConnection.connected
      ? { available: true, detail: `Custom app connected to ${orgConnection.orgName}.` }
      : {
          available: false,
          detail: orgConnection.configured
            ? "App credentials stored — connect the page admin account below to enable."
            : "Requires the custom LinkedIn app credentials (LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET).",
        };
    return { settings, companyPosting, orgConnection };
  });

export const saveLinkedInSettingsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        adminKey: z.string().min(1, "Admin key is required"),
        companyPageUrl: z.string().url(),
        postingMode: z.enum(["personal_mention", "company_page"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { verifyAdminKey, saveLinkedInSettings } = await import("./linkedin-settings.server");
    if (!verifyAdminKey(data.adminKey)) {
      throw new Error("Invalid admin key");
    }
    const settings = await saveLinkedInSettings({
      companyPageUrl: data.companyPageUrl,
      postingMode: data.postingMode,
    });
    return { settings };
  });

export const startLinkedInOrgConnectFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ adminKey: z.string().min(1, "Admin key is required") }).parse(data),
  )
  .handler(async ({ data }) => {
    const { verifyAdminKey } = await import("./linkedin-settings.server");
    if (!verifyAdminKey(data.adminKey)) {
      throw new Error("Invalid admin key");
    }
    const { isCustomAppConfigured, buildAuthorizeUrl } = await import(
      "./linkedin-org-oauth.server"
    );
    if (!isCustomAppConfigured()) {
      throw new Error(
        "Custom LinkedIn app credentials are not stored yet. Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to the project secrets first.",
      );
    }
    return { url: buildAuthorizeUrl() };
  });

export const disconnectLinkedInOrgFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ adminKey: z.string().min(1, "Admin key is required") }).parse(data),
  )
  .handler(async ({ data }) => {
    const { verifyAdminKey } = await import("./linkedin-settings.server");
    if (!verifyAdminKey(data.adminKey)) {
      throw new Error("Invalid admin key");
    }
    const { disconnectOrg } = await import("./linkedin-org-oauth.server");
    await disconnectOrg();
    return { ok: true };
  });
