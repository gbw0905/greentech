// Resolves the signed-in user for raw authenticated HTTP routes.
import { createClient } from "@supabase/supabase-js";

export async function userIdFromRequest(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization");
  const token = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
  if (!token) return null;

  const url = process.env["SUPABASE_URL"];
  const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !publishableKey) return null;

  try {
    // Auth verifies the supplied token remotely; no admin privileges or
    // persistent server session are needed to identify the requester.
    const client = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error) return null;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
