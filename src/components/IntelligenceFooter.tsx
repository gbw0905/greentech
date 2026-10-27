import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, Linkedin } from "lucide-react";
import { feedQuery } from "@/features/policy/feed-query";
import { FooterNewsletter } from "./FooterNewsletter";
import siteLogo from "@/assets/logo.png";
import "./IntelligenceFooter.css";

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

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
              {lastScan ? `Last Updated ${lastScan}` : "Policy · Markets · Sustainability"}
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
            </ul>
            <div className="footer-social" aria-label="Social and media links">
              <a
                href="https://www.linkedin.com/company/global-bioenergy-watch/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Global Bioenergy Watch on LinkedIn"
                title="LinkedIn"
              >
                <Linkedin />
              </a>
              <a
                href="https://wa.me/16282466503"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Business: +1 6282466503"
                title="WhatsApp: +1 6282466503"
              >
                <WhatsAppIcon />
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
