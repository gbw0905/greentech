import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CALCULATOR_OWNER_EMAIL = "asifurp09@gmail.com";

/** Returns whether the signed-in account is on the manually curated premium list. */
export const getPremiumStatusFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = ((context.claims?.email as string | undefined) ?? "").toLowerCase();
    if (!email) return { premium: false, canEdit: false };

    const canEdit = email === CALCULATOR_OWNER_EMAIL;
    if (canEdit) return { premium: true, canEdit: true };

    const { data } = await context.supabase
      .from("premium_members")
      .select("active")
      .eq("email", email)
      .maybeSingle();

    return { premium: Boolean(data?.active), canEdit: false };
  });
