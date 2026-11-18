// Temporary Vercel build fallback: retain server diagnostics without optional
// OpenTelemetry packages that are not declared in package.json.
// Restore PostHog OTLP log exporting after installing its packages and lockfile.
let serverEntryLogged = false;

export function logServerEntryInitialized() {
  if (serverEntryLogged) return;
  serverEntryLogged = true;
  console.info("server_entry_initialized");
}

export function logSsrFallbackRendered() {
  console.error("ssr_fallback_rendered");
}

export function logSsrRequestFailed() {
  console.error("ssr_request_failed");
}
