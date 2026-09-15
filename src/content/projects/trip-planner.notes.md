# Trip Planner —— 维护交接

写给一个没有任何上下文的人（包括另一台机器上的 Claude）。只记代码里读不出来的东西：
为什么这么做、哪里有坑、哪些是查证过的。

本体：**独立仓库** `~/Developer/trip-planner`（尚未创建）
展示页：`src/content/projects/trip-planner.mdx`

## 约束

**不在站内。** 按 CLAUDE.md 的 demo 分档，这个项目要走独立仓库：

- 行程生成调 Claude API，地图用 Mapbox，地点数据来自 Google Places，存储和分享
  用 Supabase。这些 key 都得放在服务端。
- 参考实现用 Next.js（App Router + API Routes），需要构建步骤。

所以本仓库只保留项目页。`public/demos/trip-planner/` 脚手架生成后已经删掉，不要再加
回来，免得站内原型和独立仓库并存、各自漂移（Odyssey 就是这么变成三份的）。

网站这边剩下的事：独立仓库部署之后，在 mdx 里填 `links.repo` / `links.live`，写正文，
去掉 `draft`，合进 main。如果线上版本不带真实用户数据、适合嵌入，可以再加
`demo.url`。

**参考文档**（用户提供的一篇 build guide）里的功能范围：

1. 偏好表单，分几步填：目的地、日期、预算和币种、人数、兴趣（多选）、节奏
   relaxed/moderate/packed、住宿档次 budget/mid-range/luxury。
2. Claude 生成逐日行程，返回 JSON：`days[].activities[]`，每项有时间段、起止时间、
   地点、经纬度、预估花费、分类、tips；另有 `meals`、`dailyBudget`，以及整趟行程的
   `budgetBreakdown`（accommodation/activities/food/transport/misc）、`packingTips`、
   `importantNotes`。
3. 逐日时间线 UI，活动可以查看和编辑。
4. Mapbox 地图：按天着色的 marker，并画出路线。
5. 预算追踪：按分类画饼图，显示剩余或超支。
6. Supabase 三张表 `destinations`（带 pgvector embedding）、`trips`（itinerary
   用 JSONB 存）、`activities`；保存和分享行程。
7. 以后可以做：订酒店、多人协作（Supabase Realtime）、离线、航班、天气、
   导出 PDF/.ics。

## 地雷区（照参考文档写之前先看）

- 文档里的模型 id `claude-sonnet-4-20250514` 已经过时，新写的时候查一下当前模型
  （截至 2026-09 是 `claude-sonnet-5` / `claude-opus-5`）。
- 文档直接 `JSON.parse(response.content[0].text)`，模型输出里一旦带了 markdown 代码块
  就会崩。要用结构化输出（JSON schema / tool use），或者至少做一次校验再重试。
- 生成要 10–30 秒，API Route 的超时要按这个量级设置，Cloudflare 或 Vercel 免费档的
  函数时长限制都要核对。前端要有 loading 状态。
- Mapbox 坐标是 `[lng, lat]` 的顺序；marker 要等 map 触发 `load` 事件之后再加。
  Claude 给的坐标要用目的地的边界框校验一下，差得远的直接丢掉。
- 文档说部署在 Vercel，但本站的惯例是 Cloudflare Pages。Next.js 要跑在 Cloudflare 上
  需要 OpenNext 适配，开仓库时先定下部署平台。

## 试过之后推翻的方案

- 站内静态版（`public/demos/trip-planner/`，用 Leaflet 加示例数据）：因为核心功能
  依赖服务端 key，已经否掉。
