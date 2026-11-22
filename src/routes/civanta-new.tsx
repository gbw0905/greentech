import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/civanta-new")({
  head: () => ({
    links: [{ rel: "stylesheet", href: "/civanta-workspace/assets/civanta-actions.css?v=5" }],
    meta: [
      { title: "CIVanta New | Global Bioenergy Watch" },
      {
        name: "description",
        content:
          "Build and save plant pathways, compare CI scenarios and estimate credit potential.",
      },
    ],
  }),
  component: CivantaPage,
});

function CivantaPage() {
  const frame = useRef<HTMLIFrameElement>(null);
  const quickActionsHost = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(720);
  const [portfolioOpen, setPortfolioOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const workspace = frame.current;
    const host = quickActionsHost.current;
    if (!workspace || !host) return;
    host.dataset.ready = "true";

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
        setPortfolioOpen(body.classList.contains("plant-list-open"));
      }
    };
    const portfolioObserver = new MutationObserver(syncPortfolio);

    function observeWorkspace() {
      observer.disconnect();
      portfolioObserver.disconnect();
      const body = workspace?.contentDocument?.body;
      if (!body) return;
      measure();
      syncPortfolio();
      observer.observe(body);
      portfolioObserver.observe(body, { attributes: true, attributeFilter: ["class", "data-workspace-ready"] });
      workspace?.contentWindow?.postMessage({ type: "civanta-mount-actions" }, window.location.origin);
    }

    function receiveWorkspaceMessage(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow
      ) {
        return;
      }

      if (event.data?.type === "civanta-scroll") {
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        workspace?.scrollIntoView({ block: "start", behavior: reducedMotion ? "instant" : "smooth" });
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
  }, []);

  return (
    <main
      className="civanta-host flex-1 bg-background"
      data-portfolio={portfolioOpen ? "" : undefined}
      data-workspace-ready={portfolioOpen !== null ? "" : undefined}
    >
      <div ref={quickActionsHost} data-civanta-actions-host />
      <iframe
        ref={frame}
        src="/civanta-workspace/index.html"
        title="CIVanta fuel pathway workspace"
        referrerPolicy="same-origin"
        className="mx-auto block w-[min(var(--site-content-width),calc(100%_-_2_*_var(--site-gutter)))] border-0 [scroll-margin-top:var(--site-chrome-height)]"
        style={{ height }}
      />
    </main>
  );
}
