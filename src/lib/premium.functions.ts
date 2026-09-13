import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Returns whether the signed-in account is on the manually curated premium list. */
export const getPremiumStatusFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims?.email as string | undefined) ?? "";
    if (!email) return { premium: false };

    const { data } = await context.supabase
      .from("premium_members")
      .select("active")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    return { premium: Boolean(data?.active) };
  });
