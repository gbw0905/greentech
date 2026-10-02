import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RefreshCw, Menu, X } from "lucide-react";
import { AuthButton } from "@/features/auth/components/AuthButton";
import { AboutMenu } from "@/components/AboutMenu";
import siteLogo from "@/assets/logo.png";

const SECTIONS = [
  { to: "/", hash: "markets", label: "Markets" },
  { to: "/", hash: "map", label: "Jurisdiction map" },
  { to: "/supply", label: "Supply and producers" },
  { to: "/jobs", label: "Jobs" },
  { to: "/", hash: "alerts", label: "Email alerts" },
  { to: "/", hash: "disclaimer", label: "What we do" },
] as const;

export function SiteHeader({
  activeSection = null,
  busy = false,
  onRescan,
}: {
  activeSection?: "markets" | "supply" | "jobs" | null;
  busy?: boolean;
  onRescan: () => void;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const locationHref = useRouterState({ select: (state) => state.location.href });
  useEffect(() => setMobileNavOpen(false), [locationHref]);
  return (
    <header className="sticky top-0 z-50 border-b border-[#d6e1ea] bg-white/[.88] font-['Instrument_Sans'] text-[#0e2a43] backdrop-blur-[14px] backdrop-saturate-[1.4]">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-3 px-5 min-[621px]:px-8 min-[1160px]:gap-7">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" aria-label="Home" className="shrink-0">
            <img
              src={siteLogo}
              alt="Global Bioenergy Watch logo: a globe with a leaf and rising data line"
              width={1024}
              height={1024}
              className="size-9 shrink-0 object-contain"
            />
          </Link>
          <div className="min-w-0">
            <a
              href="https://www.linkedin.com/company/global-bioenergy-watch/?viewAsMember=true"
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-['Bricolage_Grotesque'] text-[1.05rem] leading-[1.15] font-semibold tracking-[-0.01em] text-[#0e2a43] no-underline"
            >
              Global Bioenergy Watch
            </a>
            <div className="hidden text-xs leading-[1.25] text-[#7b8ea0] min-[1160px]:block">
              Policy, Markets, Sustainability
            </div>
          </div>
        </div>

        <nav aria-label="Page sections" className="hidden min-[1160px]:block">
          <div className="flex items-center gap-0.5">
            {SECTIONS.slice(0, 5).map((section, index) => (
              <Link
                key={section.label}
                to={section.to}
                hash={"hash" in section ? section.hash : ""}
                className={`inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  index ===
                  (activeSection === "supply"
                    ? 2
                    : activeSection === "markets"
                      ? 0
                      : activeSection === "jobs"
                        ? 3
                        : -1)
                    ? "bg-[#e3f4ee] text-[#178a6b]"
                    : "text-[#4c6278] hover:bg-[#eef3f7] hover:text-[#0e2a43]"
                }`}
              >
                {section.label}
              </Link>
            ))}
            <AboutMenu />
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => onRescan()}
            disabled={busy}
            aria-label="Rescan feeds"
            className="hidden h-9 items-center justify-center gap-2 rounded-[9px] border border-[#d6e1ea] bg-white px-3 text-sm font-semibold text-[#0e2a43] transition-colors hover:border-[#178a6b] disabled:opacity-60 min-[561px]:inline-flex min-[621px]:px-3.5 min-[1160px]:min-w-[120px]"
          >
            <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} />
            <span className="hidden min-[621px]:inline">Rescan</span>
          </button>
          <div className="[&_a]:grid [&_a]:size-10 [&_a]:place-items-center [&_a]:rounded-full [&_a]:border [&_a]:border-[#d6e1ea] [&_a]:bg-[#e3f4ee] [&_a]:p-0 [&_a]:text-[#178a6b] [&_a]:shadow-none [&_a]:hover:border-[#178a6b] [&_a_.auth-label]:sr-only [&_a_svg]:size-4 [&_button]:grid [&_button]:size-10 [&_button]:place-items-center [&_button]:rounded-full [&_button]:border [&_button]:border-[#d6e1ea] [&_button]:bg-[#e3f4ee] [&_button]:p-0 [&_button]:text-[#178a6b] [&_button]:shadow-none [&_button]:hover:border-[#178a6b] [&_button_span]:hidden [&>div>span]:hidden">
            <AuthButton />
          </div>
          <button
            type="button"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
            className="grid size-10 place-items-center rounded-[10px] border border-[#d6e1ea] bg-white text-[#0e2a43] min-[1160px]:hidden"
          >
            {mobileNavOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <nav
        aria-label="Mobile page sections"
        className={`absolute top-full right-0 left-0 z-50 border-b border-[#d6e1ea] bg-white px-5 pt-2 pb-4 shadow-[0_24px_40px_-28px_rgba(14,42,67,.5)] transition-all duration-200 min-[1160px]:hidden ${
          mobileNavOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        {SECTIONS.map((section, index) => (
          <Link
            key={section.label}
            to={section.to}
            hash={"hash" in section ? section.hash : ""}
            onClick={() => setMobileNavOpen(false)}
            className={`block border-b border-[#d6e1ea] px-1 py-3 font-medium no-underline ${index === (activeSection === "supply" ? 2 : activeSection === "markets" ? 0 : activeSection === "jobs" ? 3 : -1) ? "text-[#178a6b]" : "text-[#0e2a43]"}`}
          >
            {section.label}
          </Link>
        ))}
        <Link
          to="/ci-calculator"
          onClick={() => setMobileNavOpen(false)}
          className="block border-b border-[#d6e1ea] px-1 py-3 font-medium text-[#0e2a43] no-underline"
        >
          CI calculator
        </Link>
        <Link
          to="/videos"
          onClick={() => setMobileNavOpen(false)}
          className="block border-b border-[#d6e1ea] px-1 py-3 font-medium text-[#0e2a43] no-underline"
        >
          Videos
        </Link>
        <Link
          to="/about"
          onClick={() => setMobileNavOpen(false)}
          className="block border-b border-[#d6e1ea] px-1 py-3 font-medium text-[#0e2a43] no-underline"
        >
          About us
        </Link>
        <Link
          to="/about/mission-vision"
          onClick={() => setMobileNavOpen(false)}
          className="block border-b border-[#d6e1ea] px-1 py-3 font-medium text-[#0e2a43] no-underline"
        >
          Mission &amp; vision
        </Link>
        <Link
          to="/about/team"
          onClick={() => setMobileNavOpen(false)}
          className="block border-b border-[#d6e1ea] px-1 py-3 font-medium text-[#0e2a43] no-underline"
        >
          Team members
        </Link>
        <button
          type="button"
          onClick={() => {
            setMobileNavOpen(false);
            onRescan();
          }}
          disabled={busy}
          className="mt-2 hidden w-full items-center justify-center gap-2 rounded-[9px] border border-[#d6e1ea] bg-white px-3 py-2.5 text-sm font-medium text-[#4c6278] disabled:opacity-60 max-[560px]:flex"
        >
          <RefreshCw className={`size-3.5 ${busy ? "animate-spin" : ""}`} />
          Rescan sources
        </button>
      </nav>
    </header>
  );
}
