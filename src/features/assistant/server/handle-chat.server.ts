import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { ASSISTANT_MODEL, SYSTEM_PROMPT, assistantTools } from "./assistant.server";
import { userIdFromRequest } from "@/features/auth/server/user-from-request.server";
import { assertAiQuota } from "@/infrastructure/ai/quota.server";
import { posthogSpanProcessor } from "@/infrastructure/telemetry/ai-observability.server";

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

export async function handleChatRequest(request: Request) {
  const body = (await request.json()) as { messages?: UIMessage[]; id?: string };
  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Messages are required", { status: 400 });
  }

  const geminiApiKey = process.env["GEMINI_API_KEY"];
  if (!geminiApiKey) {
    return new Response("GEMINI_API_KEY is not configured", { status: 500 });
  }

  const userId = await userIdFromRequest(request);
  try {
    assertAiQuota(`chat:${userId ?? "anon"}`, userId ? 20 : 6);
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Rate limited", { status: 429 });
  }

  const threadId = typeof body.id === "string" ? body.id : null;
  const model = createGoogleGenerativeAI({ apiKey: geminiApiKey })("gemini-3.8-flash");

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages.slice(-30)),
    tools: assistantTools,
    stopWhen: stepCountIs(50),
    providerOptions: { openai: { store: false } },
    runtimeContext: {
      distinctId: userId ?? undefined,
      sessionId: threadId ?? crypto.randomUUID(),
    },
    telemetry: {
      functionId: "watch-assistant",
      includeRuntimeContext: { distinctId: true, sessionId: true },
      recordInputs: true,
      recordOutputs: true,
    },
    onError: ({ error }) =>
      console.error(
        "assistant stream error",
        (error as { responseBody?: string })?.responseBody ?? error,
      ),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: finalMessages }) => {
      try {
        if (userId && threadId) await persist(userId, threadId, finalMessages);
      } catch (e) {
        console.error("assistant persist failed", e);
      } finally {
        if (posthogSpanProcessor) await posthogSpanProcessor.forceFlush().catch(() => {});
      }
    },
  });
}
