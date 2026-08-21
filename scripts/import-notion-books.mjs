#!/usr/bin/env node
/**
 * Turns a Notion export of the "Reading" database into the `books` collection.
 *
 *   node scripts/import-notion-books.mjs
 *
 * Input:  .notion-export/  (unzip the export here — gitignored)
 * Output: src/content/books/*.mdx and src/content/books/covers/*
 *
 * Safe to re-run. Existing MDX bodies are never overwritten — the body is where
 * a note gets rewritten by hand after import, and losing that to a re-run would
 * make the script something you are afraid of. Frontmatter is refreshed, except
 * for `spine`/`detailColor`, which are kept once set so hand-corrected colours
 * survive.
 *
 * Only books marked "2. 已读" are imported: those are the ones Notion ships
 * cover images for, and a shelf of books someone has not read is a wishlist.
 */

import { readFile, readdir, writeFile, mkdir, access } from 'node:fs/promises';
import { join, basename } from 'node:path';
import sharp from 'sharp';
import { pinyin } from 'pinyin-pro';
import { extractCoverColors } from './lib/extract-cover-color.mjs';

const EXPORT_DIR = '.notion-export';
const BOOKS_DIR = 'src/content/books';
const COVERS_DIR = join(BOOKS_DIR, 'covers');
const READ_STATUS = '2. 已读';
/* Wide enough for a retina cover at its largest rendered size, no wider —
   astro:assets resizes down from here, it never resizes up. */
const COVER_WIDTH = 700;

/* ---------------------------------------------------------------- csv ---- */

/**
 * Minimal RFC 4180 parser. Notion quotes any field containing a comma or a
 * newline and escapes quotes by doubling them, and book blurbs contain all
 * three — splitting on commas would silently shred a third of the rows.
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char !== '"') field += char;
      else if (text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else quoted = false;
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += char;
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift().map((h) => h.replace(/^﻿/, '').trim());
  return rows
    .filter((cells) => cells.some((cell) => cell.trim()))
    .map((cells) => Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? '').trim()])));
}

/* --------------------------------------------------------------- slugs ---- */

/**
 * Chinese titles through pinyin, everything else through plain slugification.
 * `ü` becomes `v`, the form every Chinese input method uses, because `u` would
 * collide (`lü` and `lu` are different syllables and different books).
 */
function slugify(title) {
  const romanized = pinyin(title, { toneType: 'none', type: 'array', nonZh: 'consecutive' })
    .join(' ')
    .replace(/ü/g, 'v');

  const slug = romanized
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'book';
}

/** Appends -2, -3 … so two books can never claim the same URL. */
function uniqueSlug(slug, taken) {
  if (!taken.has(slug)) {
    taken.add(slug);
    return slug;
  }
  let n = 2;
  while (taken.has(`${slug}-${n}`)) n += 1;
  taken.add(`${slug}-${n}`);
  return `${slug}-${n}`;
}

/* ----------------------------------------------------------- frontmatter -- */

const exists = (path) =>
  access(path).then(
    () => true,
    () => false
  );

/** YAML scalar. Single quotes are the safest fence for arbitrary user text. */
const yaml = (value) => `'${String(value).replace(/'/g, "''")}'`;

/**
 * Splits an existing MDX file into its frontmatter lines and its body, so a
 * re-import can refresh one without touching the other.
 */
function splitMdx(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return match ? { frontmatter: match[1], body: match[2] } : { frontmatter: '', body: text };
}

/** Reads one `key: value` back out of existing frontmatter. */
function readField(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!match) return null;
  return match[1].trim().replace(/^'(.*)'$/s, '$1').replace(/''/g, "'");
}

/* ---------------------------------------------------------------- main ---- */

async function findCsv() {
  const entries = await readdir(EXPORT_DIR);
  /* Notion writes two CSVs: the current view, and `_all` with every column.
     Only the latter carries covers, ratings, notes and status. */
  const all = entries.find((name) => name.endsWith('_all.csv'));
  if (!all) throw new Error(`No *_all.csv in ${EXPORT_DIR}/ — re-export with "Include databases: All".`);
  return join(EXPORT_DIR, all);
}

