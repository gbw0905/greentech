import { useEffect, useState } from "react";

const SECTIONS = ["overview", "mandates", "updates"] as const;
export type CountrySection = (typeof SECTIONS)[number];

/** Follow the section being read without changing the URL or browser history on scroll. */
export function useCountrySection(countrySlug: string, initialSection: CountrySection) {
  const [activeSection, setActiveSection] = useState<CountrySection>(initialSection);

  useEffect(() => {
    const sections = SECTIONS.flatMap((id) => {
      const element = document.getElementById(id);
      return element ? [{ id, element }] : [];
    });
    const firstSection = sections[0];
    if (!firstSection) return;

    let frame: number | null = null;
    const measure = () => {
      frame = null;
      const anchorOffset =
        Number.parseFloat(getComputedStyle(firstSection.element).scrollMarginTop) || 90;
      const readingLine = Math.max(anchorOffset, window.innerHeight * 0.25);
      let next: CountrySection = "overview";
      for (const section of sections) {
        if (section.element.getBoundingClientRect().top <= readingLine) next = section.id;
      }
      setActiveSection((current) => (current === next ? current : next));
    };
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    for (const section of sections) observer.observe(section.element);
    schedule();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [countrySlug, initialSection]);

  return activeSection;
}
