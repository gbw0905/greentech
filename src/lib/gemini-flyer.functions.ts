import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const emailSchema = z.string().email();

async function validateAdminKey(adminKey: string | undefined) {
  if (!adminKey) throw new Error("Admin key is required");
  const expected = process.env["LINKEDIN_SETTINGS_ADMIN_KEY"];
  if (!expected) throw new Error("LINKEDIN_SETTINGS_ADMIN_KEY is not configured");
  if (adminKey !== expected) throw new Error("Invalid admin key");
}

export const generateFlyerNowFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { adminKey: string; email?: string; force?: boolean }) => {
      return z
        .object({
          adminKey: z.string().min(1),
          email: z.string().email().optional(),
          force: z.boolean().optional(),
        })
        .parse(data);
    },
  )
  .handler(async ({ data }) => {
    await validateAdminKey(data.adminKey);

    const { emailFlyer, generateFlyerImage } = await import("@/lib/gemini-flyer.server");

    const generated = await generateFlyerImage(data.force ?? false);
    if (!generated.ok) {
      throw new Error(generated.error);
    }

    const recipient = data.email || process.env["LINKEDIN_DRAFT_EMAIL"];
    if (!recipient) {
      throw new Error("No recipient email configured");
    }
    if (!emailSchema.safeParse(recipient).success) {
      throw new Error("Invalid recipient email");
    }

    const emailed = await emailFlyer(recipient, { unique: true });
    if (!emailed.ok) {
      throw new Error(emailed.error);
    }

    return {
      ok: true,
      dayKey: generated.dayKey,
      imageUrl: generated.imageUrl,
      emailed: emailed.emailed,
      suppressed: emailed.suppressed,
      alreadyExisted: generated.alreadyExisted,
    };
  });

