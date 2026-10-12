import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, Linkedin } from "lucide-react";
import { feedQuery } from "@/features/policy/feed-query";
import { FooterNewsletter } from "./FooterNewsletter";
import siteLogo from "@/assets/logo.png";
import "./IntelligenceFooter.css";

export function IntelligenceFooter() {
  const { data: feed } = useQuery(feedQuery);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const scannedAt = hydrated && feed?.fetchedAt ? new Date(feed.fetchedAt) : null;
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
                <a href="mailto:info@globalbioenergywatch.org">info@globalbioenergywatch.org</a>
              </li>
              <li>
                <a href="mailto:info@globalbioenergywatch.org?subject=Policy%20or%20market%20tip">
                  Submit a tip
                </a>
              </li>
              <li>
                <a href="mailto:info@globalbioenergywatch.org?subject=Advertising%20enquiry">
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
