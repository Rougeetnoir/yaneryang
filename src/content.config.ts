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

export const collections = { projects, writing };
