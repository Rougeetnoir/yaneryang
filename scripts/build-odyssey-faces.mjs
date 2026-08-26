#!/usr/bin/env node
/**
 * Bakes actor headshots into the Odyssey Reader as inline base64.
 *
 *   node scripts/build-odyssey-faces.mjs --init   # fill TMDb ids into the manifest
 *   node scripts/build-odyssey-faces.mjs          # download, resize, splice into the page
 *
 * Input:  scripts/odyssey-faces.json  (the manifest — slug, name, char ids)
 *         .odyssey-faces/             (downloaded originals — gitignored)
 * Output: the block between ODYSSEY-FACES:BEGIN/END in public/odyssey/index.html
 *
 * Why base64 and not files in public/: the page is published in three places,
 * one of them a Claude Artifact whose CSP allows no host but Google Fonts, and
 * one of them a file that has to open offline with no server. A <img src="…">
 * pointing anywhere breaks two of the three. Inlining is the only form that
 * survives all of them — see src/content/projects/odyssey-reader.notes.md §0, §6.
 *
 * Safe to re-run. Originals are cached, so a second machine can rebuild the page
 * without a TMDb key as long as .odyssey-faces/ is populated — and it needs no
 * rebuild at all, because the generated block is committed.
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const MANIFEST = 'scripts/odyssey-faces.json';
const CACHE_DIR = '.odyssey-faces';
const PAGE = 'public/odyssey/index.html';
const BEGIN = '<!-- ODYSSEY-FACES:BEGIN';
const END = '<!-- ODYSSEY-FACES:END -->';

/* 128 covers 2x of both places a face is drawn: the largest star-map node is
   r:26 (~45 CSS px once the 1040-wide viewBox is scaled down) and the actor
   card avatar is 58px. Wider would only add bytes to a file that already has to
   carry all nineteen of them. */
const FACE_PX = 128;
const WEBP_QUALITY = 72;

/* w342 is the smallest TMDb profile size that still has detail to spare after
   a square crop down to 128. */
const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';
const TMDB_API = 'https://api.themoviedb.org/3';

/* ------------------------------------------------------------- helpers ---- */

/** Matt Damon and "Lupita Nyong'o" have to compare equal to whatever TMDb
    spells them as — curly apostrophes and accents included. */
function normName(s) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019']/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function apiUrl(path, params = {}) {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error(
      'TMDB_API_KEY is not set. Get a key at themoviedb.org/settings/api and run:\n' +
        '  TMDB_API_KEY=… node scripts/build-odyssey-faces.mjs',
    );
  }
  const url = new URL(TMDB_API + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  /* A v4 read token is a JWT and goes in a header; a v3 key is a bare hex
     string and goes in the query. Accept either — people have one or the other. */
  if (key.includes('.')) return { url, headers: { Authorization: `Bearer ${key}` } };
  url.searchParams.set('api_key', key);
  return { url, headers: {} };
}

