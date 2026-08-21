/**
 * Colour maths for the bookshelf.
 *
 * Every book carries its own spine colour and detail-page background, extracted
 * from its cover art (see `scripts/lib/extract-cover-color.mjs`). Those colours
 * are arbitrary — a book can be near-black or near-white — so the type that sits
 * on top of them has to be chosen per book rather than fixed by the theme.
 *
 * Pure functions only: no filesystem, no sharp. This runs during rendering, both
 * on the shelf and on every detail page.
 */

/* Theme ink/canvas, duplicated as literals because CSS variables cannot be read
   at build time. Kept in sync with src/styles/theme.css by hand. */
const INK = '#3a372f';
const PAPER = '#f7f4ed';

/** Expands `#abc` to `#aabbcc` and lowercases. Returns null for anything else. */
function normalizeHex(value: string): string | null {
  const hex = value.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(hex)) {
    return hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return /^[0-9a-f]{6}$/.test(hex) ? hex : null;
}

/** WCAG 2.1 relative luminance. Null when the input is not a hex colour. */
export function luminance(color: string): number | null {
  const hex = normalizeHex(color);
  if (!hex) return null;

  const [r, g, b] = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1–21. Returns 1 (worst case) if either input is bad. */
export function contrast(a: string, b: string): number {
  const first = luminance(a);
  const second = luminance(b);
  if (first === null || second === null) return 1;

  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Picks the theme ink or the theme paper — whichever is more readable on
 * `background`. Both are warm rather than pure black/white, which keeps a book's
 * detail page feeling like part of this site instead of a generic light/dark
 * flip. If neither clears AA, the higher-contrast one still wins.
 */
export function readableInk(background: string): string {
  return contrast(background, INK) >= contrast(background, PAPER) ? INK : PAPER;
}

/** A hairline that reads on `background` without hard-edging into pure white. */
export function hairline(background: string): string {
  return readableInk(background) === INK
    ? 'rgb(58 55 47 / 0.18)'
    : 'rgb(247 244 237 / 0.28)';
}

/**
 * Deterministic 0–1 value from a string. Used to vary spine widths and book
 * heights so the shelf looks like a shelf rather than a bar chart — without
 * asking anyone to hand-tune a number per book. Same slug always gives the same
 * number, so the shelf does not reshuffle between builds.
 */
export function jitter(seed: string, salt = ''): number {
  const input = `${seed}::${salt}`;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 1000;
}

/**
 * True when a string contains Han characters.
 *
 * The site's `<html lang>` is English, and most of the bookshelf is not. Marking
 * the Chinese runs lets a screen reader switch voices instead of spelling them
 * out in English, and lets the browser apply Chinese line-breaking rules rather
 * than Latin ones.
 */
export function isHan(text: string): boolean {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(text);
}

/** `lang` attribute for a book's own text: Chinese when it is, else nothing. */
export const langOf = (text: string): string | undefined =>
  isHan(text) ? 'zh-Hans' : undefined;
