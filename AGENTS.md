## Before running anything: check sync

This repo is cloned on two machines. Either clone can be behind the other, and
`node_modules/`, `dist/`, `.astro/`, and `.notion-export/` are gitignored — they
are per-machine and never travel with a pull.

Run this first thing in a session, and again after any pause, **before**
`npx astro dev --background`, `npm run build`, `npx astro check`, or any
script in `scripts/`:

```sh
git fetch origin
git status -sb     # the branch line shows [ahead N] / [behind N]
```

Then act on what it says:

- **Behind** — `git pull --rebase` before running or editing anything.
  Running the old tree produces output that looks broken for no reason.
- **Ahead, or a dirty tree** — the other machine cannot see this work. Commit
  and push before switching machines; end every session with nothing
  uncommitted and nothing unpushed.
- **Diverged** — stop and reconcile the two histories before touching files.
  Do not force-push; both clones are real work.
- **Wrong branch** — work happens on feature branches (e.g.
  `add-odyssey-guide`), not always `main`. `git branch -vv` also shows whether
  the branch you want even exists locally; `git fetch` first, or it will look
  missing when it is only unfetched.

After a pull that touched `package-lock.json`, run `npm install` — the lockfile
syncs, the installed tree does not. If a dev server is already running, stop it
(`npx astro dev stop`) before pulling: it keeps serving the pre-pull tree and its
`.astro/` cache goes stale.

## Development

When starting the dev server, use background mode:

```
npx astro dev --background
```

Manage the background server with `npx astro dev stop`, `npx astro dev status`,
and `npx astro dev logs`. `astro` is not installed globally — it lives in
`node_modules/.bin/`, so every invocation needs `npx`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Bookshelf

`/books` is generated from a Notion export, not written by hand.

1. In the Notion `Reading` database: `•••` → Export → **Markdown & CSV**,
   content **Everything**, databases **All**.
2. Unzip it into `.notion-export/` (gitignored).
3. `node scripts/import-notion-books.mjs`

The script imports only rows marked `2. 已读` — those are the ones Notion ships
cover images for. It writes `src/content/books/*.mdx` plus resized covers, and
extracts each book's spine and detail-page colour from its cover art into the
frontmatter. Re-running is safe: MDX bodies (the notes) and any hand-corrected
`spine`/`detailColor` are left alone.

Slugs are pinyin, via the `pinyin-pro` devDependency — that is the only thing
it is there for.
