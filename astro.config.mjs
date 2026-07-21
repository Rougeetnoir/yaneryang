// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

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
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif']
    },
    {
      provider: fontProviders.google(),
      name: 'Fraunces',
      cssVariable: '--font-fraunces',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-serif', 'Georgia', 'serif']
    },
    {
      provider: fontProviders.google(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-plex-mono',
      weights: [400, 500],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'SFMono-Regular', 'monospace']
    }
  ]
});
