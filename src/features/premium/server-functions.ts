import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { premiumStatusForEmail } from "./access.server";

/** Returns whether the signed-in account is on the curated premium list. */
export const getPremiumStatusFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) =>
    premiumStatusForEmail(
      context.supabase,
      context.claims?.email as string | undefined,
      getRequest(),
    ),
  );
