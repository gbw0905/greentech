import { useEffect, useRef, useState, type RefObject } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";
import { useRouterState } from "@tanstack/react-router";
import { historyInputSchema, type HistoryInput } from "./contracts";
import { getCalculationRunFn, saveCalculationRunFn } from "./server-functions";

export function useCalculatorHistory(
  kind: "ci" | "credit",
  frame: RefObject<HTMLIFrameElement | null>,
) {
  const { user } = useAuthSession();
  const client = useQueryClient();
  const search = useRouterState({ select: (state) => state.location.searchStr });
  const requestedId = new URLSearchParams(search).get("run");
  const [restoreId, setRestoreId] = useState<string | null>(requestedId);
  const [restoreRevision, setRestoreRevision] = useState(0);
  const [frameVersion, setFrameVersion] = useState(0);
  const [ready, setReady] = useState(false);
  const restoreRequest = useRef<string | null>(null);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState<HistoryInput | null>(null);
  const restore = useQuery({
    queryKey: ["calculation-run", user?.id, restoreId],
    queryFn: () => getCalculationRunFn({ data: { id: restoreId! } }),
    enabled: Boolean(user && restoreId),
    retry: false,
  });
  const save = useMutation({
    mutationFn: (data: HistoryInput) => saveCalculationRunFn({ data }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["calculation-history", user?.id] }),
  });
  const { mutateAsync } = save;
  // A cached iframe can finish before React attaches its load listener.
  // Request readiness explicitly so direct history links and hot reloads still restore.
  useEffect(() => {
    frame.current?.contentWindow?.postMessage(
      { type: "civanta-history-ping" },
      window.location.origin,
    );
  }, [frame, kind]);
  useEffect(() => {
    setRestoreId(requestedId);
  }, [requestedId]);
  useEffect(() => {
    setFailed(null);
    setStatus("");
  }, [user?.id]);
  useEffect(() => {
    if (!restore.data || !ready) return;
    if (restore.data.kind !== kind) {
      setStatus("This run belongs to the other calculator.");
      return;
    }
    restoreRequest.current = crypto.randomUUID();
    frame.current?.contentWindow?.postMessage(
      {
        type: "civanta-history-restore",
        requestId: restoreRequest.current,
        kind,
        snapshot: JSON.parse(restore.data.snapshot),
      },
      window.location.origin,
    );
    setStatus("Restoring your calculation…");
  }, [restore.data, ready, kind, frame, restoreRevision, frameVersion]);
  useEffect(() => {
    let active = true;
    const receive = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow)
        return;
      if (
        event.data?.type === "civanta-history-restored" &&
        event.data.requestId === restoreRequest.current
      ) {
        setStatus(
          typeof event.data.message === "string"
            ? event.data.message
            : "Could not restore this calculation.",
        );
        return;
      }
      if (event.data?.type === "civanta-history-ready") {
        setReady(true);
        return;
      }
      if (event.data?.type !== "civanta-history-save") return;
      const parsed = historyInputSchema.safeParse(event.data.payload);
      if (!parsed.success || parsed.data.kind !== kind) {
        setStatus("This calculation could not be saved. Check the inputs and try again.");
        return;
      }
      if (!user) {
        setStatus(
          kind === "ci"
            ? "Scenario saved on this device. Sign in to sync it to your account."
            : "Inputs saved in this browser. Sign in to save named scenarios to your account.",
        );
        return;
      }
      setStatus("Saving this calculation to your account…");
      try {
        await mutateAsync(parsed.data);
        if (active) {
          setFailed(null);
          setStatus("Scenario saved to your account.");
        }
      } catch {
        if (active) {
          setFailed(parsed.data);
          setStatus("Scenario could not be saved to your account. Retry below.");
        }
      }
    };
    window.addEventListener("message", receive);
    return () => {
      active = false;
      window.removeEventListener("message", receive);
    };
  }, [frame, kind, user, mutateAsync]);
  return {
    status: restore.isError
      ? "Could not restore this run from your account."
      : restoreId && restore.isFetching
        ? "Loading your saved calculation…"
        : status,
    failed,
    restore: (id: string) => {
      setRestoreId(id);
      setRestoreRevision((value) => value + 1);
    },
    retry: async () => {
      if (!failed) return;
      try {
        await mutateAsync(failed);
        setFailed(null);
        setStatus("Scenario saved to your account.");
      } catch {
        setStatus("Account history is still unavailable. Please try again.");
      }
    },
    onFrameLoad: () => {
      setReady(true);
      setFrameVersion((version) => version + 1);
    },
    pending: save.isPending,
  };
}
