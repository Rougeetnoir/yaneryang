import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { site } from '../config/site';

/**
 * Builds the social preview card — the image that unfurls when the site is
 * pasted into LinkedIn, Slack, iMessage, or an email client.
 *
 * Rendered once at build time to `dist/og.png`; nothing runs on request.
 * Colours and type are taken from the Warm paper theme so the card and the
 * site read as the same object.
 */

const WIDTH = 1200;
const HEIGHT = 630;

/* Theme tokens, duplicated as literals because satori cannot resolve CSS vars. */
const CANVAS = '#f7f4ed';
const INK = '#3a372f';
const MUTED = '#6e6a5e';
const ACCENT = '#f2b23e';
const ACCENT_INK = '#8f5d0a';

/* Resolved from the project root, not `import.meta.url`: this module is bundled
   into `dist/.prerender/chunks/` before it runs, so relative URLs point nowhere. */
const fromRoot = (path: string) => resolve(process.cwd(), path);

const font = (file: string) => readFile(fromRoot(`node_modules/${file}`));

export const GET: APIRoute = async () => {
  const [fraunces500, inter400, inter500, avatarPng] = await Promise.all([
    font('@fontsource/fraunces/files/fraunces-latin-500-normal.woff'),
    font('@fontsource/inter/files/inter-latin-400-normal.woff'),
    font('@fontsource/inter/files/inter-latin-500-normal.woff'),
    // Downscaled before base64-ing: the 2400px source would bloat the SVG for
    // no visible gain at the size it renders here.
    sharp(fromRoot('src/assets/avatar.png'))
      .resize(600, 600, { fit: 'inside' })
      .png()
      .toBuffer(),
  ]);

  const avatarUri = `data:image/png;base64,${avatarPng.toString('base64')}`;

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: CANVAS,
          fontFamily: 'Inter',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '76px 80px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      maxWidth: 700,
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 24,
                            fontWeight: 500,
                            letterSpacing: 5,
                            color: MUTED,
                            textTransform: 'uppercase',
                          },
                          children: site.name,
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            marginTop: 28,
                            fontFamily: 'Fraunces',
                            fontSize: 62,
                            lineHeight: 1.1,
                            color: INK,
                          },
                          children: site.headline,
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            marginTop: 36,
                            fontSize: 26,
                            color: ACCENT_INK,
                          },
                          children: site.url.replace('https://', ''),
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'img',
                  props: {
                    src: avatarUri,
                    width: 300,
                    height: 300,
                    style: { marginLeft: 48 },
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: { height: 14, backgroundColor: ACCENT },
            },
          },
        ],
      },
    },
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: 'Fraunces', data: fraunces500, weight: 500, style: 'normal' },
        { name: 'Inter', data: inter400, weight: 400, style: 'normal' },
        { name: 'Inter', data: inter500, weight: 500, style: 'normal' },
      ],
    }
  );

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
  })
    .render()
    .asPng();

  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
