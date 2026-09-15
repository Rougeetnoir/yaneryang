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

## Demo 子项目

`/projects` 里能直接玩的网页 demo，按**要不要构建**分两档：

- **站内（默认）**：纯 HTML/CSS/JS，CDN 引库也算。本体放
  `public/demos/<slug>/index.html`，跟网站一起部署。`public/` 原样拷贝，
  不经过 Tailwind、不进网站依赖树，所以 demo 的样式和网站互不影响。
- **独立仓库**：一旦需要自己的 `package.json`（npm 依赖、框架、构建、后端、
  API key），就开新仓库 + 自己的 Cloudflare Pages 项目，这边的 mdx 只填
  `links.live` / `links.repo`（能嵌就填 `demo.url`）。不要塞进本仓库做
  workspaces——lockfile 和 Cloudflare 构建会缠在一起。

新建站内 demo：

```sh
node scripts/new-demo.mjs <slug>
```

生成三个文件，已存在的不覆盖：

| 文件 | 写给谁 |
|---|---|
| `public/demos/<slug>/index.html` | demo 本体，带好 charset / viewport / 亮暗色 |
| `src/content/projects/<slug>.mdx` | 读者。`draft: true`，`demo.url` 已填 |
| `src/content/projects/<slug>.notes.md` | 维护者。`.md` 不是 `.mdx`，collection 不读它 |

约定：

- 统一挂在 `/demos/` 下，避免和 `/projects` `/books` 等路由撞名。
  Odyssey 是例外，留在 `/odyssey/`，线上链接已经发出去了。
- dev server **不会**把 `/demos/<slug>/` 解析成目录下的 `index.html`（404，
  `/odyssey/` 也一样），本地要打开 `/demos/<slug>/index.html`。Cloudflare 上
  两种写法都行。`demo.url` 填的是线上地址，所以项目详情页里的 iframe 在推上去
  之前是空的——本地看 demo 本体就好。
- 工作在 `demo/<slug>` 分支上做；push 后 Cloudflare 会给分支出 preview 部署。
  `draft: true` 只在生产构建里隐藏，dev 下照样显示。上线就是去掉 draft、合进 main。
- 有生成步骤的，原料缓存进 gitignore，生成结果提交（照 Odyssey 头像的做法），
  另一台机器不需要 key 也不用重跑。
- **定稿后只维护仓库里这一份。** 用 Claude Artifact 做原型可以，但别让它和
  `public/` 那份并行活着——Odyssey 就是这么漂移成三份的（notes §0）。
- **交接写进 `<slug>.notes.md`，不要只靠 Claude 的 memory。** memory 存在本机
  `~/.claude/`，另一台机器看不到；仓库里的 notes 会随 git 走。

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

## Odyssey Reader 的演员头像

`public/odyssey/index.html` 里 `ODYSSEY-FACES:BEGIN` / `:END` 之间的那段
base64 是**生成的，不要手改**。改动流程：

1. 人物增减改 `scripts/odyssey-faces.json`（`slug` / `name_en` / `chars`
   由人维护，`chars` 是 `CHARS[].id` 数组）。
2. `TMDB_API_KEY=… node scripts/build-odyssey-faces.mjs --init` 填 TMDb id。
3. `node scripts/build-odyssey-faces.mjs` 下载、裁剪、写回页面。

原图缓存在 `.odyssey-faces/`（gitignored）。生成结果是提交进仓库的，所以另一台
机器既不需要 key 也不需要重跑——除非要换头像。缓存里已有的文件不会重新下载，
想换某个人就删掉 `.odyssey-faces/<slug>.*` 再跑。

头像必须内联成 data URI，不能放 `public/odyssey/` 当独立文件——原因见
`src/content/projects/odyssey-reader.notes.md` 的 §0 和 §6。
