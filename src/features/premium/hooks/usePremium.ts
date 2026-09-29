import { useQuery } from "@tanstack/react-query";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { getPremiumStatusFn } from "@/features/premium/server-functions";

/** Premium access = signed in AND listed on the curated premium members list. */
export function usePremium() {
  const { user, loading, signedIn } = useAuthSession();

  const { data, isLoading } = useQuery({
    queryKey: ["premium-status", user?.id ?? "anon"],
    queryFn: () => getPremiumStatusFn(),
    enabled: signedIn,
    staleTime: 5 * 60 * 1000,
  });

  return {
    signedIn,
    premium: Boolean(data?.premium),
    canEdit: Boolean(data?.canEdit),
    loading: loading || (signedIn && isLoading),
  };
}
