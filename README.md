# {Mountains, Trees, Names}\*

**Pan forever. Find the tree you planted.**

[![Live demo](https://img.shields.io/badge/demo-landscape.bairui.dev-141414?style=for-the-badge)](https://landscape.bairui.dev/)
[![ITP Winter Show 2025](https://img.shields.io/badge/ITP-Winter%20Show%202025-f6f6f6?style=for-the-badge&color=141414)](https://bairui.dev/mountains-trees-names-inf)

<img src="./img/landscape.png" width="720" alt="{Mountains, Trees, Names}* — infinite procedural landscape" />

[\{Mountains, Trees, Names\}\*](https://landscape.bairui.dev/) is a procedurally generated infinite landscape collectively created from the trees of [Find the Tree in Your Name](https://tree.bairui.dev/) participants at [ITP Spring 2025](https://itp.nyu.edu/shows/spring2025/projects/#11830-find-the-tree-in-your-name). Zoom and pan across layered mountains; each tree is a name turned into form, signed with an [APack](https://apack.bairui.dev/) stamp.

Inspired by Lingdong Huang's [\{Shan, Shui\}\*](https://github.com/LingDong-/shan-shui-inf) and the Chinese painting [A Thousand Li of Rivers and Mountains](https://en.wikipedia.org/wiki/Wang_Ximeng), the project explores infinite composition, collective authorship, and the feeling that **those who plant the trees become part of the landscape itself**.

> *The creators are embedded in the creation.*

[**Try it live →**](https://landscape.bairui.dev/) · [**Plant your tree →**](https://tree.bairui.dev/) · [**Project story →**](https://bairui.dev/mountains-trees-names-inf)

## What it does

1. **Generate** — Midpoint-displacement mountains unfold in two depth layers with radial gradients in blue, green, and gold.
2. **Plant** — Community trees and the ITP archive in `names.json` merge into one list (community newest first). Index 0 sits at the screen center; higher indices alternate right, left, further right, further left, with stable seeded gaps. Pan forever — the list loops along the ridge.
3. **Sign** — APack stamps mark authorship on each tree, visible marks of who grew what.
4. **Explore** — D3 zoom and pan reveal an endless scroll; new terrain loads as you move.
5. **Return** — Open **My trees** to browse, focus, or delete trees you planted (shared browser ID with [tree.bairui.dev](https://tree.bairui.dev/)). A live count shows how many trees are in the landscape.
6. **Present** — At ITP Winter Show 2025, [Chloe](https://www.instagram.com/qiyun_chloe/) and I printed 60 pages on a [Riso](https://us.riso.com/) printer and tiled them on the wall, making the digital forest tangible.

## Why it exists

This project grew out of [Find Trees in Names: What if We are Trees?](https://bairui.dev/name2tree). After collecting hundreds of trees from the ITP Spring Show, I wanted to see them not as a grid or a cloud, but as a **forest in a landscape** — the way names hide inside language, the way cypress hides inside `柏`.

I was first drawn to Lingdong Huang's [\{Shan, Shui\}\*](https://shan-shui-inf.lingdong.works/) for its overall composition — mountains and rivers connected across a long-distance view, perfect for zooming and panning. A few years later, a musical theatre performance called [A Tapestry of a Legendary Land](https://en.wikipedia.org/wiki/Wang_Ximeng) about Wang Ximeng painting [A Thousand Li of Rivers and Mountains](https://en.wikipedia.org/wiki/Wang_Ximeng) stayed with me. I kept wanting to work with those yellow, blue, and green colors.

The landscape itself evolved in stages:

**Thanksgiving 2024 — triangles.** I wrote a `triangle(x)` function that places a triangle at each position using uniform and noise randomness, then repeats with a small offset until the range `[startX, endX]` fills up.

![Early triangle landscape](./img/triangles.png)

**Half a year later — color.** In Daniel Shiffman's *The Nature of Code* at ITP, I moved the scene to SVG and added `radialGradient` fills, borrowing the palette from Wang Ximeng's painting.

![Landscape with colored triangles](./img/color.png)

**Thanksgiving 2025 — trees and mountains.** I planted every participant tree into the scene with APack stamps and swapped triangles for midpoint-displacement mountains — more like shanshui, still infinite. The stamps made authorship visible: every person who grew a tree left a mark in the landscape.

![Landscape with trees, names, and stamps](./img/trees-stamps.png)

**ITP Winter Show 2025 — Riso prints.** [Chloe](https://www.instagram.com/qiyun_chloe/) had just taken Print and Code and wanted to experiment with a [Riso](https://us.riso.com/) printer — so we printed the landscape as 60 pages of A4 paper, from 10pm to 6am. With only a few ink colors available, we picked blue for mountains, orange for trees, and green for stamps. Each page needed four copies and three passes through the printer. We tiled the pages on the wall at ITP Winter Show 2025, making the digital forest tangible.

![Landscape Riso print at ITP Winter Show 2025](./img/riso.jpg)

## How it works

```
community trees + names.json (merged ranks)
      │
      ▼
┌─────────────────────────────────────┐
│  generateMountains()                │  midpoint displacement + Perlin noise
│  far layer + close ridgeline        │  radialGradient fills (theme.js)
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  placeMergedTrees()                 │  center-out slots, seeded gaps, infinite loop
│  tree.js → Charming.js SVG          │  APack stamp per tree
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│  D3 zoom + pan                      │  lazy-load [startX, endX] as you scroll
│  d3.curveBundle mountain paths      │  ?show=true for fullscreen kiosk mode
└─────────────────────────────────────┘
```

**Mountains** (`render.js`) — seeded noise drives height, width, and gradient stops; recursive subdivision adds natural roughness.

**Trees** (`tree.js`) — ASCII/Unicode digits from each name drive a breadth-first tree; degenerate runs become roses, same as Name2Tree.

**Interaction** — `d3.zoom` scales and translates the scene; `maybeLoad()` extends the visible range so the landscape feels infinite.

## Tech stack

| Layer | Tools |
|-------|-------|
| Rendering | [D3.js](https://d3js.org/) — zoom, paths, data join |
| Trees | [Charming.js](https://charmingjs.org/), [apackjs](https://apack.bairui.dev/) |
| Community | [Supabase](https://supabase.com/) — Postgres `landscape_trees` table, `@supabase/supabase-js`, Row Level Security |
| Validation | `bad-words` profanity filter, length and URL/email checks (client-side) |
| Noise | Custom Perlin (`noise.js`), `gl-matrix` |
| Gradients | SVG `radialGradient` (`gradient.js`) |
| Build | Vite |
| Deploy | Vercel |

## Getting started

**Requirements:** Node.js 18+, pnpm

```bash
git clone https://github.com/pearmini/infinite-landscape.git
cd infinite-landscape
pnpm install
cp .env.example .env.local   # optional: enable planting via Supabase
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). Scroll and zoom to explore. Without `.env.local`, the landscape loads; planting shows a friendly “not connected” message. The **?** button in modals walks through how a name becomes a tree.

```bash
pnpm build     # production build
pnpm preview   # preview production build
```

Append `?show=true` for fullscreen kiosk mode (hides footer links, adds a fullscreen button).

### Supabase setup (community planting)

Uses the same Supabase project as [tree.bairui.dev](https://tree.bairui.dev/) (`bairui-studio`). Browser IDs are shared via `name2tree_browser_id` in `localStorage`, so trees you plant here and in the forest app belong to the same visitor identity.

1. Run [`supabase/landscape_trees.sql`](supabase/landscape_trees.sql) in the Supabase SQL Editor.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` and on Vercel.

## Project structure

```
infinite-landscape/
├── src/
│   ├── render.js   # Mountains, trees, zoom, lazy loading
│   ├── tree.js     # Name → tree SVG (Charming.js)
│   ├── ui.js           # Plant / My trees modals
│   ├── howItWorks.js   # Step-by-step name → tree guide
│   ├── animateTree.js  # Grow animation when planting
│   ├── gradient.js # Radial gradient helpers
│   ├── noise.js    # Perlin noise for terrain
│   ├── theme.js    # Sky and mountain palette
│   ├── names.json  # ITP Spring Show participant names
│   ├── main.js     # Mount, resize, kiosk mode
│   └── lib/
│       ├── browserId.js        # Shared visitor ID with Name2Tree
│       ├── supabase.js         # Client + browser ID header
│       ├── validateName.js     # Profanity and input checks
│       └── landscapeTreesApi.js
├── supabase/
│   └── landscape_trees.sql     # Schema + RLS
├── img/            # Screenshots and documentation images
└── index.html
```

## Related work

- [landscape.bairui.dev](https://landscape.bairui.dev/) — live demo
- [bairui.dev/mountains-trees-names-inf](https://bairui.dev/mountains-trees-names-inf) — full story, Riso process, and reflection
- [tree.bairui.dev](https://tree.bairui.dev/) — grow your own tree
- [tree.bairui.dev/forest](https://tree.bairui.dev/forest) — community forest gallery
- [bio.bairui.dev](https://bio.bairui.dev/) — [BioGlyph](https://bairui.dev/bio-glyph), one-line faces from the same ITP lineage
- [{Shan, Shui}\*](https://github.com/LingDong-/shan-shui-inf) — original infinite shanshui inspiration

## Thanks

Huge thanks to everyone who planted a tree at ITP Spring Show 2025 — come find yours in the landscape. And to [Chloe](https://www.instagram.com/qiyun_chloe/) for the all-night Riso marathon that put this forest on a wall.

<p align="center">
  <a href="https://landscape.bairui.dev/"><strong>landscape.bairui.dev</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/pearmini/infinite-landscape">Source</a>
  &nbsp;·&nbsp;
  <a href="https://bairui.dev/">Blog</a>
</p>

<p align="center"><em>What if we are trees?</em></p>
