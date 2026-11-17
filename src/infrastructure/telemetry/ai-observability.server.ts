import { OpenTelemetry } from "@ai-sdk/otel";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { PostHogSpanProcessor } from "@posthog/ai/otel";
import { registerTelemetry } from "ai";
import { getPostHogClient } from "@/infrastructure/telemetry/posthog.server";

const projectToken =
  process.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN ??
  import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.VITE_PUBLIC_POSTHOG_HOST ?? import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

export const posthogSpanProcessor = projectToken
  ? new PostHogSpanProcessor({ projectToken, host })
  : null;

if (!projectToken) {
  if (import.meta.env.DEV) {
    console.warn(
      "VITE_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
    );
  }
} else if (posthogSpanProcessor) {
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      "service.name": "global-bioenergy-watch",
    }),
    spanProcessors: [posthogSpanProcessor],
  });
  sdk.start();

  registerTelemetry(
    new OpenTelemetry({
      enrichSpan: ({ runtimeContext }) => ({
        "posthog.distinct_id":
          typeof runtimeContext?.distinctId === "string" ? runtimeContext.distinctId : undefined,
        "$ai_session_id":
          typeof runtimeContext?.sessionId === "string" ? runtimeContext.sessionId : undefined,
      }),
    }),
  );
}

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
  input: string;
  output: string;
  response: unknown;
  startedAt: number;
  distinctId?: string;
  sessionId?: string | null;
  maxTokens?: number;
  temperature?: number;
};

/** Records a direct Gemini REST response without changing the provider request or result. */
export async function captureGeminiGeneration({
  spanName,
  model,
  input,
  output,
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
        $ai_input: [{ role: "user", content: input }],
        $ai_input_tokens: usage?.promptTokenCount,
        $ai_output_choices: [{ role: "assistant", content: output }],
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
