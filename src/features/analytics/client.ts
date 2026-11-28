const token = import.meta.env["VITE_PUBLIC_POSTHOG_PROJECT_TOKEN"];
let client: ReturnType<typeof loadAnalytics> | undefined;

async function loadAnalytics() {
  const { default: posthog } = await import("posthog-js");
  posthog.init(token, {
    api_host: import.meta.env["VITE_PUBLIC_POSTHOG_HOST"],
    defaults: "2026-08-30",
    autocapture: false,
    disable_session_recording: true,
    before_send: (event) => {
      if (!event) return null;
      if (
        /^\/(?:auth|api|alerts\/confirm|alerts\/unsubscribe|admin)(?:\/|$)/.test(location.pathname)
      ) {
        return null;
      }
      for (const key of [
        "$current_url",
        "$referrer",
        "$initial_current_url",
        "$initial_referrer",
      ]) {
        const value = event.properties?.[key];
        if (typeof value === "string") event.properties![key] = value.split(/[?#]/, 1)[0];
        const setValue = event.$set_once?.[key];
        if (typeof setValue === "string") event.$set_once![key] = setValue.split(/[?#]/, 1)[0];
      }
      return event;
    },
  });
  return posthog;
}

export function getAnalytics() {
  if (!token || typeof window === "undefined") return;
  return (client ??= loadAnalytics());
}

export function capture(event: string, properties?: Record<string, unknown>) {
  void getAnalytics()
    ?.then((analytics) => analytics.capture(event, properties))
    .catch(() => {});
}
