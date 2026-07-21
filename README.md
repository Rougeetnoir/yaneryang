# Personal site — Yaner Yang

Résumé, projects, and writing. Astro 7 + Tailwind 4 + MDX. Static output, no
JavaScript shipped to the browser.

## Commands

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # → dist/
npm run preview    # serve the production build locally
npx astro check    # type-check .astro and .ts
```

## Where things live

| Path | What it is |
|---|---|
| `src/config/site.ts` | **Positioning copy.** Name, headline, the three pillars, nav, contact. Retarget the site at a different kind of role by editing this file and nothing else. |
| `src/config/resume.ts` | Résumé data — experience, education, skills, and the PDF download path. |
| `src/content/projects/*.mdx` | One file per project. `featured: <n>` controls ordering everywhere; the lowest three appear on the home page. |
| `src/content/writing/*.mdx` | Blog posts. `draft: true` hides a post from production but keeps it visible in `npm run dev`. |
| `src/styles/theme.css` | Every colour, font, radius, and shadow as a CSS custom property. Nothing else in the codebase hardcodes a colour. |
| `src/styles/global.css` | Maps those tokens onto Tailwind utilities via `@theme inline`. |
| `src/content.config.ts` | Zod schemas for both collections. |
| `src/lib/content.ts` | Shared sorting, draft filtering, and date formatting. |

## Adding content

**A project** — create `src/content/projects/<slug>.mdx`:

```yaml
---
title: Project Name
summary: One or two sentences. Used on cards and in meta descriptions.
period: '2026'          # quote bare years, or YAML reads them as numbers
featured: 6
group: finance          # finance | learning | mobile | tools
stack: ['Python', 'pandas']
links:
  repo: 'https://github.com/...'
demo:                   # optional — embeds a live iframe
  url: 'https://example.pages.dev'
  aspect: '16/10'
---
```

**A post** — create `src/content/writing/<slug>.mdx` with `title`,
`description`, and `pubDate`.

## Conventions

- Colours come from `theme.css` only. `--t-accent` is decorative (fills, rules,
  bullets); anything where the accent carries text uses `--t-accent-ink`, which
  is contrast-checked against the cream background.
- No React integration. Nothing here needs an island, and including it emitted a
  ~190KB client runtime that no page referenced. Re-add with
  `npx astro add react` when a real island is actually needed.
- Fonts are self-hosted at build time via Astro's Fonts API — no external
  requests, no layout shift.
- No live demo for anything that touches real financial data.

## Deploying

Cloudflare Pages, connected to this repo:

- Build command: `npm run build`
- Output directory: `dist`

Once the real hostname is known, update it in three places: `site` in
`astro.config.mjs`, the `Sitemap:` line in `public/robots.txt`, and `url` in
`src/config/site.ts`.
