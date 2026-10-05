import { MotionReveal } from "@/components/MotionReveal";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";
import type { PolicyUpdate } from "@/features/policy/contracts";
import { formatDate } from "@/features/policy/components/UpdateCard";
import { DottedPolicyGlobe } from "./DottedPolicyGlobe";

const ROTATION_MS = 5200;

export function HomeHero({
  updates,
  stats,
}: {
  updates: PolicyUpdate[];
  stats: { total: number; countries: number; policy: number };
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [pageVisible, setPageVisible] = useState(true);
  const hero = useRef<HTMLElement>(null);
  const elapsed = useRef(0);
  const inView = useInView(hero, { amount: 0.1 });
  const reduced = useReducedMotion();
  const running = inView && pageVisible && !paused && !reduced;
  const navigate = useNavigate();

  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    elapsed.current = 0;
  }, [active, cycle]);

  useEffect(() => {
    if (!running || updates.length < 2) return;
    const started = performance.now();
    const timer = window.setTimeout(
      () => {
        setActive((current) => (current + 1) % updates.length);
        setCycle((current) => current + 1);
      },
      Math.max(0, ROTATION_MS - elapsed.current),
    );
    return () => {
      window.clearTimeout(timer);
      elapsed.current = Math.min(ROTATION_MS, elapsed.current + performance.now() - started);
    };
  }, [active, cycle, running, updates.length]);

  useEffect(() => {
    if (active >= updates.length) setActive(0);
  }, [active, updates.length]);

  const current = updates[active % Math.max(updates.length, 1)] ?? null;

  return (
    <section
      ref={hero}
      className="home-hero overflow-hidden bg-[#eef3f7] font-['Instrument_Sans'] text-[#0e2a43]"
    >
      <div className="home-hero-layout mx-auto grid max-w-[1240px] items-center gap-6 px-5 pt-11 min-[621px]:px-8 min-[961px]:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)] min-[961px]:gap-10 min-[961px]:pt-16">
        <MotionReveal className="max-w-[560px]">
          <div className="home-live-pill inline-flex items-center gap-[9px] rounded-full border border-[#d6e1ea] bg-white py-1.5 pr-3.5 pl-3 text-[13px] font-medium text-[#4c6278] before:size-[7px] before:rounded-full before:bg-[#178a6b]">
            Live policy and market intelligence
          </div>

          <h1 className="my-4 font-['Bricolage_Grotesque'] text-[clamp(2.4rem,4vw,3.35rem)] leading-[1.04] font-semibold tracking-[-0.03em] text-balance">
            <span className="block">Bioenergy policy</span>
            <span className="block">and markets, tracked</span>
            <span className="block">in every jurisdiction.</span>
          </h1>

          <p className="max-w-[52ch] text-[17px]/[1.5] text-[#4c6278]">
            Global Bioenergy Watch reads official government sources, regulators and credible energy
            media worldwide, then uses AI to classify and summarise each biofuel policy and market
            update. Click any country on the globe to open its full policy profile.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="#map"
              className="inline-flex h-[46px] items-center justify-center rounded-[10px] bg-[#0e2a43] px-[22px] text-[15px] font-semibold text-white no-underline transition-colors hover:bg-[#173d5d]"
            >
              Open the policy map
            </a>
            <a
              href="#updates"
              className="inline-flex h-[46px] items-center justify-center rounded-[10px] border border-[#d6e1ea] bg-white px-[22px] text-[15px] font-semibold text-[#0e2a43] no-underline transition-colors hover:border-[#178a6b]"
            >
              Read today&apos;s updates
            </a>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 pb-2">
            <Link to="/timeline" className="hero-topic-chip">
              Ethanol
            </Link>
            <Link to="/timeline" className="hero-topic-chip">
              Biodiesel
            </Link>
            <Link to="/timeline" className="hero-topic-chip">
              Sustainable aviation fuel
            </Link>
            <Link to="/mandates" className="hero-topic-chip">
              Blending mandates
            </Link>
            <Link to="/timeline" className="hero-topic-chip">
              Tax credits
            </Link>
          </div>
        </MotionReveal>

        <div className="home-globe-stage relative mx-auto aspect-square w-full max-w-[640px] min-[621px]:max-w-[560px] min-[961px]:ml-auto min-[961px]:max-w-[640px]">
          <DottedPolicyGlobe
            focusKey={current?.id ?? null}
            countrySlug={current?.countrySlug ?? null}
            countryName={current?.countryName ?? null}
            updates={updates}
            onSelectCountry={(slug) => navigate({ to: "/countries/$slug", params: { slug } })}
          />

          {current && (
            <aside
              className="home-hero-card absolute bottom-[7%] left-0 w-[min(330px,72%)] overflow-hidden rounded-[18px] border border-[#d6e1ea] bg-white/[.92] p-4 pb-0 shadow-[0_18px_40px_-22px_rgba(14,42,67,.35)] backdrop-blur-[10px] min-[621px]:-left-[2%] min-[961px]:w-[min(330px,62%)]"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => {
                setPaused(false);
                setCycle((value) => value + 1);
              }}
              onFocusCapture={() => setPaused(true)}
              onBlurCapture={() => {
                setPaused(false);
                setCycle((value) => value + 1);
              }}
            >
              <a
                key={current.id}
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                className="home-hero-card-content block text-inherit no-underline"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-[9px] py-0.5 text-xs font-semibold ${
                      current.category === "market"
                        ? "bg-[#e6effa] text-[#2563a8]"
                        : "bg-[#fcebef] text-[#b83859]"
                    }`}
                  >
                    {current.category === "market" ? "Market" : "Policy"}
                  </span>
                  <time className="text-xs text-[#7b8ea0]">{formatDate(current.publishedAt)}</time>
                </div>
                <div className="mt-3 text-[13px] font-semibold text-[#178a6b]">
                  {current.countryName ?? "Global"}
                </div>
                <h2 className="mt-1 line-clamp-3 font-['Bricolage_Grotesque'] text-[17px]/[1.3] font-semibold tracking-[-0.01em] text-[#0e2a43]">
                  {current.title}
                </h2>
              </a>

              <div
                className="mt-4 flex h-7 items-start gap-1.5"
                role="tablist"
                aria-label="Latest updates"
              >
                {updates.map((update, index) => (
                  <button
                    key={update.id}
                    type="button"
                    role="tab"
                    aria-selected={index === active}
                    aria-label={`Show update ${index + 1}: ${update.title}`}
                    onClick={() => {
                      setActive(index);
                      setCycle((value) => value + 1);
                    }}
                    className={`h-[3px] flex-1 rounded-full transition-colors ${
                      index === active ? "bg-[#178a6b]" : "bg-[#d6e1ea] hover:bg-[#9aafbf]"
                    }`}
                  />
                ))}
              </div>
              <div className="absolute right-0 bottom-0 left-0 h-[3px] bg-[#d6e1ea]">
                <span
                  key={`${current.id}-${cycle}`}
                  className="home-hero-progress block h-full w-full origin-left bg-[#9fdcc9]"
                  style={{ animationPlayState: running ? "running" : "paused" }}
                />
              </div>
            </aside>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-5 min-[621px]:px-8">
        <dl className="home-hero-stats mt-6 grid border-t border-[#d6e1ea] min-[701px]:grid-cols-3 min-[961px]:mt-6">
          {[
            {
              value: stats.total,
              label: "Updates tracked",
              note: "Policy and market news, classified as it is published.",
            },
            {
              value: stats.countries,
              label: "Jurisdictions",
              note: "Countries and regions, each with its own policy profile.",
            },
            {
              value: stats.policy,
              label: "Policy items",
              note: "Mandates, incentives and rules you can filter by fuel type.",
            },
          ].map((stat, index) => (
            <MotionReveal
              key={stat.label}
              delay={index * 0.09}
              className="border-b border-[#d6e1ea] py-6 min-[701px]:border-b-0 min-[701px]:px-7 min-[701px]:py-[26px] min-[701px]:pb-[34px] min-[701px]:first:pl-0 min-[701px]:[&+div]:border-l"
            >
              <dd className="font-['Bricolage_Grotesque'] text-[clamp(1.9rem,3vw,2.6rem)] leading-none font-semibold tracking-[-0.03em] tabular-nums">
                {stat.value}
              </dd>
              <dt className="mt-2.5 text-[15px] font-semibold">{stat.label}</dt>
              <p className="mt-0.5 max-w-[30ch] text-sm text-[#4c6278]">{stat.note}</p>
            </MotionReveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
