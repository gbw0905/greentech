// Keep direct Gemini generation event capture available without optional OTel packages.
// The OpenTelemetry bridge can be restored after its dependencies are installed
// and a separate preview deployment is validated.
import { getPostHogClient } from "@/infrastructure/telemetry/posthog.server";

type GeminiUsagePayload = {
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

type CaptureGeminiGenerationInput = {
  spanName: string;
  model: string;
  response: unknown;
  startedAt: number;
  distinctId?: string | undefined;
  sessionId?: string | null;
  maxTokens?: number;
  temperature?: number;
};

/** Records a direct Gemini REST response without changing the provider request or result. */
export async function captureGeminiGeneration({
  spanName,
  model,
  response,
  startedAt,
  distinctId,
  sessionId = null,
  maxTokens,
  temperature,
}: CaptureGeminiGenerationInput) {
  const posthog = getPostHogClient();
  if (!posthog) return;

  const usage = (response as GeminiUsagePayload).usageMetadata;
  const traceId = crypto.randomUUID();
  try {
    posthog.capture({
      distinctId: distinctId ?? sessionId ?? traceId,
      event: "$ai_generation",
      properties: {
        $ai_trace_id: traceId,
        $ai_session_id: sessionId,
        $ai_span_name: spanName,
        $ai_model: model,
        $ai_provider: "gemini",
        $ai_input_tokens: usage?.promptTokenCount,
        $ai_output_tokens: usage?.candidatesTokenCount,
        $ai_latency: (Date.now() - startedAt) / 1000,
        $ai_max_tokens: maxTokens,
        $ai_temperature: temperature,
      },
    });
    await posthog.flush().catch(() => {});
  } catch {
    // AI observability must never affect an already successful model response.
  }
}
