// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

/* The bookshelf is almost entirely Chinese titles, and none of the three
   webfonts below carry a single CJK glyph. Without these the browser falls back
   to whatever it likes, which on Windows means SimSun. Named explicitly so the
   Chinese sits at the same weight as the Latin next to it. */
const CJK_SANS = ['PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans CJK SC'];
const CJK_SERIF = ['Songti SC', 'SimSun', 'Noto Serif CJK SC'];

// https://astro.build/config
export default defineConfig({
  // Required for sitemap, canonical URLs, and RSS. Update this the moment the
  // real Cloudflare Pages subdomain (or a custom domain) is known.
  site: 'https://yaneryang.pages.dev',

  vite: {
    plugins: [tailwindcss()]
  },

  // No React integration: nothing on the site currently needs an island, and
  // including it emitted a ~190KB client runtime that no page ever referenced.
  // Re-add with `npx astro add react` the moment a real island is needed.
  integrations: [mdx(), sitemap()],

  // Fonts are self-hosted at build time — no external requests, no layout shift.
  // Fraunces carries the display headings, Inter the body, Plex Mono the small
  // metadata labels (dates, stack tags, section eyebrows).
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [400, 500, 600, 700],
      subsets: ['latin'],
      fallbacks: [...CJK_SANS, 'ui-sans-serif', 'system-ui', 'sans-serif']
    },
    {
      provider: fontProviders.google(),
      name: 'Fraunces',
      cssVariable: '--font-fraunces',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: [...CJK_SERIF, 'ui-serif', 'Georgia', 'serif']
    },
    {
      provider: fontProviders.google(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-plex-mono',
      weights: [400, 500],
      subsets: ['latin'],
      fallbacks: [...CJK_SANS, 'ui-monospace', 'SFMono-Regular', 'monospace']
    }
  ]
});
