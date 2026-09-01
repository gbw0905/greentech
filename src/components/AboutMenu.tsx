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
    if (!rect) return;
    const width = 208; // w-52
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    setPos({ top: rect.bottom + 4, left, width });
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
        className="label-mono group inline-flex w-full items-center justify-center gap-2 text-center whitespace-nowrap border border-menubar-fg/40 bg-menubar-nav px-3 py-1.5 text-xs font-extrabold text-menubar-fg shadow-sm transition-all hover:border-menubar-fg hover:bg-menubar-fg/10 sm:px-4 sm:py-2"
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
            className="fixed z-50 w-52 overflow-hidden border border-menubar-fg/30 bg-menubar-nav shadow-xl"
            style={{ top: pos.top, left: pos.left }}
          >
            {ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="label-mono block border-b border-menubar-fg/10 px-4 py-2.5 text-xs font-bold text-menubar-fg transition-colors last:border-b-0 hover:bg-menubar-fg/10"
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
