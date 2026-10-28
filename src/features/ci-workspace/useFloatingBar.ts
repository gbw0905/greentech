import { useEffect, useRef, useState } from "react";

/** Keep scroll measurements outside React renders; update only when visibility changes. */
export function useFloatingBar(
  getBounds: () => { anchorBottom: number; endBottom: number } | null,
) {
  const getBoundsRef = useRef(getBounds);
  getBoundsRef.current = getBounds;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const bounds = getBoundsRef.current();
      const chromeBottom =
        document.querySelector(".site-chrome")?.getBoundingClientRect().bottom ?? 0;
      setVisible(
        Boolean(
          bounds &&
          bounds.anchorBottom < chromeBottom + 12 &&
          bounds.endBottom > chromeBottom + 112,
        ),
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
  return visible;
}
