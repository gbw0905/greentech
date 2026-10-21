import { useCallback, useEffect, useState } from "react";

interface AuthUser {
  id: string;
  email?: string;
  avatar_url?: string | null;
  full_name?: string | null;
}

export function useAuthSession() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return { user, loading, signedIn: Boolean(user), refreshSession: checkSession };
}
