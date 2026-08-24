import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// RPC wrappers for the LinkedIn posting settings page (/settings/linkedin).
// All logic lives in ./linkedin-settings.server; this module is a thin shell.

const keySchema = z.object({ adminKey: z.string().min(1, "Admin key is required") });

const saveSchema = keySchema.extend({
  companyPageUrl: z.string().url(),
  postingMode: z.enum(["personal_mention", "company_page"]),
});

export const getLinkedInSettingsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => keySchema.parse(data))
  .handler(async ({ data }) => {
    const { verifyAdminKey, getLinkedInSettings, checkCompanyPostingAvailable } = await import(
      "./linkedin-settings.server"
    );
    if (!verifyAdminKey(data.adminKey)) {
      throw new Error("Invalid admin key");
    }
    const settings = await getLinkedInSettings();
    // Live-check whether company-page posting is possible with the current
    // LinkedIn connection so the UI can enable/disable that option honestly.
    const { linkedInFetch } = await import("./linkedin-draft.server");
    const company = await checkCompanyPostingAvailable(linkedInFetch);
    return { settings, companyPosting: company };
  });

export const saveLinkedInSettingsFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => saveSchema.parse(data))
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
