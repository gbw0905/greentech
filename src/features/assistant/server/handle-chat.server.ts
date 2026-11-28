import type { Json } from "@/integrations/supabase/types";
import { clientIp } from "@/infrastructure/http/server/request-limit.server";
import { readJson, RequestBodyError } from "@/infrastructure/http/server/request-body.server";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  convertToModelMessages,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { ASSISTANT_MODEL, SYSTEM_PROMPT, assistantTools } from "./assistant.server";
import { userIdFromRequest } from "@/features/auth/server/user-from-request.server";
import { assertAiQuota } from "@/infrastructure/ai/quota.server";

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

  const { error } = await supabaseAdmin.rpc("replace_chat_transcript", {
    p_thread_id: threadId,
    p_user_id: userId,
    p_title:
      firstText(messages.find((message) => message.role === "user")).slice(0, 70) ||
      "New conversation",
    p_messages: messages.map(({ role, parts }) => ({ role, parts: parts as unknown as Json })),
  });
  if (error) throw error;
}

export async function handleChatRequest(request: Request) {
  const input = await readJson(request, 1_048_576).catch((error: RequestBodyError) => error);
  if (input instanceof RequestBodyError)
    return new Response(input.message, { status: input.status });
  const body = z
    .object({
      messages: z.array(z.unknown()).min(1).max(300),
      id: z.uuid().optional(),
    })
    .safeParse(input);
  if (!body.success) return new Response("Invalid conversation", { status: 400 });

  const geminiApiKey = process.env["GEMINI_API_KEY"];
  if (!geminiApiKey) return new Response("Assistant unavailable", { status: 503 });

  const userId = await userIdFromRequest(request);
  try {
    if (!userId) assertAiQuota("chat:guest", 60);
    assertAiQuota(`chat:${userId ?? clientIp(request)}`, userId ? 20 : 6);
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "Rate limited", { status: 429 });
  }

  const checked = await safeValidateUIMessages({
    messages: body.data.messages,
    tools: assistantTools,
  });
  if (!checked.success || checked.data.some((message) => message.role === "system"))
    return new Response("Invalid conversation messages", { status: 400 });
  const messages = checked.data;
  const threadId = body.data.id;
  const model = createGoogleGenerativeAI({ apiKey: geminiApiKey })(ASSISTANT_MODEL);

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages.slice(-30)),
    tools: assistantTools,
    stopWhen: stepCountIs(12),
    providerOptions: { openai: { store: false } },
    runtimeContext: {
      distinctId: userId ?? undefined,
      sessionId: threadId ?? crypto.randomUUID(),
    },
    telemetry: {
      functionId: "watch-assistant",
      includeRuntimeContext: { distinctId: true, sessionId: true },
      recordInputs: false,
      recordOutputs: false,
    },
    onError: ({ error }) =>
      console.error("assistant stream error", error instanceof Error ? error.name : "UnknownError"),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: finalMessages }) => {
      try {
        if (userId && threadId) await persist(userId, threadId, finalMessages);
      } catch (e) {
        console.error("assistant persist failed", e);
      }
    },
  });
}
