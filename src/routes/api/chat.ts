import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { ASSISTANT_MODEL, SYSTEM_PROMPT, assistantTools } from "@/lib/assistant.server";
import { userIdFromRequest } from "@/lib/assistant-auth.server";
import { assertAiQuota } from "@/lib/ai-quota.server";

function firstText(message: UIMessage | undefined) {
  if (!message) return "";
  return message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .trim();
}

/** Replaces the stored transcript for a thread the caller owns. */
async function persist(userId: string, threadId: string, messages: UIMessage[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: thread } = await supabaseAdmin
    .from("chat_threads")
    .select("id,title,user_id")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread || thread.user_id !== userId) return;

  await supabaseAdmin.from("chat_messages").delete().eq("thread_id", threadId);
  if (messages.length > 0) {
    await supabaseAdmin.from("chat_messages").insert(
      messages.map((m) => ({
        thread_id: threadId,
        user_id: userId,
        role: m.role,
        parts: m.parts as unknown as never,
      })),
    );
  }

  const title =
    thread.title && thread.title !== "New conversation"
      ? thread.title
      : firstText(messages.find((m) => m.role === "user")).slice(0, 70) || "New conversation";

  await supabaseAdmin
    .from("chat_threads")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", threadId);
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: UIMessage[]; id?: string };
        const messages = body.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Messages are required", { status: 400 });
        }

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });

        const userId = await userIdFromRequest(request);
        try {
          assertAiQuota(`chat:${userId ?? "anon"}`, userId ? 20 : 6);
        } catch (e) {
          return new Response(e instanceof Error ? e.message : "Rate limited", { status: 429 });
        }

        const openai = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: "unused",
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
        });

        const result = streamText({
          model: openai.responses(ASSISTANT_MODEL),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages.slice(-30)),
          tools: assistantTools,
          stopWhen: stepCountIs(50),
          providerOptions: { openai: { store: false } },
          onError: ({ error }) =>
            console.error(
              "assistant stream error",
              (error as { responseBody?: string })?.responseBody ?? error,
            ),
        });

        const threadId = typeof body.id === "string" ? body.id : null;

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          onFinish: async ({ messages: finalMessages }) => {
            if (!userId || !threadId) return;
            try {
              await persist(userId, threadId, finalMessages);
            } catch (e) {
              console.error("assistant persist failed", e);
            }
          },
        });
      },
    },
  },
});
