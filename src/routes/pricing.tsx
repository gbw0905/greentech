import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, FileSpreadsheet, LockKeyhole, Sparkles } from "lucide-react";
import { usePremium } from "@/features/premium/hooks/usePremium";
import "@/features/premium/pricing.css";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "CIVanta Pro pricing | Global Bioenergy Watch" }] }),
  component: PricingPage,
});

const freeFeatures = [
  "Run all three calculators without signing in",
  "See complete headline results and key drivers",
  "Review calculation basis, units and warnings",
  "Use a baseline and example inputs",
  "Keep account calculation history when signed in",
];
const proFeatures = [
  "Everything in Free",
  "Compare scenarios and advanced optimizer views",
  "Explore sensitivity and detailed calculation ledgers",
  "Download formatted Excel reports and available CSV, JSON or PDF exports",
  "Use the full Cost & CI and target solver tools",
];

function PricingPage() {
  const access = usePremium();
  const proHref = access.signedIn
    ? "mailto:info@globalbioenergywatch.org?subject=CIVanta%20Pro%20access"
    : "/auth?next=%2Fpricing";

  return (
    <main className="civanta-pricing">
      <div className="pricing-shell">
        <div className="pricing-hero">
          <Link to="/civanta" className="pricing-back">
            ← CIVanta suite
          </Link>
          <span className="pricing-eyebrow">
            <Sparkles size={16} aria-hidden="true" /> CIVanta Pro
          </span>
          <h1>Turn a useful result into a decision you can defend.</h1>
          <p>
            Calculate for free. Upgrade when you need deeper comparison, sensitivity and reports you
            can share.
          </p>
        </div>

        <div className="pricing-cards">
          <section className="pricing-card" aria-labelledby="free-plan-title">
            <div className="pricing-card-top">
              <h2 id="free-plan-title">Free</h2>
              <p>For your first pathway and estimate.</p>
            </div>
            <div className="pricing-price">
              $0 <small>/ forever</small>
            </div>
            <Link className="pricing-card-action pricing-free-action" to="/ci-workspace">
              Open CI Workspace <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <ul>
              {freeFeatures.map((feature) => (
                <li key={feature}>
                  <Check size={17} aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </section>
          <section className="pricing-card pricing-card-pro" aria-labelledby="pro-plan-title">
            <div className="pricing-card-top">
              <h2 id="pro-plan-title">CIVanta Pro</h2>
              <p>For repeatable decisions and client-ready reporting.</p>
            </div>
            <div className="pricing-price pricing-contact-price">Contact for Pricing</div>
            {access.loading ? (
              <span className="pricing-card-action pricing-free-action">Checking access…</span>
            ) : access.premium ? (
              <Link className="pricing-card-action pricing-pro-action" to="/profile">
                Your Pro access is active <ArrowRight size={18} aria-hidden="true" />
              </Link>
            ) : (
              <a className="pricing-card-action pricing-pro-action" href={proHref}>
                {access.signedIn ? "Request Pro access" : "Sign in to get Pro"}{" "}
                <ArrowRight size={18} aria-hidden="true" />
              </a>
            )}
            <ul>
              {proFeatures.map((feature) => (
                <li key={feature}>
                  <Check size={17} aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="pricing-trust-row">
          <div>
            <LockKeyhole size={22} aria-hidden="true" />
            <b>Clear access</b>
            <p>Signing in keeps the Free tools available; it does not turn on Pro.</p>
          </div>
          <div>
            <FileSpreadsheet size={22} aria-hidden="true" />
            <b>Download with Pro</b>
            <p>Pro access is required before a calculator report is generated.</p>
          </div>
          <div>
            <Sparkles size={22} aria-hidden="true" />
            <b>Know the basis</b>
            <p>Units, methods and important warnings stay visible in the Free tools.</p>
          </div>
        </div>
        <p className="pricing-footnote">
          Estimates are planning tools, not a regulatory certification or a guarantee of credit
          eligibility. Subscription checkout is not yet connected; request access to discuss Pro.
        </p>
      </div>
    </main>
  );
}
