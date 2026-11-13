import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Minimal official-style PostHog queue loader, intentionally limited to
 * anonymous pageviews. This avoids adding the entire SDK to the app bundle.
 *
 * Requires VITE_POSTHOG_KEY = the PostHog project's public project token.
 * Project IDs (for example, 724134) are NOT project tokens.
 */
type PostHogQueue = unknown[] & {
  __SV?: number;
  _i: unknown[];
  init: (key: string, options: Record<string, unknown>) => void;
  capture: (event: string, properties?: Record<string, unknown>) => void;
  people: unknown[];
};

declare global {
  interface Window {
    posthog?: PostHogQueue;
  }
}

const POSTHOG_HOST = "https://us.i.posthog.com";
const PUBLIC_HOSTS = new Set(["globalbioenergywatch.org", "www.globalbioenergywatch.org"]);
const EXCLUDED_PATHS = ["/auth", "/account", "/profile", "/settings", "/admin"];

let initialized = false;
let lastPathname = "";

function initAnonymousPostHog(token: string): PostHogQueue {
  if (window.posthog) return window.posthog;

  const queue = [] as unknown as PostHogQueue;
  queue._i = [];
  queue.__SV = 1;
  queue.people = [];
  const methods = [
    "capture", "identify", "alias", "register", "register_once",
    "unregister", "getFeatureFlag", "isFeatureEnabled", "reset",
    "opt_in_capturing", "opt_out_capturing",
  ];
  for (const name of methods) {
    (queue as unknown as Record<string, unknown>)[name] = (...args: unknown[]) => {
      queue.push([name, ...args]);
    };
  }
  Object.defineProperty(queue, "toString", {
    configurable: true,
    value: (suffix?: boolean) => suffix ? "posthog (stub)" : "posthog",
  });
  queue.init = (key, options) => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.src = "https://us-assets.i.posthog.com/static/array.js";
    document.head.appendChild(script);
    queue._i.push([key, options, "posthog"]);
  };
  window.posthog = queue;
  queue.init(token, {
    api_host: POSTHOG_HOST,
    defaults: "2026-08-30",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    disable_persistence: true,
    disable_external_dependency_loading: true,
    disable_surveys: true,
    disable_web_experiments: true,
    disable_product_tours: true,
    disable_conversations: true,
    person_profiles: "never",
    // Pageview-only allowlist. Do not collect form values, calculator inputs,
    // auth tokens, email addresses, or URL search/query parameters.
    before_send: (event: { event: string; properties?: Record<string, unknown> }) => {
      if (event.event !== "$pageview") return null;
      return {
        ...event,
        properties: {
          $current_url: `${window.location.origin}${window.location.pathname}`,
          $host: window.location.hostname,
          $pathname: window.location.pathname,
          $lib: "web",
        },
      };
    },
  });
  return queue;
}

/** Track one anonymous, query-free pageview per client-side route change. */
export function PostHogPageviews() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (!PUBLIC_HOSTS.has(window.location.hostname)) return;
    if (EXCLUDED_PATHS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return;

    const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
    if (!key || !key.trim()) return;

    if (!initialized) {
      initAnonymousPostHog(key.trim());
      initialized = true;
    }
    if (lastPathname === pathname) return;
    lastPathname = pathname;
    window.posthog?.capture("$pageview", {
      $current_url: `${window.location.origin}${pathname}`,
      $pathname: pathname,
    });
  }, [pathname]);

  return null;
}
