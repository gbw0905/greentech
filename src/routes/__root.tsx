import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { PostHogProvider, usePostHog } from "@posthog/react";

import appCss from "../styles.css?url";
import { SiteLayout } from "@/components/SiteLayout";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";

const posthogToken = import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN as string | undefined;
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST as string | undefined;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const posthog = usePostHog();
  useEffect(() => {
    console.error("Root error boundary caught:", error);
    posthog.captureException(error);
  }, [error, posthog]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function PostHogIdentity() {
  const posthog = usePostHog();
  const { user } = useAuthSession();
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      if (identifiedUserId.current) {
        posthog.reset();
        identifiedUserId.current = null;
      }
      return;
    }

    if (identifiedUserId.current === user.id) return;

    if (identifiedUserId.current) {
      posthog.reset();
    }

    posthog.identify(user.id, {
      ...(user.email ? { email: user.email } : {}),
      ...(user.full_name ? { name: user.full_name } : {}),
      ...(user.avatar_url ? { avatar_url: user.avatar_url } : {}),
    });
    identifiedUserId.current = user.id;
  }, [posthog, user]);

  return null;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Global Bioenergy Watch — Worldwide Biofuel Policy Tracker" },
      {
        name: "description",
        content:
          "Worldwide biofuel and bioenergy policy tracker with live government mandates, market updates and production data.",
      },
      { name: "author", content: "Global Bioenergy Watch" },
      { name: "google-site-verification", content: "kk1yedKT7BHoNWBTFpeMTp_j7INL7XAT6U2QS4AfQj8" },
      { property: "og:site_name", content: "Global Bioenergy Watch" },
      {
        property: "og:title",
        content: "Global Bioenergy Watch — Worldwide Biofuel Policy Tracker",
      },
      {
        property: "og:description",
        content:
          "Worldwide biofuel and bioenergy policy tracker with live government mandates, market updates and production data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0A1730" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Bioenergy Watch" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Instrument+Sans:wght@400;500;600&family=Sora:wght@400;600;700;800&family=Manrope:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-180.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const { queryClient } = Route.useRouteContext();
  const app = (
    <QueryClientProvider client={queryClient}>
      {posthogToken ? <PostHogIdentity /> : null}
      <SiteLayout>{children}</SiteLayout>
    </QueryClientProvider>
  );

  if (!posthogToken && import.meta.env.DEV && typeof window !== "undefined") {
    console.error(
      "VITE_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once VITE_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
    );
  }

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {posthogToken ? (
          <PostHogProvider
            apiKey={posthogToken}
            options={{
              api_host: posthogHost,
              defaults: "2026-08-30",
              capture_exceptions: true,
              debug: import.meta.env.DEV,
              tracing_headers:
                typeof window !== "undefined" ? [window.location.hostname] : [],
            }}
          >
            {app}
          </PostHogProvider>
        ) : (
          app
        )}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  // Required: nested routes render here. Removing <Outlet /> breaks all child routes.
  return <Outlet />;
}
