import { Link } from "@tanstack/react-router";
import { ArrowLeft, Linkedin } from "lucide-react";
import siteLogo from "@/assets/logo.png";

export function PageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink bg-ink text-ink-foreground backdrop-blur-xl">
        <div className="mx-auto flex max-w-[80rem] items-center justify-between gap-2 px-4 py-2 sm:gap-4 sm:px-5 sm:py-2.5 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Link to="/" className="shrink-0">
              <img
                src={siteLogo}
                alt="Global Bioenergy Watch logo: a globe with a leaf and rising data line"
                width={1024}
                height={1024}
                className="size-8 rounded-md object-contain sm:size-9"
              />
            </Link>
            <div className="min-w-0">
              <a
                href="https://www.linkedin.com/company/global-bioenergy-watch/?viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate font-display text-base leading-none font-extrabold tracking-tight text-ink-foreground transition-colors hover:text-primary-glow sm:text-xl lg:text-[1.4rem]"
              >
                Global Bioenergy Watch
              </a>
              <div className="kicker mt-1 hidden items-center gap-1.5 text-ink-muted sm:flex">
                <span className="size-1.5 rounded-full bg-accent" />
                Independent policy &amp; market desk
              </div>
            </div>
          </div>
          <Link
            to="/"
            className="label-mono inline-flex shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 font-bold text-ink-foreground transition-all hover:-translate-y-px hover:bg-white/20 sm:px-3.5 sm:py-2"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Back to dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[80rem] px-5 py-6 lg:px-8 lg:py-8">
        <main className="space-y-6">{children}</main>
        <footer className="mt-8 space-y-3 border-t border-border pt-6 pb-10">
          <p className="text-xs text-muted-foreground">
            Updates are aggregated from live web sources and auto-classified by jurisdiction and fuel
            type. Verify against primary legislation before use in compliance decisions.
          </p>
          <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-foreground">
            <span>© 2026 All rights reserved — Global Bioenergy Watch —</span>
            <a
              href="https://www.linkedin.com/in/asifulalam0905024/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0A66C2]/10 px-2 py-1 text-[#0A66C2] transition-colors hover:bg-[#0A66C2]/15"
            >
              <Linkedin className="size-4 fill-current" />
              <span>Syed Asiful Alam, PhD</span>
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
    <div className="ink-bar mb-6 px-5 py-6 sm:px-7">
      <div className="flex items-center gap-2 text-accent">
        <Icon className="size-3.5" />
        <span className="kicker text-accent">Global Bioenergy Watch</span>
      </div>
      <h1 className="mt-2 font-display text-3xl leading-[1.05] font-extrabold tracking-[-0.03em] text-ink-foreground sm:text-[2.6rem]">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm/relaxed text-ink-muted">{subtitle}</p>
      <div className="mt-4 h-0.5 w-24 rounded-full bg-accent" />
    </div>
  );
}
