import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { AuthButton } from "@/features/auth/components/AuthButton";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import siteLogo from "@/assets/logo.png";
import "./SiteHeader.css";

// Every item points to an existing route; reference placeholders are not carried over.
const NAV_GROUPS = [
  {
    label: "Benchmarks",
    items: [],
  },
  {
    label: "Global Markets",
    items: [
      {
        to: "/",
        hash: "map",
        label: "Jurisdiction map",
      },
      {
        to: "/timeline",
        label: "Latest policy updates",
      },
      {
        to: "/mandates",
        label: "Mandate tracker",
      },
      { to: "/videos", label: "Videos" },
    ],
  },
  {
    label: "Datasets",
    items: [
      {
        to: "/supply",
        label: "Suppliers & producers",
      },
      {
        to: "/data-sources",
        label: "Data sources",
      },
    ],
  },
  {
    label: "Products",
    items: [
      { to: "/civanta", label: "CIVanta" },
      { to: "/document-analyzer", label: "Policy Document Analyzer" },
    ],
  },
  {
    label: "Bioenergy Jobs",
    items: [
      {
        to: "/jobs",
        label: "Open roles",
      },
    ],
  },
  {
    label: "About Us",
    items: [
      { to: "/about", label: "What we do" },
      {
        to: "/about/mission-vision",
        label: "Mission & vision",
      },
      { to: "/about/team", label: "Team members" },
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
  const isHome = locationHref.split(/[?#]/)[0] === "/";
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
        /^\/(countries|mandates|timeline|videos)(\/|$)/.test(pathname)
      );
    if (label === "Benchmarks") return hash === "markets";
    if (label === "Datasets") return activeSection === "supply" || pathname === "/data-sources";
    if (label === "Products")
      return /^\/(civanta|credit-calculator|ci-calculator|ci-workspace|dairy-rng-calculator|my-results|document-analyzer)(\/|$)/.test(
        pathname,
      );
    if (label === "Bioenergy Jobs") return activeSection === "jobs" || pathname === "/jobs";
    if (label === "About Us") return /^\/about(\/|$)/.test(pathname);
    return false;
  };

  return (
    <header className="gbw-header">
      <div className="gbw-header-inner">
        <Link to="/" aria-label="Global Bioenergy Watch home" className="gbw-brand">
          <img src={siteLogo} alt="Global Bioenergy Watch logo" width={1024} height={1024} />
          <span>Global Bioenergy Watch</span>
        </Link>
        <NavigationMenu.Root
          asChild
          value={openGroup ?? ""}
          onValueChange={(value) => setOpenGroup(value || null)}
          delayDuration={80}
          skipDelayDuration={250}
        >
          <nav aria-label="Primary" className="gbw-desktop-nav">
            <NavigationMenu.List className="gbw-nav-list">
              {NAV_GROUPS.map((group) => (
                <NavigationMenu.Item
                  key={group.label}
                  value={group.label}
                  className="gbw-nav-group"
                >
                  {group.label === "Bioenergy Jobs" || group.label === "Benchmarks" ? (
                    <NavigationMenu.Link asChild>
                      <Link
                        to={group.label === "Benchmarks" ? "/" : "/jobs"}
                        hash={group.label === "Benchmarks" ? "markets" : ""}
                        className="gbw-nav-trigger"
                        data-active={groupActive(group.label) || undefined}
                        onPointerEnter={() => setOpenGroup(null)}
                      >
                        {group.label}
                      </Link>
                    </NavigationMenu.Link>
                  ) : (
                    <>
                      <NavigationMenu.Trigger
                        className="gbw-nav-trigger"
                        data-active={groupActive(group.label) || undefined}
                      >
                        {group.label}
                        <ChevronDown size={13} aria-hidden />
                      </NavigationMenu.Trigger>
                      <NavigationMenu.Content
                        className="gbw-nav-menu"
                        data-align={group.label === "About Us" ? "end" : "start"}
                      >
                        {group.items.map((item) => (
                          <NavigationMenu.Link asChild key={item.label}>
                            <Link
                              to={item.to}
                              hash={"hash" in item ? item.hash : ""}
                              className="gbw-nav-item"
                              onClick={() => setOpenGroup(null)}
                            >
                              <strong>{item.label}</strong>
                            </Link>
                          </NavigationMenu.Link>
                        ))}
                      </NavigationMenu.Content>
                    </>
                  )}
                </NavigationMenu.Item>
              ))}
            </NavigationMenu.List>
          </nav>
        </NavigationMenu.Root>
        <div className="gbw-header-actions">
          <div className="gbw-auth">
            <AuthButton entryMode={isHome ? "signin" : "signup"} />
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
          {NAV_GROUPS.map((group) =>
            group.label === "Bioenergy Jobs" || group.label === "Benchmarks" ? (
              <Link
                key={group.label}
                to={group.label === "Benchmarks" ? "/" : "/jobs"}
                hash={group.label === "Benchmarks" ? "markets" : ""}
                className="gbw-mobile-direct"
                onClick={() => setMobileNavOpen(false)}
              >
                {group.label}
              </Link>
            ) : (
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
            ),
          )}
        </nav>
      )}
    </header>
  );
}
