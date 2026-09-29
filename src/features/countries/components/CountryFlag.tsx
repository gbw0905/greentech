import { COUNTRY_FLAG } from "@/features/policy/taxonomy";

/**
 * Emoji flags do not render on Windows (no flag glyphs in the system emoji font),
 * so flags are drawn as small SVG images instead. The ISO code is derived from the
 * regional-indicator codepoints of the emoji we already store per jurisdiction.
 */
export function isoCodeFromFlagEmoji(emoji: string | undefined | null): string | null {
  if (!emoji) return null;
  const points = Array.from(emoji).map((c) => c.codePointAt(0) ?? 0);
  const letters = points
    .filter((p) => p >= 0x1f1e6 && p <= 0x1f1ff)
    .map((p) => String.fromCharCode(p - 0x1f1e6 + 97));
  return letters.length === 2 ? letters.join("") : null;
}

export function isoCodeForSlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return isoCodeFromFlagEmoji(COUNTRY_FLAG[slug]);
}

export function CountryFlag({
  slug,
  code,
  className = "",
  title,
}: {
  slug?: string | null;
  code?: string | null;
  className?: string;
  title?: string;
}) {
  const iso = code ?? isoCodeForSlug(slug);
  const base = `inline-block h-[0.78em] w-[1.17em] shrink-0 rounded-[2px] object-cover align-[-0.06em] ring-1 ring-black/10 ${className}`;
  if (!iso) {
    return (
      <span className={`inline-block align-[-0.06em] ${className}`} aria-hidden>
        🌐
      </span>
    );
  }
  return (
    <img
      src={`https://flagcdn.com/${iso}.svg`}
      alt=""
      aria-hidden
      loading="lazy"
      width={24}
      height={16}
      title={title}
      className={base}
    />
  );
}
