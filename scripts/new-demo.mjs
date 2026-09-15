#!/usr/bin/env node
/**
 * Scaffolds an in-site demo: the page itself, its project entry, and its notes.
 *
 *   node scripts/new-demo.mjs <slug>
 *
 * Output:
 *   public/demos/<slug>/index.html
 *   src/content/projects/<slug>.mdx        (draft: true, demo.url filled in)
 *   src/content/projects/<slug>.notes.md
 *
 * Never overwrites. Each file that already exists is reported and skipped, so
 * running it on a half-built demo only fills in what is missing.
 *
 * The HTML shell carries charset and viewport on purpose: Artifact hosts add
 * both for you, static hosting does not, and a page without viewport renders as
 * a 980px desktop page on a phone (see odyssey-reader.notes.md §0).
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const slug = process.argv[2];
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: node scripts/new-demo.mjs <slug>   (lowercase, digits, hyphens)');
  process.exit(1);
}

// Read `site` from the Astro config rather than repeating it, so a domain change
// there is picked up by every demo scaffolded afterwards.
const config = await readFile(join(ROOT, 'astro.config.mjs'), 'utf8');
const site = config.match(/^\s*site:\s*['"]([^'"]+)['"]/m)?.[1].replace(/\/$/, '');
if (!site) {
  console.error('Could not find `site` in astro.config.mjs');
  process.exit(1);
}

const title = slug
  .split('-')
  .map((word) => word[0].toUpperCase() + word.slice(1))
  .join(' ');
const year = new Date().getFullYear();

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${title}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
  :root {
    --bg: #faf9f6;
    --ink: #1c1b19;
    --muted: #6b6860;
    --line: #e4e1da;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #161614;
      --ink: #ecebe6;
      --muted: #9a978f;
      --line: #2e2d2a;
    }
  }
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font: 16px/1.6 ui-sans-serif, system-ui, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }
  /* Side gutter set once here. Use padding-block for vertical spacing — a
     \`padding\` shorthand silently zeroes the sides. */
  .wrap {
    max-width: 960px;
    margin: 0 auto;
    padding-inline: 16px;
    padding-block: 48px;
  }
  h1 { margin: 0; font-size: 2rem; line-height: 1.2; }
  .muted { color: var(--muted); }
</style>
</head>
<body>
<main class="wrap">
  <h1>${title}</h1>
  <p class="muted">Work in progress.</p>
</main>
<script>
</script>
</body>
</html>
`;

const mdx = `---
title: ${title}
summary: TODO — one or two sentences for the card and meta description.
period: '${year}'
# featured: 1
group: tools # finance | learning | mobile | tools
role: Sole developer
stack: ['HTML', 'CSS', 'Vanilla JS']
demo:
  url: '${site}/demos/${slug}/'
  aspect: '16/10'
draft: true
---

## The problem

## How it works
`;

const notes = `# ${title} —— 维护交接

写给一个没有任何上下文的人（包括另一台机器上的 Claude）。只记代码里读不出来的东西：
为什么这么做、哪里有坑、哪些是查证过的。

本体：\`public/demos/${slug}/index.html\`
展示页：\`src/content/projects/${slug}.mdx\`

## 约束

## 试过之后推翻的方案

## 地雷区
`;

const files = [
  [join(ROOT, 'public/demos', slug, 'index.html'), html],
  [join(ROOT, 'src/content/projects', `${slug}.mdx`), mdx],
  [join(ROOT, 'src/content/projects', `${slug}.notes.md`), notes],
];

for (const [path, content] of files) {
  const rel = relative(ROOT, path);
  const exists = await access(path).then(
    () => true,
    () => false,
  );
  if (exists) {
    console.log(`skip    ${rel} (exists)`);
    continue;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
  console.log(`create  ${rel}`);
}

// The dev server does not resolve a public directory to its index.html.
console.log(`\nDev: http://localhost:4321/demos/${slug}/index.html`);
