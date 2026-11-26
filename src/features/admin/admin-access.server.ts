import { createCookieClient } from "@/integrations/supabase/cookie-client.server";

/** Emails from the server-only ADMIN_EMAILS variable (comma separated). */
function adminEmails() {
  return new Set(
    (process.env["ADMIN_EMAILS"] ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export type Admin = { userId: string; email: string };

/** The signed-in admin for this request, or null for everyone else. */
export async function adminFromRequest(request: Request): Promise<Admin | null> {
  try {
    const { client } = createCookieClient(request);
    const { data, error } = await client.auth.getUser();
    const email = data.user?.email?.toLowerCase();
    if (error || !data.user || !email || !adminEmails().has(email)) return null;
    return { userId: data.user.id, email };
  } catch {
    return null;
  }
}
