import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ITEMS = [
  { href: "#disclaimer", label: "Method and disclaimer" },
  { to: "/ci-calculator", label: "CI calculator" },
  { to: "/videos", label: "Videos" },
  { to: "/about", label: "About us" },
  { to: "/about/mission-vision", label: "Mission & vision" },
  { to: "/about/team", label: "Team members" },
] as const;

/**
 * "About Us" dropdown for the top menu bar. The menu renders through a
 * portal with fixed positioning so the nav's horizontal scroll container
 * (overflow-x-auto) cannot clip it.
 */
export function AboutMenu({ home = false }: { home?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePos = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = 220;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    setPos({ top: rect.bottom + 10, left, width });
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
    <div ref={wrapRef} className="relative min-w-max">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="group inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border-0 bg-transparent px-3 font-['Instrument_Sans'] text-sm font-medium whitespace-nowrap text-[#4c6278] transition-colors hover:bg-[#eef3f7] hover:text-[#0e2a43]"
      >
        More
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-50 w-[220px] overflow-hidden rounded-[14px] border border-[#d6e1ea] bg-white p-1.5 shadow-[0_22px_44px_-20px_rgba(14,42,67,.4)]"
            style={{ top: pos.top, left: pos.left }}
          >
            {ITEMS.map((item) => {
              const itemClass =
                "block rounded-[9px] px-3 py-2.5 font-['Instrument_Sans'] text-sm font-medium text-[#4c6278] transition-colors hover:bg-[#eef3f7] hover:text-[#0e2a43]";

              if ("href" in item) {
                return (
                  <a
                    key={item.href}
                    href={home ? item.href : `/${item.href}`}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={itemClass}
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={itemClass}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
