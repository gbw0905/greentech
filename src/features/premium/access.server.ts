import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const CALCULATOR_OWNER_EMAIL = "asifurp09@gmail.com";
const PRO_MEMBER_EMAILS = new Set(["asifhasan973@gmail.com", "info@globalbioenergywatch.org"]);

/** Shared policy for authenticated server functions and the embedded workspace. */
export async function premiumStatusForEmail(
  supabase: SupabaseClient<Database>,
  userEmail: string | undefined,
  request: Request,
) {
  const email = (userEmail ?? "").toLowerCase();
  if (!email) return { premium: false, canEdit: false };
  if (email === CALCULATOR_OWNER_EMAIL) return { premium: true, canEdit: true };
  if (PRO_MEMBER_EMAILS.has(email)) return { premium: true, canEdit: false };
  if (
    process.env["NODE_ENV"] === "development" &&
    email === "demo@globalbioenergywatch.org" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname)
  ) {
    return { premium: true, canEdit: false };
  }
  const { data, error } = await supabase
    .from("premium_members")
    .select("active")
    .eq("email", email)
    .maybeSingle();
  return { premium: !error && data?.active === true, canEdit: false };
}
