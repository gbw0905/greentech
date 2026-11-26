import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuthSession } from "@/features/auth/hooks/useAuthSession";

export const Route = createFileRoute("/civanta")({
  head: () => ({
    links: [{ rel: "stylesheet", href: "/civanta-workspace/assets/civanta-actions.css?v=11" }],
    meta: [
      { title: "CIVanta | Global Bioenergy Watch" },
      {
        name: "description",
        content:
          "Build and save plant pathways, compare CI scenarios and estimate credit potential.",
      },
    ],
  }),
  component: CivantaPage,
});

const workspaceUrl = "/civanta-workspace/index.html";

type WorkspaceState = "loading" | "error" | "portfolio" | "plant";

function CivantaPage() {
  const { user, loading: authLoading } = useAuthSession();
  const frame = useRef<HTMLIFrameElement>(null);
  const quickActionsHost = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(720);
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const ready = workspaceState === "portfolio" || workspaceState === "plant";
  useEffect(() => {
    if (!authLoading && ready) {
      frame.current?.contentWindow?.postMessage(
        { type: "civanta-auth-changed" },
        window.location.origin,
      );
    }
  }, [user?.id, authLoading, ready]);
  useEffect(() => {
    const workspace = frame.current;
    const host = quickActionsHost.current;
    if (!workspace || !host) return;
    host.dataset["ready"] = "true";

    function measure() {
      const body = workspace?.contentDocument?.body;
      if (body) {
        const minimum = body.classList.contains("plant-list-open") ? 0 : 500;
        setHeight(Math.max(minimum, Math.ceil(body.offsetHeight)));
      }
    }

    const observer = new ResizeObserver(measure);
    const syncPortfolio = () => {
      const body = workspace.contentDocument?.body;
      if (body?.hasAttribute("data-workspace-ready")) {
        setWorkspaceState(body.classList.contains("plant-list-open") ? "portfolio" : "plant");
      }
    };
    const portfolioObserver = new MutationObserver(syncPortfolio);

    function observeWorkspace() {
      observer.disconnect();
      portfolioObserver.disconnect();
      const document = workspace?.contentDocument;
      if (document?.URL === "about:blank") return;
      const body = document?.body;
      if (!body?.hasAttribute("data-workspace-ready")) {
        if (!document || document.readyState === "complete") setWorkspaceState("error");
        return;
      }
      measure();
      syncPortfolio();
      observer.observe(body);
      portfolioObserver.observe(body, {
        attributes: true,
        attributeFilter: ["class", "data-workspace-ready"],
      });
      workspace?.contentWindow?.postMessage(
        { type: "civanta-mount-actions" },
        window.location.origin,
      );
    }

    function receiveWorkspaceMessage(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow
      ) {
        return;
      }

      if (event.data?.type === "civanta-workspace-ready") {
        observeWorkspace();
      } else if (event.data?.type === "civanta-scroll") {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        workspace?.scrollIntoView({
          block: "start",
          behavior: reducedMotion ? "instant" : "smooth",
        });
      }
    }

    workspace.addEventListener("load", observeWorkspace);
    window.addEventListener("message", receiveWorkspaceMessage);
    observeWorkspace();
    return () => {
      observer.disconnect();
      portfolioObserver.disconnect();
      workspace.removeEventListener("load", observeWorkspace);
      window.removeEventListener("message", receiveWorkspaceMessage);
    };
  }, [loadAttempt]);

  function retry() {
    setWorkspaceState("loading");
    setLoadAttempt((attempt) => attempt + 1);
  }

  return (
    <main
      className="civanta-host flex-1 bg-background"
      data-portfolio={workspaceState === "portfolio" ? "" : undefined}
      data-workspace-ready={ready ? "" : undefined}
    >
      <div ref={quickActionsHost} data-civanta-actions-host />
      {!ready && (
        <div className="civanta-workspace-status">
          {workspaceState === "error" ? (
            <>
              <p role="alert">The workspace couldn’t load.</p>
              <button type="button" onClick={retry}>
                Try again
              </button>
            </>
          ) : (
            <>
              <span className="civanta-workspace-spinner" aria-hidden="true" />
              <p role="status">Loading workspace…</p>
            </>
          )}
        </div>
      )}
      <iframe
        key={loadAttempt}
        ref={frame}
        src={workspaceUrl}
        title="CIVanta fuel pathway workspace"
        referrerPolicy="same-origin"
        className="mx-auto block w-[min(var(--site-content-width),calc(100%_-_2_*_var(--site-gutter)))] border-0 [scroll-margin-top:var(--site-chrome-height)]"
        style={{ height }}
      />
    </main>
  );
}
