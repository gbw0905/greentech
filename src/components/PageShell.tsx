import { MotionReveal } from "@/components/MotionReveal";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell mx-auto py-6 lg:py-8">
      <MotionReveal as="main" className="space-y-6">
        {children}
      </MotionReveal>
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
    <div className="ink-bar ribbon-sheen mb-6 px-5 py-6 sm:px-7">
      <div className="flex items-center gap-2 text-accent">
        <Icon className="size-3.5" />
        <span className="kicker text-accent">Global Bioenergy Watch</span>
      </div>
      <h1 className="mt-2 font-display text-3xl leading-[1.05] font-extrabold tracking-[-0.03em] text-ink-foreground sm:text-[2.6rem]">
        {title}
      </h1>
      <p className="mt-2 w-full max-w-3xl text-sm/relaxed text-ink-muted">{subtitle}</p>
      <div className="mt-4 h-0.5 w-24 rounded-full bg-accent" />
    </div>
  );
}
