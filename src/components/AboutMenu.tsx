import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ITEMS = [
  { to: "/about", label: "About us" },
  { to: "/about/mission-vision", label: "Mission & vision" },
  { to: "/about/team", label: "Team members" },
] as const;

/**
 * "About Us" dropdown for the top menu bar. Matches the rectangular
 * black/bold pill style used by the homepage section navigation.
 */
export function AboutMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative min-w-max flex-1"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="label-mono group inline-flex w-full items-center justify-center gap-2 text-center whitespace-nowrap border border-white/40 bg-black px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition-all hover:border-white hover:bg-white/10 sm:px-4 sm:py-2"
      >
        About us
        <ChevronDown
          className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 left-0 z-40 mt-1 overflow-hidden border border-white/30 bg-black shadow-xl sm:left-auto sm:w-52"
        >
          {ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="label-mono block border-b border-white/10 px-4 py-2.5 text-xs font-bold text-white transition-colors last:border-b-0 hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
