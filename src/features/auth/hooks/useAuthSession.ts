import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AuthUser {
  id: string;
  email?: string;
  avatar_url?: string | null;
  full_name?: string | null;
  created_at?: string;
}

export const authSessionQueryKey = ["auth-session"] as const;

async function fetchAuthSession(): Promise<AuthUser | null> {
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { user?: AuthUser | null };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export function useAuthSession() {
  const queryClient = useQueryClient();
  const { data: user = null, isPending: loading } = useQuery({
    queryKey: authSessionQueryKey,
    queryFn: fetchAuthSession,
    staleTime: 30_000,
  });

  const refreshSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: authSessionQueryKey });
  }, [queryClient]);

  return { user, loading, signedIn: Boolean(user), refreshSession };
}
