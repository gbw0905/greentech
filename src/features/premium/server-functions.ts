import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CALCULATOR_OWNER_EMAIL = "asifurp09@gmail.com";
const PRO_MEMBER_EMAILS = new Set(["asifhasan973@gmail.com", "info@globalbioenergywatch.org"]);

/** Returns whether the signed-in account is on the curated premium list. */
export const getPremiumStatusFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = ((context.claims?.email as string | undefined) ?? "").toLowerCase();
    if (!email) return { premium: false, canEdit: false };

    const canEdit = email === CALCULATOR_OWNER_EMAIL;
    if (canEdit) return { premium: true, canEdit: true };
    if (PRO_MEMBER_EMAILS.has(email)) return { premium: true, canEdit: false };

    // Local testing only; the account must still pass Supabase authentication.
    if (
      process.env["NODE_ENV"] === "development" &&
      email === "demo@globalbioenergywatch.org" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(new URL(getRequest().url).hostname)
    ) {
      return { premium: true, canEdit: false };
    }

    const { data } = await context.supabase
      .from("premium_members")
      .select("active")
      .eq("email", email)
      .maybeSingle();

    return { premium: Boolean(data?.active), canEdit: false };
  });
