import { useEffect, useState, type HTMLAttributes } from "react";
import { motion, useReducedMotion } from "motion/react";

const ELEMENTS = {
  div: motion.div,
  section: motion.section,
  header: motion.header,
  article: motion.article,
  main: motion.main,
  footer: motion.footer,
  nav: motion.nav,
} as const;

/** Content stays visible in server-rendered HTML; animate once when it enters view. */
export function MotionReveal({
  as = "div",
  delay = 0,
  duration = 0.8,
  distance = 28,
  blur = 0,
  children,
  onFocusCapture,
  ...props
}: Omit<
  HTMLAttributes<HTMLElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "style"
> & {
  as?: keyof typeof ELEMENTS;
  delay?: number;
  duration?: number;
  distance?: number;
  blur?: number;
}) {
  const [entered, setEntered] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [focused, setFocused] = useState(false);
  const [settled, setSettled] = useState(false);
  const reduced = useReducedMotion();
  // Keep SSR/no-JS content readable; prepare the reveal only after hydration.
  useEffect(() => {
    if (!reduced && "IntersectionObserver" in window) setPrepared(true);
  }, [reduced]);
  const Element = ELEMENTS[as];
  return (
    <Element
      {...props}
      data-motion-reveal="true"
      data-motion-state={
        reduced || focused ? "static" : entered ? "entered" : prepared ? "pending" : "idle"
      }
      initial={false}
      animate={
        reduced || focused || settled
          ? { opacity: 1, y: 0, filter: "none" }
          : entered
            ? {
                opacity: [0, 1],
                y: [distance, 0],
                filter: blur > 0 ? [`blur(${blur}px)`, "blur(0px)"] : "none",
              }
            : prepared
              ? { opacity: 0, y: distance, filter: blur > 0 ? `blur(${blur}px)` : "none" }
              : { opacity: 1, y: 0, filter: "none" }
      }
      transition={{
        duration: reduced || focused || settled || !entered ? 0 : duration,
        delay: reduced || focused || settled || !entered ? 0 : Math.max(0, delay),
        ease: blur ? [0.22, 1, 0.36, 1] : [0.2, 0.7, 0.2, 1],
      }}
      viewport={{ once: true, amount: as === "main" ? "some" : 0.14, margin: "0px 0px -8% 0px" }}
      onViewportEnter={() => setEntered(true)}
      onAnimationComplete={() => {
        // A completed filter must not trap fixed-position dialogs/popovers.
        if (entered) setSettled(true);
      }}
      onFocusCapture={(event) => {
        setFocused(true);
        setEntered(true);
        onFocusCapture?.(event);
      }}
    >
      {children}
    </Element>
  );
}
