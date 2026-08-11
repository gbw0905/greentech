import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import siteLogo from "@/assets/logo.png";

export function PageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[110rem] flex-wrap items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={siteLogo}
              alt="Global Bioenergy Watch logo: a globe with a leaf and rising data line"
              width={1024}
              height={1024}
              className="size-12 rounded-xl object-contain drop-shadow-[0_0_16px_rgba(0,240,255,0.35)]"
            />
            <div className="font-display text-2xl leading-tight font-black text-gradient drop-shadow-[0_0_16px_rgba(0,240,255,0.45)] sm:text-3xl">
              Global Bioenergy Watch
            </div>
          </Link>
          <Link
            to="/"
            className="label-mono inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-4 py-2 transition-colors hover:border-primary hover:text-primary"
          >
            <ArrowLeft className="size-3.5" /> Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[110rem] px-5 py-6 lg:px-8 lg:py-8">
        <main className="space-y-6">{children}</main>
        <footer className="mt-8 space-y-3 border-t border-border pt-6 pb-10">
          <p className="text-xs text-muted-foreground">
            Updates are aggregated from live web sources and auto-classified by jurisdiction and fuel
            type. Verify against primary legislation before use in compliance decisions.
          </p>
          <p className="text-xs font-semibold text-foreground">
            © {new Date().getFullYear()} All rights reserved —{" "}
            <a
              href="https://www.linkedin.com/in/asifulalam0905024/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 transition-colors hover:text-primary-glow hover:underline"
            >
              Syed Asiful Alam, PhD
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export function PageHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-primary via-primary-glow to-accent shadow-[var(--shadow-lift)]">
      <div className="relative px-6 py-5 text-primary-foreground sm:px-8 sm:py-6">
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Icon className="size-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight [text-shadow:0_2px_18px_rgba(255,255,255,0.3)] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-1 max-w-3xl text-sm opacity-90">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
