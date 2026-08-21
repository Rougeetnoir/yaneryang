## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

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
