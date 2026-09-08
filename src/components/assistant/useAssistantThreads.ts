import { useCallback, useEffect, useState } from "react";
import type { UIMessage } from "ai";
import {
  createThreadFn,
  deleteThreadFn,
  getThreadMessagesFn,
  listThreadsFn,
  type ChatThreadSummary,
} from "@/lib/assistant.functions";
import { toUiMessages } from "./threads";

/** Loads, creates and deletes the signed-in user's saved conversations. */
export function useAssistantThreads(enabled: boolean) {
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return [] as ChatThreadSummary[];
    const list = await listThreadsFn();
    setThreads(list);
    return list;
  }, [enabled]);

  const open = useCallback(async (id: string) => {
    setActiveId(id);
    setLoading(true);
    try {
      const rows = await getThreadMessagesFn({ data: { id } });
      setMessages(toUiMessages(rows));
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async () => {
    const { id } = await createThreadFn();
    setMessages([]);
    setActiveId(id);
    await refresh();
    return id;
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      await deleteThreadFn({ data: { id } });
      const list = await refresh();
      if (activeId === id) {
        const next = list[0];
        if (next) await open(next.id);
        else {
          setActiveId(null);
          setMessages([]);
        }
      }
    },
    [activeId, open, refresh],
  );

  useEffect(() => {
    if (!enabled) {
      setThreads([]);
      setActiveId(null);
      setMessages([]);
      return;
    }
    let active = true;
    void (async () => {
      const list = await listThreadsFn();
      if (!active) return;
      setThreads(list);
      const first = list[0];
      if (first) {
        setActiveId(first.id);
        const rows = await getThreadMessagesFn({ data: { id: first.id } });
        if (active) setMessages(toUiMessages(rows));
      } else {
        const { id } = await createThreadFn();
        if (!active) return;
        setActiveId(id);
        setMessages([]);
        setThreads(await listThreadsFn());
      }
    })();
    return () => {
      active = false;
    };
  }, [enabled]);

  return { threads, activeId, messages, loading, refresh, open, create, remove, setActiveId };
}
