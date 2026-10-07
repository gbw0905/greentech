import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, Linkedin, Youtube, Rss } from "lucide-react";
import { feedQuery } from "@/features/policy/feed-query";
import { FooterNewsletter } from "./FooterNewsletter";
import siteLogo from "@/assets/logo.png";
import "./IntelligenceFooter.css";

export function IntelligenceFooter() {
  const { data: feed } = useQuery(feedQuery);
  const scannedAt = feed?.fetchedAt ? new Date(feed.fetchedAt) : null;
  const lastScan =
    scannedAt && !Number.isNaN(scannedAt.getTime())
      ? scannedAt.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        })
      : null;
  return (
    <footer className="gbw-footer" id="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div>
            <Link to="/" className="footer-logo">
              <img src={siteLogo} width={48} height={48} className="footer-logo-img" alt="" />
              <span>
                <span className="footer-brand-name">Global Bioenergy Watch</span>
                <span className="footer-brand-tag">Policy, Markets, Sustainability</span>
              </span>
            </Link>
            <p className="footer-blurb">
              A live intelligence desk tracking bioenergy policy, markets, companies and careers
              across every jurisdiction — from ethanol and biodiesel to SAF and emerging feedstocks
              like UCO.
            </p>
            <span className="footer-status">
              <i className="status-pulse" aria-hidden="true" />
              {lastScan ? `Last scan ${lastScan}` : "Policy · Markets · Sustainability"}
            </span>
          </div>
          <FooterNewsletter />
        </div>
        <nav className="footer-links" aria-label="Footer">
          <div className="footer-col">
            <h2>Platform</h2>
            <ul>
              <li>
                <Link to="/" hash="markets">
                  Live markets
                </Link>
              </li>
              <li>
                <Link to="/timeline">Latest updates</Link>
              </li>
              <li>
                <Link to="/" hash="map">
                  Jurisdiction map
                </Link>
              </li>
              <li>
                <Link to="/supply">Supply &amp; producers</Link>
              </li>
              <li>
                <Link to="/ci-calculator">CI calculator</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h2>Coverage</h2>
            <ul>
              <li>
                <Link to="/mandates" search={{ fuel: "Ethanol" }}>
                  Ethanol
                </Link>
              </li>
              <li>
                <Link to="/mandates" search={{ fuel: "Biodiesel" }}>
                  Biodiesel
                </Link>
              </li>
              <li>
                <Link to="/mandates" search={{ fuel: "SAF" }}>
                  Sustainable aviation fuel
                </Link>
              </li>
              <li>
                <Link to="/supply/$panel" params={{ panel: "uco" }}>
                  Used cooking oil (UCO)
                </Link>
              </li>
              <li>
                <Link to="/mandates" search={{ fuel: "all" }}>
                  Blending mandates
                </Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h2>Company</h2>
            <ul>
              <li>
                <Link to="/about">About us</Link>
              </li>
              <li>
                <Link to="/about/mission-vision">Mission &amp; vision</Link>
              </li>
              <li>
                <Link to="/about/team">Team members</Link>
              </li>
              <li>
                <Link to="/" hash="disclaimer">
                  Method &amp; disclaimer
                </Link>
              </li>
              <li>
                <Link to="/jobs">Careers</Link>
              </li>
              <li>
                <Link to="/videos">Videos</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col" id="footer-contact">
            <h2>Contact</h2>
            <ul>
              <li>
                <a href="mailto:hello@globalbioenergywatch.com">hello@globalbioenergywatch.com</a>
              </li>
              <li>
                <a href="mailto:press@globalbioenergywatch.com">press@globalbioenergywatch.com</a>
              </li>
              <li>
                <a href="mailto:hello@globalbioenergywatch.com?subject=Policy%20or%20market%20tip">
                  Submit a tip
                </a>
              </li>
              <li>
                <a href="mailto:hello@globalbioenergywatch.com?subject=Advertising%20enquiry">
                  Advertise
                </a>
              </li>
            </ul>
            <div className="footer-social" aria-label="Social and media links">
              <a
                href="https://www.linkedin.com/company/global-bioenergy-watch/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Global Bioenergy Watch on LinkedIn"
              >
                <Linkedin />
              </a>
              <a
                href="https://twitter.com/intent/tweet?url=https%3A%2F%2Fglobalbioenergywatch.org"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share Global Bioenergy Watch on X"
                title="Share on X"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.2l7.3-8.4L.8 2h6.5l4.4 5.8L18.9 2Zm-1.1 18h1.7L6.4 3.9H4.6L17.8 20Z" />
                </svg>
              </a>
              <Link to="/videos" aria-label="YouTube videos" title="Watch videos">
                <Youtube />
              </Link>
              <Link to="/data-sources" aria-label="Browse feed sources" title="Feed sources">
                <Rss />
              </Link>
            </div>
          </div>
        </nav>
        <div className="footer-bottom">
          <p className="footer-copy">© 2026 Global Bioenergy Watch. All rights reserved.</p>
          <ul className="footer-legal">
            <li>
              <Link to="/privacy">Privacy policy</Link>
            </li>
            <li>
              <Link to="/terms">Terms of use</Link>
            </li>
            <li>
              <Link to="/privacy" hash="cookies">
                Cookies
              </Link>
            </li>
            <li>
              <Link to="/" hash="disclaimer">
                Disclaimer
              </Link>
            </li>
          </ul>
          <a className="footer-top-link" href="#top">
            Back to top <ArrowUp />
          </a>
        </div>
      </div>
    </footer>
  );
}
