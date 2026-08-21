import sharp from 'sharp';

/**
 * Pulls a book's shelf colours out of its cover art.
 *
 * Run by `scripts/import-notion-books.mjs`, never at build time: the results
 * are written into each book's frontmatter, so the colours are visible in the
 * content file and can be hand-corrected when the extraction picks something
 * ugly. That is the whole reason this is a script and not a build step.
 */

const toHex = ({ r, g, b }) =>
  `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;

/* sharp's `dominant` comes from a 4096-bin histogram, so it returns a colour
   that is actually in the artwork, rather than the mud a 1x1 resize averages
   its way to. */
const dominant = async (image) => (await image.stats()).dominant;

function toHsl({ r, g, b }) {
  const [red, green, blue] = [r, g, b].map((channel) => channel / 255);
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) return { h: 0, s: 0, l: lightness };

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  const hue =
    max === red
      ? ((green - blue) / delta + (green < blue ? 6 : 0)) / 6
      : max === green
        ? ((blue - red) / delta + 2) / 6
        : ((red - green) / delta + 4) / 6;

  return { h: hue, s: saturation, l: lightness };
}

function toRgb({ h, s, l }) {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const secondary = chroma * (1 - Math.abs(((h * 6) % 2) - 1));
  const match = l - chroma / 2;
  const sector = Math.floor(h * 6) % 6;

  const [r, g, b] = [
    [chroma, secondary, 0],
    [secondary, chroma, 0],
    [0, chroma, secondary],
    [0, secondary, chroma],
    [secondary, 0, chroma],
    [chroma, 0, secondary],
  ][sector];

  return { r: (r + match) * 255, g: (g + match) * 255, b: (b + match) * 255 };
}

/**
 * The detail page fills an entire viewport with one colour. A cover's dominant
 * hue is chosen to grab attention across a bookshop, which is exactly wrong at
 * that size — a full screen of a paperback's orange is unreadable and loud.
 *
 * So the hue is kept and everything else is thrown away: saturation is capped
 * and the colour is dropped to a near-black lightness. Every book gets its own
 * room, each unmistakably tinted by its cover, none of them shouting.
 */
function intoRoom(rgb) {
  const { h, s } = toHsl(rgb);
  return toRgb({ h, s: Math.min(s, 0.34), l: 0.13 });
}

/**
 * @param {string} coverPath Absolute or cwd-relative path to the cover image.
 * @returns {Promise<{ spine: string, detailColor: string }>}
 */
export async function extractCoverColors(coverPath) {
  const { width, height } = await sharp(coverPath).metadata();

  /* A printed spine is the wrap-around of the cover's left edge, so sampling
     that strip gives a spine colour that looks like it belongs to the book. A
     whole-cover dominant would hand back the colour of the author's photo. */
  const stripWidth = Math.max(1, Math.round(width * 0.08));
  const spine = await dominant(
    sharp(coverPath).extract({ left: 0, top: 0, width: stripWidth, height })
  );

  return {
    spine: toHex(spine),
    detailColor: toHex(intoRoom(await dominant(sharp(coverPath)))),
  };
}
