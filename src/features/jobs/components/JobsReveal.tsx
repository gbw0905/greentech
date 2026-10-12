import { useState, type HTMLAttributes } from "react";
import { motion, useReducedMotion } from "motion/react";

/** Jobs reference's 26px / 600ms scroll entrance, with visible SSR content. */
export function JobsReveal({
  as = "div",
  delay = 0,
  ...props
}: Omit<
  HTMLAttributes<HTMLElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "style"
> & {
  as?: "div" | "article";
  delay?: number;
}) {
  const [entered, setEntered] = useState(false);
  const reduced = useReducedMotion();
  const Element = as === "article" ? motion.article : motion.div;
  return (
    <Element
      {...props}
      initial={false}
      animate={entered && !reduced ? { opacity: [0.35, 1], y: [26, 0] } : { opacity: 1, y: 0 }}
      transition={{
        duration: reduced ? 0 : 0.6,
        delay: reduced ? 0 : delay,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      viewport={{ once: true, amount: 0.12 }}
      onViewportEnter={() => setEntered(true)}
    />
  );
}
