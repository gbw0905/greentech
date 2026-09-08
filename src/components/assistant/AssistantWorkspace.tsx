import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { PageHeading, PageShell } from "@/components/PageShell";
import { SignInPrompt } from "@/components/SignInPrompt";
import { useAuthSession } from "@/hooks/useAuthSession";
import { AssistantChat } from "./AssistantChat";
import { ThreadList } from "./ThreadList";
import { useAssistantThreads } from "./useAssistantThreads";

/** Full-page Watch Assistant with the saved conversation list. */
export function AssistantWorkspace({ threadIdFromRoute }: { threadIdFromRoute: string | null }) {
  const { signedIn, loading } = useAuthSession();
  const navigate = useNavigate();
  const { threads, activeId, messages, refresh, open, create, remove } =
    useAssistantThreads(signedIn);

  // Keep the URL and the open conversation in step.
  useEffect(() => {
    if (!signedIn) return;
    if (threadIdFromRoute && threadIdFromRoute !== activeId) {
      void open(threadIdFromRoute);
      return;
    }
    if (!threadIdFromRoute && activeId) {
      void navigate({ to: "/assistant/$threadId", params: { threadId: activeId }, replace: true });
    }
  }, [signedIn, threadIdFromRoute, activeId, open, navigate]);

  return (
    <PageShell>
      <PageHeading
        icon={MessageSquare}
        title="Watch Assistant"
        subtitle="An AI analyst for global biofuel mandates, government policy updates, producers and markets — grounded in the datasets tracked on this site."
      />

      {loading ? null : !signedIn ? (
        <div className="space-y-4">
          <SignInPrompt action="save your conversations across devices" />
          <div className="h-[60vh] overflow-hidden rounded-md border border-border bg-card">
            <AssistantChat threadId={null} initialMessages={[]} />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
          <aside className="rounded-md border border-border bg-card p-3 lg:max-h-[70vh] lg:overflow-y-auto">
            <ThreadList
              threads={threads}
              activeId={activeId}
              onSelect={(id) => {
                void navigate({ to: "/assistant/$threadId", params: { threadId: id } });
              }}
              onCreate={() => {
                void create().then((id) =>
                  navigate({ to: "/assistant/$threadId", params: { threadId: id } }),
                );
              }}
              onDelete={(id) => void remove(id)}
            />
          </aside>

          <div className="h-[70vh] overflow-hidden rounded-md border border-border bg-card">
            <AssistantChat
              key={activeId ?? "new"}
              threadId={activeId}
              initialMessages={messages}
              onActivity={() => void refresh()}
            />
          </div>
        </div>
      )}
    </PageShell>
  );
}
