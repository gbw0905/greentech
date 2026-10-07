import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
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
    label: "Benchmarks",
    items: [
      { to: "/", hash: "markets", label: "WTI Crude", description: "US crude oil, $ per barrel" },
      { to: "/", hash: "markets", label: "S&P 500", description: "US equity index level" },
      { to: "/", hash: "markets", label: "Natural Gas", description: "Henry Hub gas, $ per MMBtu" },
    ],
  },
  {
    label: "Global Markets",
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
    label: "Datasets",
    items: [
      {
        to: "/supply",
        label: "Suppliers & producers",
        description: "Explore suppliers and users across the value chain",
      },
      {
        to: "/data-sources",
        label: "Data sources",
        description: "The evidence behind the tracker",
      },
    ],
  },
  {
    label: "Products",
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
        to: "/document-analyzer",
        label: "Policy Document Analyzer",
        description: "Read and analyse policy documents",
      },
    ],
  },
  {
    label: "Bioenergy Jobs",
    items: [
      {
        to: "/jobs",
        label: "Open roles",
        description: "Find opportunities across the bioenergy sector",
      },
    ],
  },
  {
    label: "About Us",
    items: [
      { to: "/about", label: "What we do", description: "Who we are and how the desk works" },
      {
        to: "/about/mission-vision",
        label: "Mission & vision",
        description: "Why this desk exists and where it is heading",
      },
      { to: "/about/team", label: "Team members", description: "The people behind the tracker" },
      { to: "/videos", label: "Videos", description: "Explainers on bioenergy policy and markets" },
    ],
  },
] as const;

export function SiteHeader({
  activeSection = null,
}: {
  activeSection?: "markets" | "supply" | "jobs" | null;
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
    const [pathAndSearch, locationHash] = locationHref.split("#");
    const pathname = pathAndSearch!.split("?")[0]!;
    // URL fragments are unavailable to the server during the initial render.
    const hash = hydrated ? locationHash : undefined;
    if (label === "Global Markets")
      return (
        hash === "map" ||
        hash === "updates" ||
        /^\/(countries|profiles|mandates|timeline)(\/|$)/.test(pathname)
      );
    if (label === "Benchmarks") return hash === "markets";
    if (label === "Datasets") return activeSection === "supply" || pathname === "/data-sources";
    if (label === "Products")
      return /^\/(ci-calculator|dairy-rng-calculator|my-results|document-analyzer)(\/|$)/.test(
        pathname,
      );
    if (label === "Bioenergy Jobs") return activeSection === "jobs";
    if (label === "About Us")
      return hash === "disclaimer" || /^\/(about|contact|videos)(\/|$)/.test(pathname);
    return false;
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
                align={group.label === "About Us" ? "end" : "start"}
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
          <div className="gbw-auth">
            <AuthButton entryMode="signup" />
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
