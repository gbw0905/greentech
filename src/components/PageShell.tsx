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
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={siteLogo}
              alt="Global Bioenergy Watch logo: a globe with a leaf and rising data line"
              width={1024}
              height={1024}
              className="size-10 rounded-md object-contain"
            />
            <div>
              <div className="font-display text-xl leading-none font-bold tracking-tight text-foreground sm:text-2xl">
                Global Bioenergy Watch
              </div>
              <div className="kicker mt-1">Independent policy & market desk</div>
            </div>
          </Link>
          <Link
            to="/"
            className="label-mono inline-flex items-center gap-2 rounded-md border border-border bg-surface-1 px-3.5 py-2 transition-colors hover:border-accent hover:text-accent"
          >
            <ArrowLeft className="size-3.5" /> Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[100rem] px-5 py-6 lg:px-8 lg:py-8">
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
    <div className="mb-6 border-b border-border pb-5">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-accent" />
        <span className="kicker">Global Bioenergy Watch</span>
      </div>
      <h1 className="mt-2 font-display text-3xl leading-tight font-extrabold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