async function main() {
  const csvPath = await findCsv();
  const rows = parseCsv(await readFile(csvPath, 'utf8'));

  await mkdir(COVERS_DIR, { recursive: true });

  const read = rows.filter((row) => row['状态'] === READ_STATUS);
  const skipped = [];
  const taken = new Set();
  let written = 0;
  let kept = 0;

  /* `已读编号` is "2022_04" — year plus the order finished within it. Sorting on
     it puts the shelf in the order the books were actually read. */
  read.sort((a, b) => (a['已读编号'] || '').localeCompare(b['已读编号'] || ''));

  for (const [index, row] of read.entries()) {
    const title = row['书名'];
    const rawCover = row['封面'];

    /* Notion only downloads covers it hosts. A remote URL means the image is
       still on someone else's server, and this script does not fetch those. */
    if (!rawCover || /^https?:/i.test(rawCover)) {
      skipped.push({ title, why: rawCover ? 'cover is a remote URL' : 'no cover' });
      continue;
    }

    const source = join(EXPORT_DIR, decodeURIComponent(rawCover));
    if (!(await exists(source))) {
      skipped.push({ title, why: `cover missing from export (${basename(source)})` });
      continue;
    }

    const slug = uniqueSlug(slugify(title), taken);
    const target = join(COVERS_DIR, `${slug}.jpg`);

    /* Notion's originals run to a megabyte or more, and five of them are PNGs
       of photographic artwork — 3MB to say what JPEG says in 40KB. Everything
       is normalised to one format and one width so the repo stays small and
       astro:assets has one kind of input to reason about. */
    await sharp(source)
      .resize({ width: COVER_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(target);

    const mdxPath = join(BOOKS_DIR, `${slug}.mdx`);
    const existing = (await exists(mdxPath)) ? splitMdx(await readFile(mdxPath, 'utf8')) : null;

    /* Colours are extracted once. After that the frontmatter is the source of
       truth, so a hand-corrected colour is not silently reverted. */
    let spine = existing && readField(existing.frontmatter, 'spine');
    let detailColor = existing && readField(existing.frontmatter, 'detailColor');
    if (!spine || !detailColor) {
      const extracted = await extractCoverColors(target);
      spine ||= extracted.spine;
      detailColor ||= extracted.detailColor;
    } else {
      kept += 1;
    }

    const tags = [...new Set([...row['Type'].split(','), ...row['标签'].split(',')])]
      .map((tag) => tag.trim())
      .filter(Boolean);

    const frontmatter = [
      `title: ${yaml(title)}`,
      `author: ${yaml(row['作者'] || 'Unknown')}`,
      `cover: ${yaml(`./covers/${basename(target)}`)}`,
      row['阅读时间'] && `read: ${yaml(row['阅读时间'])}`,
      row['评分'] && `rating: ${[...row['评分']].filter((c) => c === '⭐').length}`,
      tags.length && `tags:\n${tags.map((tag) => `  - ${yaml(tag)}`).join('\n')}`,
      row['Link'] && `link: ${yaml(row['Link'])}`,
      row['Summary'] && `blurb: ${yaml(row['Summary'].replace(/\s*\n\s*/g, ' '))}`,
      `featured: ${index + 1}`,
      `spine: ${yaml(spine)}`,
      `detailColor: ${yaml(detailColor)}`,
    ]
      .filter(Boolean)
      .join('\n');

    /* The body is the note. Notion's Comments field seeds it, but once the file
       exists the file wins — that is where the note gets rewritten properly. */
    const body = existing?.body?.trim() || row['Comments'].trim();

    await writeFile(mdxPath, `---\n${frontmatter}\n---\n\n${body}\n`, 'utf8');
    written += 1;
  }

  console.log(`\n  ${written} books written to ${BOOKS_DIR}/`);
  if (kept) console.log(`  ${kept} kept their hand-set colours`);

  if (skipped.length) {
    console.log(`\n  ${skipped.length} skipped:`);
    for (const { title, why } of skipped) console.log(`    ${title} — ${why}`);
  }

  const withNote = read.filter((row) => row['Comments'].trim()).length;
  console.log(`\n  ${withNote} of ${written} have a note of your own. The rest are waiting.\n`);
}

main().catch((error) => {
  console.error(`\n  Import failed: ${error.message}\n`);
  process.exitCode = 1;
});
