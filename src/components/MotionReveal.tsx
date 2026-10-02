import { useState, type HTMLAttributes } from "react";
import { motion, useReducedMotion } from "motion/react";

const ELEMENTS = {
  div: motion.div,
  section: motion.section,
  header: motion.header,
  article: motion.article,
  main: motion.main,
  footer: motion.footer,
} as const;

/** Content stays visible in server-rendered HTML; animate once when it enters view. */
export function MotionReveal({
  as = "div",
  delay = 0,
  children,
  ...props
}: Omit<
  HTMLAttributes<HTMLElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "style"
> & { as?: keyof typeof ELEMENTS; delay?: number }) {
  const [entered, setEntered] = useState(false);
  const reduced = useReducedMotion();
  const Element = ELEMENTS[as];
  return (
    <Element
      {...props}
      initial={false}
      animate={entered && !reduced ? { opacity: [0, 1], y: [26, 0] } : { opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0 : 0.8,
        delay: reduced ? 0 : delay,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      viewport={{ once: true, amount: 0.08 }}
      onViewportEnter={() => setEntered(true)}
    >
      {children}
    </Element>
  );
}
