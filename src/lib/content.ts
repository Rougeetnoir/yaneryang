import { getCollection, type CollectionEntry } from 'astro:content';

/** Drafts stay visible in `astro dev` and disappear from production builds. */
const isVisible = (entry: { data: { draft: boolean } }) =>
  import.meta.env.PROD ? !entry.data.draft : true;

/** Entries without `featured` sort after those that have it. */
const byFeatured = (
  a: { data: { featured?: number } },
  b: { data: { featured?: number } }
) => (a.data.featured ?? Infinity) - (b.data.featured ?? Infinity);

export async function getProjects(): Promise<CollectionEntry<'projects'>[]> {
  const projects = await getCollection('projects', isVisible);
  return projects.sort(byFeatured);
}

export async function getPosts(): Promise<CollectionEntry<'writing'>[]> {
  const posts = await getCollection('writing', isVisible);
  return posts.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export const PROJECT_GROUPS = [
  { id: 'finance', label: 'Finance & Automation' },
  { id: 'learning', label: 'Learning Tools' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'tools', label: 'Small Tools' },
] as const;

export const formatDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
