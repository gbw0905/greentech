import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const projectToken =
  process.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN ??
  import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.VITE_PUBLIC_POSTHOG_HOST ?? import.meta.env.VITE_PUBLIC_POSTHOG_HOST;

function warnForMissingConfiguration(variableName: string) {
  if (import.meta.env.DEV) {
    console.warn(
      `${variableName} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${variableName} is configured`,
    );
  }
}

function createPostHogLogger() {
  if (!projectToken) {
    warnForMissingConfiguration("VITE_PUBLIC_POSTHOG_PROJECT_TOKEN");
    return null;
  }

  if (!host) {
    warnForMissingConfiguration("VITE_PUBLIC_POSTHOG_HOST");
    return null;
  }

  try {
    const loggerProvider = new LoggerProvider({
      resource: resourceFromAttributes({
        "service.name": "global-bioenergy-watch",
      }),
      processors: [
        new BatchLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: new URL("/i/v1/logs", host).toString(),
            headers: {
              Authorization: `Bearer ${projectToken}`,
            },
          }),
        }),
      ],
    });

    return {
      logger: loggerProvider.getLogger("posthog-exporter"),
      shutdown: () => loggerProvider.shutdown(),
    };
  } catch {
    if (import.meta.env.DEV) {
      console.warn("PostHog log export is disabled because VITE_PUBLIC_POSTHOG_HOST is invalid.");
    }
    return null;
  }
}

const posthogLogPipeline = createPostHogLogger();
const posthogLogger = posthogLogPipeline?.logger;

if (typeof process !== "undefined") {
  const shutdownLogPipeline = () => {
    void posthogLogPipeline?.shutdown().catch(() => {});
  };
  process.once("SIGINT", shutdownLogPipeline);
  process.once("SIGTERM", shutdownLogPipeline);
}

let serverEntryLogged = false;

export function logServerEntryInitialized() {
  if (serverEntryLogged) return;
  serverEntryLogged = true;
  posthogLogger?.emit({
    severityText: "INFO",
    body: "server_entry_initialized",
    attributes: { component: "tanstack_start" },
  });
}

export function logSsrFallbackRendered() {
  posthogLogger?.emit({
    severityText: "ERROR",
    body: "ssr_fallback_rendered",
    attributes: { http_response_status_code: 500 },
  });
}

export function logSsrRequestFailed() {
  posthogLogger?.emit({
    severityText: "ERROR",
    body: "ssr_request_failed",
    attributes: { http_response_status_code: 500 },
  });
}
