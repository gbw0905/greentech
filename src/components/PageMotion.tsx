import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

/** Route entrances and once-per-visit section reveals, with visible server HTML. */
export function PageMotion({ pathname, children }: { pathname: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const node = root.current;
    if (!node || reduced || !window.IntersectionObserver || !node.animate) return;
    const seen = new WeakSet<Element>();
    const controls = new Set<Animation>();
    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          // Native animation preserves React-owned attributes while lazy route HTML hydrates.
          const control = (entry.target as HTMLElement).animate(
            [
              { opacity: 0, transform: "translateY(26px)" },
              { opacity: 1, transform: "none" },
            ],
            { duration: 800, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
          );
          controls.add(control);
          void control.finished.then(
            () => controls.delete(control),
            () => controls.delete(control),
          );
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );
    const discover = () => {
      frame = 0;
      // Existing MotionReveal components already own their entrance animation.
      for (const section of node.querySelectorAll<HTMLElement>("main section, main article")) {
        if (
          seen.has(section) ||
          section.closest("[data-motion-reveal], [data-motion-owned]") ||
          section.querySelector("[data-motion-reveal]") ||
          section.parentElement?.closest("section, article")
        )
          continue;
        seen.add(section);
        observer.observe(section);
      }
    };
    discover();
    const mutations = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(discover);
    });
    mutations.observe(node, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
      controls.forEach((control) => control.finish());
    };
  }, [pathname, reduced]);

  return (
    <motion.div
      key={pathname}
      ref={root}
      className="flex-1"
      initial={false}
      animate={{ opacity: reduced || pathname === "/" ? 1 : [0.88, 1] }}
      transition={{ duration: reduced || pathname === "/" ? 0 : 0.5, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
