import siteLogo from "@/assets/logo.png";

const WORDS = ["AI", "powered", "global", "bioenergy", "outlook"];

const TICKER = [
  "EU · RED III",
  "US · 45Z clean fuel credit",
  "ReFuelEU · SAF mandate",
  "Brazil · RenovaBio",
  "India · E20 blending",
  "Indonesia · B40",
  "Japan · SAF 10% by 2030",
  "Canada · Clean Fuel Regs",
];

/** Latitude bands of the wire globe — animated to fake rotation. */
const BANDS = [26, 46, 58, 62, 58, 46, 26];

/**
 * Animated editorial hero banner: wire globe, tracing policy sparkline,
 * drifting data motes and a word-by-word headline reveal.
 * Pure CSS/SVG motion, no runtime state.
 */
export function HeroAnimation() {
  return (
    <section
      aria-label="Global Bioenergy Watch"
      className="ink-bar relative isolate overflow-hidden"
    >
      {/* faint grid + sweep */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.35) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(120% 80% at 20% 30%, black, transparent 75%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 skew-x-12"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklab, var(--accent) 45%, transparent), transparent)",
          animation: "hero-scan 7s cubic-bezier(0.4,0,0.2,1) infinite",
        }}
      />

      {/* drifting data motes */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {[12, 27, 41, 58, 69, 78, 88, 95].map((left, i) => (
          <span
            key={left}
            className="absolute size-1 rounded-full bg-accent"
            style={{
              left: `${left}%`,
              top: `${18 + ((i * 37) % 60)}%`,
              animation: `hero-float ${5 + (i % 4)}s ease-in-out ${i * 0.6}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative grid gap-8 px-5 py-10 sm:px-8 sm:py-12 lg:grid-cols-[1.25fr_minmax(0,1fr)] lg:items-center lg:gap-10 lg:py-14">
        <div className="min-w-0">
          <div
            className="kicker inline-flex items-center gap-2 text-ink-muted"
            style={{ animation: "hero-word .7s cubic-bezier(.22,1,.36,1) both" }}
          >
            <span className="pulse-dot size-1.5 rounded-full bg-accent" />
            Live policy &amp; market intelligence
          </div>

          <h1 className="mt-4 font-display text-[2.1rem] leading-[1.05] font-extrabold tracking-[-0.03em] text-ink-foreground sm:text-[2.8rem] lg:text-[3rem]">
            {WORDS.map((w, i) => (
              <span
                key={w}
                className="hero-anim-word mr-[0.28em] inline-block"
                style={{ animationDelay: `${0.15 + i * 0.11}s` }}
              >
                {w}
              </span>
            ))}
          </h1>

          <p
            className="mt-5 max-w-[58ch] text-sm/relaxed text-ink-muted sm:text-base/relaxed"
            style={{ animation: "hero-word .8s cubic-bezier(.22,1,.36,1) .85s both" }}
          >
            Mandates, blending targets and incentives across every major jurisdiction —
            scanned continuously, classified by fuel and country, and summarised for the
            desk.
          </p>

          {/* ticker */}
          <div
            className="relative mt-7 overflow-hidden border-y border-white/15 py-2.5"
            style={{
              maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
            }}
          >
            <div
              className="flex w-max gap-8 whitespace-nowrap"
              style={{ animation: "hero-marquee 32s linear infinite" }}
            >
              {[...TICKER, ...TICKER].map((t, i) => (
                <span
                  key={`${t}-${i}`}
                  className="label-mono flex items-center gap-2 text-ink-muted"
                >
                  <span className="size-1 rounded-full bg-accent" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* animated globe + sparkline */}
        <div className="relative mx-auto w-full min-w-0 max-w-[20rem]">
          <svg viewBox="0 0 200 200" className="w-full" role="img" aria-label="Animated globe tracking global bioenergy policy signals">
            <defs>
              <linearGradient id="hero-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
              </linearGradient>
            </defs>
            <g className="text-accent" color="currentColor">
              <circle
                cx="100"
                cy="100"
                r="66"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.55"
                strokeWidth="1"
              />
              <circle
                cx="100"
                cy="100"
                r="78"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="1"
                strokeDasharray="3 9"
                style={{
                  transformOrigin: "100px 100px",
                  animation: "hero-spin 26s linear infinite",
                }}
              />
              {BANDS.map((r, i) => (
                <line
                  key={i}
                  x1={100 - 66}
                  x2={100 + 66}
                  y1={100 - 48 + i * 16}
                  y2={100 - 48 + i * 16}
                  stroke="currentColor"
                  strokeOpacity="0.22"
                  strokeWidth="1"
                  strokeDasharray={`${r} 400`}
                  strokeDashoffset={-(66 - r / 2)}
                />
              ))}
              {[0, 1, 2, 3, 4].map((i) => (
                <ellipse
                  key={i}
                  cx="100"
                  cy="100"
                  rx="66"
                  ry="66"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.28"
                  strokeWidth="1"
                  style={{
                    transformOrigin: "100px 100px",
                    animation: `hero-meridian 14s ease-in-out ${i * 2.8}s infinite`,
                  }}
                />
              ))}
              {/* traced policy signal */}
              <path
                d="M18 138 L46 122 L70 130 L96 96 L122 108 L146 68 L182 52"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.95"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1000"
                style={{ animation: "hero-trace 6s ease-in-out infinite" }}
              />
              {[
                [96, 96],
                [146, 68],
                [182, 52],
              ].map(([cx, cy], i) => (
                <circle
                  key={cx}
                  cx={cx}
                  cy={cy}
                  r="3"
                  fill="currentColor"
                  style={{
                    animation: `hero-float ${4 + i}s ease-in-out ${i * 0.8}s infinite`,
                    transformBox: "fill-box",
                    transformOrigin: "center",
                  }}
                />
              ))}
            </g>
          </svg>

          <img
            src={siteLogo}
            alt=""
            aria-hidden="true"
            width={1024}
            height={1024}
            className="absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-lg object-contain sm:size-20"
            style={{ animation: "hero-word 1s cubic-bezier(.22,1,.36,1) .35s both" }}
          />
        </div>
      </div>
    </section>
  );
}