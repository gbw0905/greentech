import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MotionReveal } from "@/components/MotionReveal";
import biogas from "@/assets/topic-biogas.jpg";
import ethanol from "@/assets/topic-ethanol.jpg";
import biodiesel from "@/assets/topic-biodiesel.jpg";
import policy from "@/assets/topic-policy.jpg";
import market from "@/assets/topic-market.jpg";
import feedstock from "@/assets/topic-feedstock.jpg";
import saf from "@/assets/topic-saf.jpg";
import renewables from "@/assets/supply-biopower.jpg";

// Editorial illustrations from the design reference, with existing project assets as fallbacks.
const SLIDES = [
  {
    tag: "Biogas",
    title: "Biogas from organic waste",
    description:
      "Anaerobic digesters convert food waste and agricultural residues into clean biogas and nutrient-rich compost.",
    photo: "1518709268805-4e9042af9f23",
    fallback: biogas,
  },
  {
    tag: "Ethanol",
    title: "Ethanol distillation & fermentation",
    description:
      "Grain and cellulosic ethanol plants ferment sugars and distil fuel-grade ethanol for blending mandates worldwide.",
    photo: "1516937941344-00b4e0337589",
    fallback: ethanol,
  },
  {
    tag: "Biodiesel",
    title: "Biodiesel transesterification",
    description:
      "Vegetable oils and animal fats are converted into fatty acid methyl esters (FAME) for diesel blending.",
    photo: "1532601224476-15c79f2f7a51",
    fallback: biodiesel,
  },
  {
    tag: "Policy",
    title: "Government & regulatory frameworks",
    description:
      "Blending mandates, tax credits and carbon intensity standards shape biofuel markets across jurisdictions.",
    photo: "1454165804606-c3d57bc86b40",
    fallback: policy,
  },
  {
    tag: "Markets",
    title: "Commodity & biofuel markets",
    description:
      "Ethanol, RINs, soybean oil and palm oil prices drive the economics of biofuel production globally.",
    photo: "1590283603385-17ffb3a7f29f",
    fallback: market,
  },
  {
    tag: "Feedstock",
    title: "Sustainable feedstock supply",
    description:
      "Corn, sugarcane, used cooking oil and cover crops form the feedstock base for low-carbon biofuels.",
    photo: "1625246333195-78d9c38ad449",
    fallback: feedstock,
  },
  {
    tag: "SAF",
    title: "Sustainable aviation fuel (SAF)",
    description:
      "HEFA, alcohol-to-jet and power-to-liquid pathways scale up to decarbonise commercial aviation.",
    photo: "1436491865332-7a61a109cc05",
    fallback: saf,
  },
  {
    tag: "Renewables",
    title: "Integrated bioenergy systems",
    description:
      "Bioenergy with carbon capture (BECCS) and combined heat & power plants support the low-carbon energy transition.",
    photo: "1509391366360-2e959784a276",
    fallback: renewables,
  },
] as const;
const DURATION = 6000;
const photoUrl = (photo: string, width: number) =>
  `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=${width}&q=80`;

