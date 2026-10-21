import { createCookieClient } from "@/integrations/supabase/cookie-client.server";

export async function userIdFromRequest(request: Request): Promise<string | null> {
  try {
    const { client } = createCookieClient(request);
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}
