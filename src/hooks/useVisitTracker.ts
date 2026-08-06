import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { recordVisit } from "@/lib/traffic";

/** Records one anonymous page view per pathname change. */
export function useVisitTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    void recordVisit(pathname);
  }, [pathname]);
}
