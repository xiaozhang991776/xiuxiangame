# Xiāntú Lúnhuí Jué — itch.io Listing Copy & Setup Guide (English)

> Paste-ready copy for your itch.io page. Build package: `dist/仙途轮回诀-web-v1.1.0.zip` (web, play-in-browser).

---

## 1. Basic Info

- **Title**: Xiāntú Lúnhuí Jué (仙途·轮回诀)
- **Subtitle**: Immortal Path: Reincarnation
- **Tagline (one line)**: A zero-dependency browser xianxia idle game — from mortal Qi Refining to transcending the cycle of reincarnation through seclusion, tribulation, and the Great Dao.

---

## 2. Full Description (paste into page body)

**Xiāntú Lúnhuí Jué (Immortal Path: Reincarnation)** is a browser-based xianxia idle / incremental game with zero dependencies. You begin as an ordinary mortal and grow your power through secluded cultivation, surviving tribulations to break through one realm after another, until you finally transcend the cycle of reincarnation and reach the pinnacle of the Great Dao.

**Core Loop**
- *Seclude & Cultivate*: power keeps growing even while you are offline (offline gains await your return).
- *Break Through*: meet the requirements to survive a tribulation; power and stats jump substantially.
- *Reincarnate*: dissolve your cultivation to rebuild for a higher growth cap, or take a Reincarnation Herb to keep your progress and fight again.
- *Ascend the Great Dao*: unlock four independent, non-diluting multipliers — Laws, Lifebound Treasure, Blessed Cave, Avatar Clone — built for long idle sessions and endless progression.

**Systems at a Glance**
- *Realm ladder*: Qi Refining → Foundation → Golden Core → Nascent Soul → Spirit Severing → … → Great Dao, dozens of stages.
- *Combat*: challenge beasts and rival cultivators for resources and fortune.
- *Exploration & Encounters*: roam the world to trigger random events and hidden legacies.
- *Spirit Pets / Talents / Treasures / Blessed Caves / Avatar Clones*: multiple progression tracks that stack.
- *Fellow Cultivators*: debate, duel, and rank on the leaderboard — cultivation is better together.
- *Main Story*: guides you step by step toward immortality.
- *Great Dao+*: a late-game layer of 4 independent, non-diluting multipliers designed for idle marathons and long-tail growth.

**Controls**
- Number keys `1`–`9`, `0` switch the main panels (Cultivate / Realm / Inventory / Combat / Explore / Pets / Talents / Treasures / Cave / Clone).
- `B` break through, `Space` focus-cultivate, `P` fellow cultivators, `V` dao path.
- Almost everything is also clickable — fully playable with the mouse alone.

**Tips**
- Progress auto-saves to your browser's localStorage; close the tab and pick up where you left off.
- Switching devices? The Windows desktop build (same author page) saves more durably — grab it there.
- A slow-paced, progression-heavy idle game — perfect for a couple of clicks in your spare moments.

> **Note on language**: the game's interface is currently Chinese-only. An English UI is planned; until then, non-Chinese readers may want a translator handy. This listing is written in English so international players can find and understand the game.

---

## 3. Tags

`idle` `incremental` `xianxia` `cultivation` `rpg` `browser` `html5` `singleplayer` `chinese` `relaxing` `progression` `offline`

---

## 4. itch.io Upload Settings

1. Log in to itch.io → top-right **Create new project** (or Upload a game).
2. Keep **Kind of project** at default, then open the project editor.
3. In **Uploads**, click **Upload files** and select `dist/仙途轮回诀-web-v1.1.0.zip`.
4. On the file entry:
   - Check **This file will be played in the browser**;
   - Set **Embed / Launch** entry point to `index.html` (already at the zip root);
   - Viewport size: **960 × 600** (minimum), or larger — the game is responsive.
5. **Pricing**: set **Free** (no amount required; players play instantly). To accept support, enable "Allow payments" starting at $0.
6. Paste sections 1–3 above into the corresponding page fields and publish.

> **Save note**: the web build saves inside itch's iframe. Chrome / Edge / Firefox all work. Safari is stricter about cross-site iframe localStorage; if saves misbehave there, download the Windows desktop build on the same page for the most reliable experience.

---

## 5. Build Packages (this repo)

- `dist/仙途轮回诀-web-v1.1.0.zip` — web build (this listing; play in browser, 138 KB).
- `dist/仙途轮回诀-win64-v1.1.0.zip` — Windows desktop build (exe; more durable saves; optionally uploaded as a second download).

(Both zips are gitignored and stay local only.)
