import { MotionReveal } from "@/components/MotionReveal";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, Linkedin } from "lucide-react";
import { AlertSignup } from "@/features/alerts/components/AlertSignup";
import { feedQuery } from "@/features/policy/feed-query";
import siteLogo from "@/assets/logo.png";

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
    <footer className="intelligence-footer">
      <div className="intelligence-footer-inner">
        <MotionReveal className="intelligence-footer-top">
          <div className="intelligence-footer-about">
            <Link to="/" className="intelligence-footer-brand">
              <img src={siteLogo} width={40} height={40} alt="" />
              <span>
                Global Bioenergy Watch<small>Policy, Markets, Sustainability</small>
              </span>
            </Link>
            <p>
              A live intelligence desk tracking bioenergy policy, markets, companies and careers
              across every jurisdiction — from ethanol and biodiesel to SAF and emerging feedstocks
              like UCO.
            </p>
            <span className="intelligence-footer-status">
              <i />
              {lastScan ? `Last scan ${lastScan}` : "Policy · Markets · Sustainability"}
            </span>
          </div>
          <section className="intelligence-footer-brief" aria-labelledby="daily-brief-title">
            <h2 id="daily-brief-title">Get the daily brief</h2>
            <p>
              AI-summarised policy and market updates from around the world, delivered once a day.
            </p>
            <AlertSignup appearance="footer" />
          </section>
        </MotionReveal>
        <nav className="intelligence-footer-columns" aria-label="Footer">
          <div>
            <h2>Platform</h2>
            <a href="/#markets">Live markets</a>
            <a href="/#map">Jurisdiction map</a>
            <Link to="/supply">Supply and producers</Link>
            <a href="/jobs">Bioenergy careers</a>
            <a href="/#alerts">Email alerts</a>
          </div>
          <div>
            <h2>Coverage</h2>
            <Link to="/mandates">Mandate tracker</Link>
            <Link to="/data-sources">Data sources</Link>
            <Link to="/document-analyzer">Document analyzer</Link>
            <Link to="/ci-calculator">CI calculator</Link>
            <Link to="/dairy-rng-calculator">Dairy RNG calculator</Link>
          </div>
          <div>
            <h2>Company</h2>
            <Link to="/about">About us</Link>
            <Link to="/about/mission-vision">Mission &amp; vision</Link>
            <Link to="/about/team">Team members</Link>
            <a href="/#disclaimer">Method and disclaimer</a>
          </div>
          <div>
            <h2>Contact</h2>
            <Link to="/contact">Contact us</Link>
            <Link to="/videos">Videos</Link>
            <a
              className="intelligence-social"
              href="https://www.linkedin.com/company/global-bioenergy-watch/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Global Bioenergy Watch on LinkedIn"
            >
              <Linkedin size={18} />
            </a>
          </div>
        </nav>
        <div className="intelligence-footer-bottom">
          <p>© 2026 Global Bioenergy Watch. All rights reserved.</p>
          <div>
            <Link to="/privacy">Privacy policy</Link>
            <Link to="/terms">Terms of Use</Link>
          </div>
          <a href="#top" className="intelligence-back-top">
            Back to top <ArrowUp size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
}
