import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, RefreshCw, Menu, X } from "lucide-react";
import { AuthButton } from "@/features/auth/components/AuthButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import siteLogo from "@/assets/logo.png";

// Every item points to an existing route; reference placeholders are not carried over.
const NAV_GROUPS = [
  {
    label: "Policy",
    items: [
      {
        to: "/",
        hash: "map",
        label: "Jurisdiction map",
        description: "Mandates and frameworks, country by country",
      },
      {
        to: "/timeline",
        label: "Latest policy updates",
        description: "New notices and market developments",
      },
      {
        to: "/mandates",
        label: "Mandate tracker",
        description: "Published obligations and policy targets",
      },
      {
        to: "/profiles",
        label: "Country profiles",
        description: "Explore every tracked jurisdiction",
      },
    ],
  },
  {
    label: "Benchmarks",
    items: [
      { to: "/", hash: "markets", label: "WTI Crude", description: "US crude oil, $ per barrel" },
      { to: "/", hash: "markets", label: "S&P 500", description: "US equity index level" },
      { to: "/", hash: "markets", label: "Natural Gas", description: "Henry Hub gas, $ per MMBtu" },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        to: "/ci-calculator",
        label: "CI calculator",
        description: "Estimate the carbon intensity of a fuel pathway",
      },
      {
        to: "/my-results",
        label: "CI WorkSpace",
        description: "Save, compare and revisit your CI scenarios",
      },
      {
        to: "/dairy-rng-calculator",
        label: "Dairy RNG calculator",
        description: "Model manure-to-fuel carbon intensity",
      },
      {
        to: "/supply",
        label: "Datasets · supply and producers",
        description: "Explore suppliers and users across the value chain",
      },
      {
        to: "/document-analyzer",
        label: "Document analyzer",
        description: "Read and analyse policy documents",
      },
    ],
  },
  {
    label: "Resources",
    items: [
      { to: "/videos", label: "Videos", description: "Explainers on bioenergy policy and markets" },
      { to: "/jobs", label: "Jobs", description: "Roles across the bioenergy sector" },
      {
        to: "/",
        hash: "disclaimer",
        label: "Method and disclaimer",
        description: "How we collect, classify and summarise",
      },
      {
        to: "/data-sources",
        label: "Data sources",
        description: "The evidence behind the tracker",
      },
    ],
  },
  {
    label: "About",
    items: [
      { to: "/about", label: "About us", description: "Who we are and how the desk works" },
      {
        to: "/about/mission-vision",
        label: "Mission & vision",
        description: "Why this desk exists and where it is heading",
      },
      { to: "/about/team", label: "Team members", description: "The people behind the tracker" },
      { to: "/contact", label: "Contact", description: "General and press enquiries" },
      { to: "/contact", label: "Submit a tip", description: "Send us a policy or market lead" },
    ],
  },
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
  const [mobileOpenGroup, setMobileOpenGroup] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const locationHref = useRouterState({ select: (state) => state.location.href });
  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    setMobileNavOpen(false);
    setMobileOpenGroup(null);
    setOpenGroup(null);
  }, [locationHref]);
  const groupActive = (label: string) => {
    const [pathname, locationHash] = locationHref.split("#");
    // URL fragments are unavailable to the server during the initial render.
    const hash = hydrated ? locationHash : undefined;
    if (label === "Policy")
      return hash === "map" || /^\/(countries|profiles|mandates|timeline)(\/|$)/.test(pathname!);
    if (label === "Benchmarks") return hash === "markets";
    if (label === "Tools")
      return (
        activeSection === "supply" ||
        /^\/(ci-calculator|dairy-rng-calculator|my-results|document-analyzer)(\/|$)/.test(pathname!)
      );
    if (label === "Resources")
      return (
        activeSection === "jobs" ||
        hash === "disclaimer" ||
        /^\/(videos|data-sources)(\/|$)/.test(pathname!)
      );
    return /^\/(about|contact)(\/|$)/.test(pathname!);
  };

  return (
    <header className="gbw-header">
      <div className="gbw-header-inner">
        <Link to="/" aria-label="Global Bioenergy Watch home" className="gbw-brand">
          <img src={siteLogo} alt="Global Bioenergy Watch logo" width={1024} height={1024} />
          <span>Global Bioenergy Watch</span>
        </Link>
        <nav aria-label="Primary" className="gbw-desktop-nav">
          {NAV_GROUPS.map((group) => (
            <DropdownMenu
              key={group.label}
              modal={false}
              open={openGroup === group.label}
              onOpenChange={(open) => setOpenGroup(open ? group.label : null)}
            >
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="gbw-nav-trigger"
                  data-active={groupActive(group.label) || undefined}
                >
                  {group.label}
                  <ChevronDown size={13} aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="gbw-nav-menu"
                aria-label={group.label}
              >
                {group.items.map((item) => (
                  <DropdownMenuItem asChild key={item.label}>
                    <Link
                      to={item.to}
                      hash={"hash" in item ? item.hash : ""}
                      className="gbw-nav-item"
                      onClick={() => setOpenGroup(null)}
                    >
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </nav>
        <div className="gbw-header-actions">
          <button
            type="button"
            className="gbw-rescan"
            aria-label="Rescan feeds"
            onClick={onRescan}
            disabled={busy}
          >
            <RefreshCw size={14} className={busy ? "animate-spin" : ""} aria-hidden="true" />
            <span>Rescan</span>
          </button>
          <div className="gbw-auth">
            <AuthButton />
          </div>
          <button
            type="button"
            className="gbw-burger"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            aria-controls="gbw-mobile-nav"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {mobileNavOpen && (
        <nav
          id="gbw-mobile-nav"
          aria-label="Mobile primary"
          className="gbw-mobile-nav"
          onKeyDown={(event) => {
            if (event.key === "Escape") setMobileNavOpen(false);
          }}
        >
          {NAV_GROUPS.map((group) => (
            <details key={group.label} open={mobileOpenGroup === group.label}>
              <summary
                onClick={(event) => {
                  event.preventDefault();
                  setMobileOpenGroup((current) => (current === group.label ? null : group.label));
                }}
              >
                {group.label}
                <ChevronDown size={15} aria-hidden="true" />
              </summary>
              <div>
                {group.items.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    hash={"hash" in item ? item.hash : ""}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
          ))}
        </nav>
      )}
    </header>
  );
}
