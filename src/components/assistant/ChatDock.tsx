import { lazy, Suspense, useState } from "react";
import { ClientOnly, Link } from "@tanstack/react-router";
import { List, Maximize2, MessageSquare, X } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { ThreadList } from "./ThreadList";
import { useAssistantThreads } from "./useAssistantThreads";
import assistantMark from "@/assets/logo.png";

const AssistantChat = lazy(() =>
  import("./AssistantChat").then((module) => ({ default: module.AssistantChat })),
);

/** Floating Watch Assistant available on every page. */
export function ChatDock() {
  const { signedIn } = useAuthSession();
  const [open, setOpen] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const { threads, activeId, messages, refresh, open: openThread, create, remove } =
    useAssistantThreads(signedIn && open);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Watch Assistant"
        className="fixed right-4 bottom-4 z-50 inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-4 py-3 text-sm font-semibold text-ink-foreground shadow-lg transition-transform hover:scale-105"
      >
        <img src={assistantMark} alt="" width={20} height={20} className="size-5 rounded object-contain" />
        <span className="hidden sm:inline">Ask the assistant</span>
        <MessageSquare className="size-4 sm:hidden" />
      </button>
    );
  }

  return (
    <div className="fixed inset-x-2 bottom-2 z-50 flex h-[75vh] max-h-[38rem] flex-col overflow-hidden rounded-md border border-border bg-card shadow-2xl sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[26rem]">
      <header className="flex items-center gap-2 border-b border-border bg-ink px-3 py-2 text-ink-foreground">
        <img src={assistantMark} alt="" width={22} height={22} className="size-[22px] rounded object-contain" />
        <span className="min-w-0 flex-1 truncate text-sm font-bold">Watch Assistant</span>
        {signedIn ? (
          <>
            <button
              type="button"
              onClick={() => setShowThreads((v) => !v)}
              aria-label="Conversations"
              className="opacity-80 hover:opacity-100"
            >
              <List className="size-4" />
            </button>
            {activeId ? (
              <Link
                to="/assistant/$threadId"
                params={{ threadId: activeId }}
                aria-label="Open full page"
                className="opacity-80 hover:opacity-100"
                onClick={() => setOpen(false)}
              >
                <Maximize2 className="size-4" />
              </Link>
            ) : null}
          </>
        ) : null}
        <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="opacity-80 hover:opacity-100">
          <X className="size-4" />
        </button>
      </header>

      {signedIn && showThreads ? (
        <div className="max-h-48 overflow-y-auto border-b border-border p-2">
          <ThreadList
            threads={threads}
            activeId={activeId}
            onSelect={(id) => {
              void openThread(id);
              setShowThreads(false);
            }}
            onCreate={() => {
              void create();
              setShowThreads(false);
            }}
            onDelete={(id) => void remove(id)}
          />
        </div>
      ) : null}

      {!signedIn ? (
        <p className="border-b border-border bg-secondary px-3 py-2 text-xs text-secondary-foreground">
          You can chat as a guest.{" "}
          <Link to="/auth" className="font-semibold underline underline-offset-2">
            Sign in
          </Link>{" "}
          to save conversations across your devices.
        </p>
      ) : null}

      <div className="min-h-0 flex-1">
        <ClientOnly fallback={
          <div className="flex h-full items-center justify-center px-4 text-sm text-muted-foreground">
            Opening assistant…
          </div>
        }>
          <Suspense
          fallback={
            <div className="flex h-full items-center justify-center px-4 text-sm text-muted-foreground">
              Opening assistant…
            </div>
          }
          >
            <AssistantChat
              key={activeId ?? "guest"}
              threadId={signedIn ? activeId : null}
              initialMessages={messages}
              onActivity={() => void refresh()}
              compact
            />
          </Suspense>
        </ClientOnly>
      </div>
    </div>
  );
}
