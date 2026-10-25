import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { getPremiumStatusFn } from "@/features/premium/server-functions";

/** Premium access = signed in AND listed on the curated premium members list. */
export function usePremium() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { user, loading, signedIn } = useAuthSession();

  const { data, isLoading } = useQuery({
    queryKey: ["premium-status", user?.id ?? "anon"],
    queryFn: () => getPremiumStatusFn(),
    enabled: signedIn,
    staleTime: 5 * 60 * 1000,
  });

  return {
    signedIn,
    premium: mounted && Boolean(data?.premium),
    canEdit: mounted && Boolean(data?.canEdit),
    loading: !mounted || loading || (signedIn && isLoading),
  };
}
