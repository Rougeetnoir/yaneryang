import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Ordering rule for both collections: lower `featured` sorts first, and entries
 * without a `featured` value fall to the back. Re-prioritising the portfolio for
 * a different kind of role is therefore a frontmatter edit, never a code change.
 */

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    /** One or two sentences. Used on cards and in meta descriptions. */
    summary: z.string(),
    /** Human-readable, e.g. "2025 — ongoing". Not parsed. */
    period: z.string(),
    /** Sorts the projects index; also picks the home page's top three. */
    featured: z.number().optional(),
    group: z.enum(['finance', 'learning', 'mobile', 'tools']),
    stack: z.array(z.string()),
    role: z.string().optional(),
    links: z
      .object({
        repo: z.string().url().optional(),
        live: z.string().url().optional(),
      })
      .default({}),
    /** Live demo embedded in an iframe. Omit for anything touching real data. */
    demo: z
      .object({
        url: z.string().url(),
        /** width/height, used to reserve space and avoid layout shift. */
        aspect: z.string().default('16/10'),
      })
      .optional(),
    draft: z.boolean().default(false),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

/**
 * The bookshelf.
 *
 * Generated from a Notion export by `scripts/import-notion-books.mjs`, but what
 * it writes is ordinary MDX meant to be edited by hand afterwards. Nothing here
 * reads back to Notion, and re-running the import never overwrites a body.
 *
 * The split between `blurb` and the MDX body is deliberate: the body is Yaner's
 * own note on the book, the blurb is the publisher's copy. Merging them would
 * make it impossible to tell whose sentence you are reading.
 */
const books = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/books' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      author: z.string(),
      /** Lives in `src/content/books/covers/`. Optimised by astro:assets. */
      cover: image(),
      /** As recorded, e.g. "2023/08/01" or "2023/08/01 → 2023/08/03". */
      read: z.string().optional(),
      rating: z.number().min(1).max(5).optional(),
      /** Genre and reading-list labels, merged from Notion's Type and 标签. */
      tags: z.array(z.string()).default([]),
      /** Douban entry, for anyone who wants the book rather than the note. */
      link: z.string().url().optional(),
      /** Publisher's description. Not Yaner's words — rendered as such. */
      blurb: z.string().optional(),
      /** Sorts the shelf left to right, oldest read first. */
      featured: z.number().optional(),
      /**
       * Extracted from the cover by the import and written back here, so a bad
       * guess is fixed by editing this file rather than by changing code.
       * `spine` is the closed book on the shelf; `detailColor` fills the whole
       * detail page behind it.
       */
      spine: z.string().optional(),
      detailColor: z.string().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects, writing, books };