async function api(path, params) {
  const { url, headers } = apiUrl(path, params);
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`TMDb ${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

/** Writes the manifest one person per line, so a regenerated file still reads
    like a table and its diffs stay per-person. */
function serialiseManifest(m) {
  const person = (p) =>
    '    ' +
    JSON.stringify({
      slug: p.slug,
      name_en: p.name_en,
      name_zh: p.name_zh,
      chars: p.chars,
      tmdb_person_id: p.tmdb_person_id,
      profile_path: p.profile_path,
      ...(p.crop ? { crop: p.crop } : {}),
    });
  return (
    '{\n' +
    `  "_comment": ${JSON.stringify(m._comment)},\n` +
    `  "movie_tmdb_id": ${JSON.stringify(m.movie_tmdb_id)},\n` +
    `  "movie_query": ${JSON.stringify(m.movie_query)},\n` +
    '  "people": [\n' +
    m.people.map(person).join(',\n') +
    '\n  ]\n}\n'
  );
}

/* ---------------------------------------------------------------- init ---- */

async function init(manifest) {
  if (manifest.movie_tmdb_id == null) {
    const { title, year } = manifest.movie_query;
    const found = await api('/search/movie', { query: title, year: String(year) });
    if (!found.results?.length) throw new Error(`No TMDb movie for "${title}" (${year}).`);
    manifest.movie_tmdb_id = found.results[0].id;
    console.log(
      `movie: ${found.results[0].title} (${found.results[0].release_date}) → ${manifest.movie_tmdb_id}`,
    );
    if (found.results.length > 1) {
      console.log('  other matches, in case that is the wrong one:');
      for (const r of found.results.slice(1, 4)) console.log(`    ${r.id}  ${r.title} (${r.release_date})`);
    }
  }

  const credits = await api(`/movie/${manifest.movie_tmdb_id}/credits`);
  const byName = new Map(credits.cast.map((c) => [normName(c.name), c]));

  const missing = [];
  for (const p of manifest.people) {
    let hit = byName.get(normName(p.name_en));
    /* Not in this film's credits (or credited under another spelling) — fall
       back to a person search so a name still resolves to a face. */
    if (!hit) {
      const found = await api('/search/person', { query: p.name_en });
      hit = found.results?.find((r) => normName(r.name) === normName(p.name_en)) ?? found.results?.[0];
      if (hit) console.log(`  ${p.name_en}: not in credits, matched by person search`);
    }
    if (!hit) {
      missing.push(p.name_en);
      continue;
    }
    p.tmdb_person_id = hit.id;
    p.profile_path = hit.profile_path ?? null;
    if (!p.profile_path) missing.push(`${p.name_en} (no profile image on TMDb)`);
  }

  await writeFile(MANIFEST, serialiseManifest(manifest));
  console.log(`\nwrote ${MANIFEST} — check the slug ↔ chars mapping by hand before building.`);
  if (missing.length) {
    console.log('\nunresolved, fill these in by hand:');
    for (const m of missing) console.log(`  ${m}`);
  }
}

/* --------------------------------------------------------------- build ---- */

async function cachedFile(p) {
  const files = await readdir(CACHE_DIR).catch(() => []);
  return files.find((f) => f.replace(/\.[^.]+$/, '') === p.slug);
}

async function ensureOriginal(p) {
  const existing = await cachedFile(p);
  if (existing) return join(CACHE_DIR, existing);

  if (!p.profile_path) {
    throw new Error(
      `${p.slug} has no profile_path and nothing cached in ${CACHE_DIR}/. ` +
        `Run with --init, or drop ${p.slug}.jpg into ${CACHE_DIR}/ by hand.`,
    );
  }
  const url = TMDB_IMG + p.profile_path;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${p.slug}: ${res.status} fetching ${url}`);
  const ext = p.profile_path.match(/\.[^.]+$/)?.[0] ?? '.jpg';
  const dest = join(CACHE_DIR, p.slug + ext);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`  downloaded ${p.slug}${ext}`);
  return dest;
}

async function toDataUri(p) {
  const src = await ensureOriginal(p);
  let img = sharp(src);
  /* TMDb profiles are 2:3 portraits with the head in the upper third, so a
     square taken off the top frames the face. `sharp.strategy.attention` was
     tried first and got 3 of 19 wrong — it chases contrast, not faces, so a
     white shirt or a bright yellow collar outvoted the head and the crop came
     back as a chin and a torso. Saliency is the wrong tool on a format this
     predictable. `crop` in the manifest overrides this per person. */
  if (p.crop) img = img.extract(p.crop);
  const buf = await img
    .resize(FACE_PX, FACE_PX, { fit: 'cover', position: p.crop ? 'centre' : 'top' })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  return { uri: `data:image/webp;base64,${buf.toString('base64')}`, bytes: buf.length };
}

async function build(manifest) {
  await mkdir(CACHE_DIR, { recursive: true });

  const faces = [];
  let total = 0;
  for (const p of manifest.people) {
    const { uri, bytes } = await toDataUri(p);
    faces.push([p.slug, uri]);
    total += bytes;
  }

  const byChar = [];
  for (const p of manifest.people) for (const id of p.chars) byChar.push([id, p.slug]);

  /* One person per line: the block is ~100KB of base64, and the only way its
     diffs stay reviewable is if a changed headshot touches exactly one line. */
  const block =
    `${BEGIN} 由 scripts/build-odyssey-faces.mjs 生成，勿手改 -->\n` +
    '<script>\n' +
    '/* 演员头像。来源 TMDB，见页脚署名。数据内联的原因见 odyssey-reader.notes.md。 */\n' +
    'const FACE_SRC = {\n' +
    faces.map(([slug, uri]) => `'${slug}':'${uri}'`).join(',\n') +
    '\n};\n' +
    '/* CHARS[].id → FACE_SRC 的键。两个角色共用一张脸时只存一份字节。 */\n' +
    'const FACE_BY_CHAR = {' +
    byChar.map(([id, slug]) => `${id}:'${slug}'`).join(',') +
    '};\n' +
    '</script>\n' +
    END;

  const html = await readFile(PAGE, 'utf8');
  const from = html.indexOf(BEGIN);
  const to = html.indexOf(END);
  if (from === -1 || to === -1) {
    throw new Error(`Could not find the ODYSSEY-FACES markers in ${PAGE}.`);
  }
  await writeFile(PAGE, html.slice(0, from) + block + html.slice(to + END.length));

  const kb = (n) => (n / 1024).toFixed(0) + 'KB';
  console.log(`${faces.length} faces, ${kb(total)} of WebP → ${kb(block.length)} of base64 in ${PAGE}`);
  console.log(`${byChar.length} star-map nodes get a face.`);
}

/* ---------------------------------------------------------------- main ---- */

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
if (process.argv.includes('--init')) await init(manifest);
else await build(manifest);