export function IndustryCarousel() {
  const [active, setActive] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [failed, setFailed] = useState<Set<number>>(() => new Set());
  const reduced = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const thumbnails = useRef<HTMLDivElement>(null);
  const pointerInteraction = useRef(false);
  const elapsed = useRef(0);
  const visible = useInView(stage, { amount: 0.15 });
  const running = visible && pageVisible && !hovered && !focused && !reduced;

  const select = (index: number) => {
    setActive((index + SLIDES.length) % SLIDES.length);
    setCycle((value) => value + 1);
  };

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    elapsed.current = 0;
  }, [active, cycle]);

  useEffect(() => {
    const row = thumbnails.current;
    const button = row?.children[active];
    if (!row || !(button instanceof HTMLElement)) return;
    const left =
      button.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft;
    const right = left + button.offsetWidth;
    if (left < row.scrollLeft || right > row.scrollLeft + row.clientWidth) {
      row.scrollTo({
        left: left < row.scrollLeft ? left : right - row.clientWidth,
        behavior: reduced ? "auto" : "smooth",
      });
    }
  }, [active, reduced]);

  useEffect(() => {
    if (!running) return;
    const started = performance.now();
    const timer = window.setTimeout(
      () => {
        setActive((value) => (value + 1) % SLIDES.length);
        setCycle((value) => value + 1);
      },
      Math.max(0, DURATION - elapsed.current),
    );
    return () => {
      window.clearTimeout(timer);
      elapsed.current = Math.min(DURATION, elapsed.current + performance.now() - started);
    };
  }, [active, cycle, running]);

  return (
    <section className="industry-section" id="industries" aria-labelledby="industry-title">
      <div
        className="industry-inner"
        onPointerDownCapture={() => {
          pointerInteraction.current = true;
          setFocused(false);
          setHovered(false);
        }}
        onKeyDownCapture={() => {
          pointerInteraction.current = false;
          setFocused(true);
        }}
        onFocusCapture={(event) => {
          setFocused(!pointerInteraction.current && event.target.matches(":focus-visible"));
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            pointerInteraction.current = false;
            setFocused(false);
          }
        }}
      >
        <MotionReveal as="header" className="industry-heading">
          <div>
            <h2 id="industry-title">Bioenergy industries in action</h2>
            <p>
              From ethanol plants to biogas digesters, explore the facilities and technologies
              driving the global bioenergy transition.
            </p>
          </div>
          <div className="industry-navigation">
            <button
              type="button"
              aria-label="Previous industry slide"
              onClick={() => select(active - 1)}
            >
              <ArrowLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Next industry slide"
              onClick={() => select(active + 1)}
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </MotionReveal>
        <MotionReveal delay={0.09}>
          <div
            className="industry-carousel"
            role="region"
            aria-roledescription="carousel"
            aria-label="Bioenergy industries"
          >
            <div
              className="industry-stage"
              ref={stage}
              tabIndex={0}
              aria-label="Industry slides. Use left and right arrow keys to browse."
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setHovered(true);
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse") setHovered(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  select(active + (event.key === "ArrowRight" ? 1 : -1));
                }
              }}
            >
              <motion.div
                className="industry-track"
                initial={false}
                animate={{ x: `${-active * 100}%` }}
                transition={{ duration: reduced ? 0 : 0.8, ease: [0.25, 0.8, 0.25, 1] }}
                onPanEnd={(_, info) => {
                  if (
                    Math.abs(info.offset.x) > 50 &&
                    Math.abs(info.offset.x) > Math.abs(info.offset.y)
                  ) {
                    select(active + (info.offset.x < 0 ? 1 : -1));
                  }
                }}
              >
                {SLIDES.map((slide, index) => (
                  <article
                    key={slide.tag}
                    className="industry-slide"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${index + 1} of ${SLIDES.length}`}
                    aria-hidden={active !== index}
                  >
                    <motion.img
                      src={failed.has(index) ? slide.fallback : photoUrl(slide.photo, 1600)}
                      alt=""
                      width={1600}
                      height={900}
                      loading={
                        visible && (index === active || index === (active + 1) % SLIDES.length)
                          ? "eager"
                          : "lazy"
                      }
                      decoding="async"
                      draggable={false}
                      initial={false}
                      animate={{ scale: active === index && running ? 1.045 : 1 }}
                      transition={{ duration: reduced ? 0 : 6, ease: "linear" }}
                      onError={() => setFailed((previous) => new Set(previous).add(index))}
                    />
                    <div className="industry-shade" />
                    <motion.div
                      className="industry-copy"
                      initial={false}
                      animate={
                        active === index && !reduced
                          ? { opacity: [0, 1], y: [18, 0] }
                          : { opacity: 1, y: 0 }
                      }
                      transition={{ duration: reduced ? 0 : 0.55, delay: reduced ? 0 : 0.18 }}
                    >
                      <span>{slide.tag}</span>
                      <h3>{slide.title}</h3>
                      <p>{slide.description}</p>
                    </motion.div>
                  </article>
                ))}
              </motion.div>
            </div>
            <div className="industry-progress" aria-hidden="true">
              <span
                key={`${active}-${cycle}`}
                style={{ animationPlayState: running ? "running" : "paused" }}
              />
            </div>
            <div className="industry-controls">
              <div className="industry-dots" aria-label="Choose an industry slide">
                {SLIDES.map((slide, index) => (
                  <button
                    key={slide.tag}
                    type="button"
                    aria-label={`Show industry ${index + 1}: ${slide.title}`}
                    aria-pressed={active === index}
                    onClick={() => select(index)}
                  />
                ))}
              </div>
            </div>
            <div ref={thumbnails} className="industry-thumbnails" aria-label="Industry thumbnails">
              {SLIDES.map((slide, index) => (
                <button
                  key={slide.tag}
                  type="button"
                  aria-label={`Preview ${slide.title}`}
                  aria-pressed={active === index}
                  onClick={() => select(index)}
                >
                  <img
                    src={failed.has(index) ? slide.fallback : photoUrl(slide.photo, 240)}
                    alt=""
                    width={120}
                    height={72}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onError={() => setFailed((previous) => new Set(previous).add(index))}
                  />
                </button>
              ))}
            </div>
            <p className="sr-only" aria-live={running ? "off" : "polite"}>
              {SLIDES[active]?.title}
            </p>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
