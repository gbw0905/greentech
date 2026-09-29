import { useCallback, useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { supabase } from "@/integrations/supabase/client";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@/components/ai-elements/tool";
import { Shimmer } from "@/components/ai-elements/shimmer";
import assistantMark from "@/assets/logo.png";

const SUGGESTIONS = [
  "What does Indonesia's biodiesel mandate require in 2026?",
  "Latest EU renewable fuel policy updates",
  "Which countries have SAF mandates in force?",
  "Who are the largest ethanol producers we track?",
];

/** Sends the Supabase access token so the assistant server can save the thread. */
const transport = new DefaultChatTransport({
  api: "/api/chat",
  fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const headers = new Headers(init?.headers);
    if (token) headers.set("authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  }) as typeof fetch,
});

export function AssistantChat({
  threadId,
  initialMessages,
  onActivity,
  compact,
}: {
  /** Thread the transcript is saved to; null means an unsaved session. */
  threadId: string | null;
  initialMessages: UIMessage[];
  onActivity?: () => void;
  compact?: boolean;
}) {
  const chatId = threadId ?? "guest";
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    onFinish: () => onActivity?.(),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    inputRef.current?.focus();
  }, [chatId]);

  const send = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value || busy) return;
      void sendMessage({ text: value });
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [busy, sendMessage],
  );

  const errorMessage = useMemo(() => {
    if (!error) return null;
    const raw = error.message || "";
    if (raw.includes("429") || raw.toLowerCase().includes("too many"))
      return "Too many questions in a short time — please wait a minute and try again.";
    return "The assistant could not answer right now. Please try again.";
  }, [error]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className={compact ? "gap-3 p-3" : undefined}>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={
                <img
                  src={assistantMark}
                  alt=""
                  width={48}
                  height={48}
                  className="size-12 rounded-md object-contain"
                />
              }
              title="Watch Assistant"
              description="Ask about biofuel mandates, policy updates, producers or markets — answers cite the pages they come from."
            >
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs font-medium hover:border-primary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : null}

          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, i) => {
                  if (part.type === "text")
                    return <MessageResponse key={i}>{part.text}</MessageResponse>;
                  if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
                    const toolPart = part as ToolPart;
                    return (
                      <Tool defaultOpen={false} key={i}>
                        <ToolHeader
                          {...({
                            type: toolPart.type,
                            state: toolPart.state,
                            ...("toolName" in toolPart ? { toolName: toolPart.toolName } : {}),
                          } as React.ComponentProps<typeof ToolHeader>)}
                        />
                        <ToolContent>
                          <ToolInput input={"input" in toolPart ? toolPart.input : undefined} />
                          <ToolOutput
                            errorText={"errorText" in toolPart ? toolPart.errorText : undefined}
                            output={"output" in toolPart ? toolPart.output : undefined}
                          />
                        </ToolContent>
                      </Tool>
                    );
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}

          {status === "submitted" ? (
            <Shimmer className="px-1 text-sm">Checking the policy and market data…</Shimmer>
          ) : null}

          {errorMessage ? (
            <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-3">
        <PromptInput
          onSubmit={(message, event) => {
            event.preventDefault();
            const text = message.text ?? "";
            if (!text.trim()) return;
            send(text);
            event.currentTarget.reset();
          }}
        >
          <PromptInputTextarea
            ref={inputRef}
            placeholder="Ask about a mandate, country, producer or market…"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={busy} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-[0.7rem] text-muted-foreground">
          AI-generated answers can be wrong. Verify against primary legislation and official sources
          before compliance decisions.
        </p>
      </div>
    </div>
  );
}
