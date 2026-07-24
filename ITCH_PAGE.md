# 仙途·轮回诀 — itch.io 上架文案与设置指南

> 本文件供你登录 itch.io 后**直接复制粘贴**到游戏页面。发布包已生成：`dist/仙途轮回诀-web-v1.1.0.zip`（网页版，浏览器直接玩）。

---

## 一、基础信息

- **标题 (Title)**：仙途·轮回诀
- **副标题 / 拼音 (Subtitle)**：Xiāntú Lúnhuí Jué · Immortal Path: Reincarnation
- **短描述 (Tagline，一句话)**：一款纯前端零依赖的修仙放置游戏——从凡尘练气到超脱轮回，闭关、论道、轮回、登临大道。

---

## 二、详细介绍（粘贴到页面正文，中文）

**仙途·轮回诀** 是一款运行在浏览器里的修仙放置（idle / incremental）游戏。你从一介凡人起步，凭闭关苦修积攒战力，渡劫突破一重又一重境界，直至超脱轮回、登临大道之巅。

**核心循环**
- 闭关修炼：离线也在涨战力，回来即收获（离线收益）。
- 突破境界：满足条件即可渡劫，战力与属性大幅跃升。
- 轮回重修：散功重修换取更高成长上限，或服轮回草保留修为再战。
- 登临大道：解锁法则、本命法宝、洞天福地、分身化身四条独立乘区，长线养成无稀释。

**系统一览**
- 境界体系：练气 → 筑基 → 金丹 → 元婴 → 化神 → … → 大道，共数十重。
- 战斗：挑战妖兽与道敌，历练获取资源与机缘。
- 探索 / 奇遇：游历四方触发随机事件与隐藏传承。
- 灵宠 / 天赋 / 法宝 / 洞天福地 / 分身化身：多线养成，互相叠加。
- 道友系统：道友论道、比拼、排行，独乐乐不如众乐乐。
- 主线任务：引导你一步步问道长生。
- 仙路·大道+：后期 4 条互不稀释的独立乘区，专为放置长草与长尾养成设计。

**操作说明**
- 数字键 `1`–`9`、`0` 切换主要面板（修炼 / 境界 / 背包 / 战斗 / 探索 / 灵宠 / 天赋 / 法宝 / 洞天 / 分身）。
- `B` 突破境界，`空格` 聚气助修，`P` 打开道友面板，`V` 查看仙路。
- 鼠标点击即可完成绝大多数操作，纯键盘亦可畅玩。

**小贴士**
- 进度自动保存在浏览器本地（localStorage），关掉页面下次回来还在。
- 想换设备继续？桌面版（Windows 可执行文件）存档更稳，可在同一作者页面下载。
- 这是一款慢节奏、重养成的放置游戏，适合碎片时间随手点两下。

---

## 三、English blurb（粘贴到页面，照顾国际玩家）

**Xiāntú Lúnhuí Jué (Immortal Path: Reincarnation)** is a zero-dependency, browser-based xianxia idle / incremental game. Start as a mortal, cultivate in seclusion to grow your power, survive tribulations to break through realms, and eventually transcend the cycle of reincarnation to reach the Great Dao.

- **Core loop**: seclude & cultivate (offline progress included) → break through realms → reincarnate for higher caps → ascend to the Great Dao.
- **Systems**: realm progression, combat, exploration & random encounters, spirit pets, talents, lifebound treasures, blessed caves, avatar clones, a fellow-cultivator leaderboard, main story, and a late-game "Great Dao+" layer with 4 independent, non-diluting multipliers.
- **Controls**: keys `1`–`9`/`0` switch panels, `B` break through, `Space` focus, `P` friends, `V` dao path. Mostly mouse-driven.
- **Save**: auto-saved to your browser's localStorage. A Windows desktop build with more durable saves is also available on the same page.

---

## 四、标签（Tags）

`idle` `incremental` `xianxia` `cultivation` `rpg` `browser` `html5` `singleplayer` `chinese` `relaxing` `progression` `offline`

---

## 五、itch.io 上传设置步骤

1. 登录 itch.io → 右上角 **Create new project**（或 Upload a game）。
2. **Kind of project** 保持默认（Game / Tool / Game with assets 均可），进入项目编辑页。
3. 在 **Uploads** 区域点 **Upload files**，选择 `dist/仙途轮回诀-web-v1.1.0.zip`。
4. 上传完成后，在文件条目上：
   - 勾选 **This file will be played in the browser**；
   - **Embed / Launch** 指向入口文件：填 `index.html`（zip 内根目录已有）；
   - 视口尺寸建议填 **960 × 600**（最小），或更大画布，游戏自适应。
5. **Pricing**：设为 **Free**（可不填金额，玩家直接玩）；如需支持可开启 "Allow payments" 设 0 美元起。
6. 把本文件「二、三」部分粘进页面正文，「一」「四」填进对应字段，发布即可。

> 注意：网页版存档在 itch 的 iframe 内，主流浏览器（Chrome / Edge / Firefox）均可用；Safari 对跨站 iframe 的 localStorage 较严格，如遇存档异常，建议下载同页的 Windows 桌面版获得最佳体验。

---

## 六、发布包清单（本仓库）

- `dist/仙途轮回诀-web-v1.1.0.zip` — 网页版（本文件所述，浏览器直接玩，138 KB）。
- `dist/仙途轮回诀-win64-v1.1.0.zip` — Windows 桌面版（exe，存档更稳，可选上架为第二个下载项）。

（两个 zip 均已在 `.gitignore` 中，不会进入 git 仓库，仅作本地分发用。）
