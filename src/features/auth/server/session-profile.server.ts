import type { User } from "@supabase/supabase-js";
import type { AuthUser } from "@/features/auth/hooks/useAuthSession";

export function sessionProfile(user: User | null): AuthUser | null {
  if (!user) return null;
  const metadata = user.user_metadata ?? {};
  const avatar = metadata["avatar_url"] ?? metadata["picture"];
  const name = metadata["full_name"] ?? metadata["name"];
  return {
    id: user.id,
    ...(user.email !== undefined ? { email: user.email } : {}),
    avatar_url: typeof avatar === "string" ? avatar : null,
    full_name: typeof name === "string" ? name : null,
    created_at: user.created_at,
  };
}
