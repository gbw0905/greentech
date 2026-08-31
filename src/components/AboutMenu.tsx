import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ITEMS = [
  { to: "/about", label: "About us" },
  { to: "/about/mission-vision", label: "Mission & vision" },
  { to: "/about/team", label: "Team members" },
] as const;

/**
 * "About Us" dropdown for the top menu bar. The menu renders through a
 * portal with fixed positioning so the nav's horizontal scroll container
 * (overflow-x-auto) cannot clip it.
 */
export function AboutMenu() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePos = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative min-w-max flex-1"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={(e) => {
        if (menuRef.current?.contains(e.relatedTarget as Node)) return;
        setOpen(false);
      }}
    >
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="label-mono group inline-flex w-full items-center justify-center gap-2 text-center whitespace-nowrap border border-white/40 bg-black px-3 py-1.5 text-xs font-extrabold text-white shadow-sm transition-all hover:border-white hover:bg-white/10 sm:px-4 sm:py-2"
      >
        About us
        <ChevronDown
          className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            onMouseLeave={() => setOpen(false)}
            className="fixed z-50 w-52 overflow-hidden border border-white/30 bg-black shadow-xl"
            style={{ top: pos.top, left: pos.left }}
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
          </div>,
          document.body,
        )}
    </div>
  );
}
