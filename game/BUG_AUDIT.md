# 仙途·轮回诀 — Bug & 不合理点审计报告

> 审查范围：config / save / cultivate / inventory / combat / explore / shop / ui / main 共 8 个 JS 文件 + index.html + style.css
> 审查结论：无语法错误（node --check 全过），但存在 1 个误导性功能失效（破障丹）+ 数个真实逻辑 bug + 若干显示/平衡问题。

---

## 🔴 高 / 中优先级（真实影响玩法）

### 1. 破障丹「使用」按钮浪费道具（功能失效）
- 位置：`js/inventory.js` `usePill` 的 `case 'breakBonus'`（约 273-277 行）+ `js/cultivate.js` `breakThrough`（约 108 行）
- 现象：在背包点「使用」破障丹，丹药消失，但突破时成功率**没加**。
- 根因：`usePill` 把消耗记到一个**从未被读取**的字段 `player.breakBonus`（全代码只写不读，grep 确认）；而真正的突破加成逻辑在 `breakThrough` 里读的是 `player.inventory.pill.p_breakthrough` 的数量。两条消耗路径冲突——「使用」既吞掉丹药、又填了孤儿字段，导致丹药被白白浪费。
- 修复：让 `breakThrough` 改用 `player.breakBonus`（并在 defaultPlayer 初始化），或删掉 `usePill` 里的 breakBonus 分支、改为仅允许“持有即自动消耗”（当前自动消耗路径其实是对的，只是「使用」按钮不能点）。

### 2. 土盾术（与防御类 buff）在敌方回合完全不生效
- 位置：`js/combat.js` `enemyTurn`（约 305-307 行）
- 现象：玩家用「土盾术」给自己加防御 buff，敌方攻击时扣血**一点没少**。
- 根因：`enemyTurn` 计算伤害只用了扁平 `player.def`，**没有读取 `player.buffs` 里的 `type:'def'`**（而 `dealDamage` 里防守方 buff 是会生效的）。所以土盾术这类“自身防御 buff”形同虚设。
- 修复：`enemyTurn` 计算 `dmg` 前，把 `player.buffs` 中 `type==='def'` 叠加进防御（与 `dealDamage` 守方处理一致）。

### 3. 宝箱「谨慎检查」灵石双倍发放
- 位置：`js/explore.js` `openTreasure` 的 `treasure_safe` 分支（约 313 行 与 324 行）
- 现象：选「谨慎检查」开宝箱，约 70% 概率灵石**发两次**（多给一倍）。
- 根因：313 行先 `player.stone += stoneReward`，随后 324 行又 `player.stone += stoneReward`（两次都走普通/深海之外的路径）。`treasure`/`treasure_deep` 分支没有这个问题。
- 修复：删掉 313 行那次提前加的灵石（只保留 324 行的统一发放）。

### 4. 矿洞坍塌「损失气血」无效
- 位置：`js/explore.js` `handleChoice` 的 `case 'hp_loss'`（约 195 行）+ 全代码
- 现象：探索选「紧急逃出」扣 30 气血，但实际**毫无影响**。
- 根因：`player.tempHpDebuff` 被写入，但全代码**从未被读取**（grep 确认只写不读）。
- 修复：要么在 `startBattle` 里把 `tempHpDebuff` 从 `maxHp` 扣除（真正生效），要么把该事件改成直接扣灵石/修为，或干脆用一个已生效的字段（如 `tempHpBuff` 思路）。

### 5. 随机/强敌战斗可能选中「当前打不过」的敌人
- 位置：`js/explore.js` `triggerRandomCombat`（约 246 行）/ `triggerHardCombat`（约 260 行）+ `js/combat.js` `startBattle` 门槛（约 19 行）
- 现象：点「妖兽袭击 / 上古凶兽 / 仙人指路」时，偶尔只弹一句「境界不足，无法挑战」就结束了，什么都没发生。
- 根因：`triggerRandomCombat` 的候选过滤**没有校验同境界下的层数**；`triggerHardCombat` 过滤写了 `enemy.realmIdx <= player.realmIdx + 1`，但 `startBattle` 要求 `enemy.realmIdx <= player.realmIdx`（高一层直接被拒）。所以会筛出“打不过”的敌人 → 战斗起不来。
- 修复：候选过滤与 `startBattle` 门槛严格对齐——`triggerRandomCombat` 必须保证 `realmIdx<=player 且（同境界时层<=player层）`；`triggerHardCombat` 上限改为 `enemy.realmIdx <= player.realmIdx`（去掉 +1），或干脆只对“当前境界内更高层”做强化。

### 6. 离线收益可重复领取
- 位置：`js/save.js` `applyOfflineReward`（约 243 行）
- 现象：两次刷新间隔很短（自动存档 30 秒窗口内）时，离线修为会被**再结算一次**。
- 根因：`applyOfflineReward` 加了修为后**没有更新 `player.lastSave`**（只更新了 `lastOffline`）。下次 `calcOfflineReward` 仍用旧的 `lastSave`，把上一段离线时长又算进去了。
- 修复：函数末尾 `player.lastSave = Date.now();`（或顺手 `SaveSystem.save(player)`）。

---

## 🟡 低优先级（显示 / 平衡 / 体验）

### 7. 灵力显示写成「ling / ling」（同值重复）
- 位置：`js/ui.js` 第 136 行（`topLing`）、第 556 行（`attrLing`）
- 现象：顶栏与属性面板的灵力永远显示成「250/250」这种“满值分数”。
- 根因：模板字符串写成 `${stats.ling}/${stats.ling}`，分子分母都是同一个值。
- 修复：直接显示 `fmtNum(stats.ling)`（灵力是总额资源，不是 0~100% 进度条）；第 555 行 `attrHp` 的 `hp/hp` 同理可一并改为只显示数值。

### 8. 法宝激发不校验灵力
- 位置：`js/combat.js` `useFabao`（约 167 行）
- 现象：灵力不足也能点法宝，灵力会被扣成负数。
- 修复：激发前加 `if (player.ling < fs.cost) { toast('灵力不足'); return; }`。

### 9. 反弹/护盾持续整场，与「回合」描述不符
- 位置：`js/combat.js` `endTurn` 只递减 `fabaoCd/petCd/技能cd/buff 回合数`，但 `player.reflect`、`player.shield`（法宝/灵宠给的）**不在回合递减逻辑里**。
- 影响：阴阳镜「反弹 2 回合」、灵宠护盾实际整场战斗都有效，与描述不符。属能力偏强，低优先。

### 10. 丹药 buff「3 回合」永不衰减
- 位置：`js/inventory.js` `usePill` 的 `buff_atk/buff_def` + `js/combat.js` `startBattle`
- 现象：虎力丹/金刚丹的「+攻击（3回合）」进战斗后**直接拉平成固定值，整场不变**，战后删除。
- 说明：能力上没坏，只是与「回合」措辞不符，属文案/设计小瑕疵。

### 11. 灵宠击杀不立即结算
- 位置：`js/combat.js` `petAction`（约 260 行）
- 现象：灵宠补刀打死敌人后，敌方血条短暂显示负数，要等玩家下一次行动才弹胜利。
- 修复：`petAction` 末尾补 `this.checkEnd();`。

### 12. 装备强化上限 10 vs 神通上限 100 不一致 + 强化系数两处不同
- 位置：`js/inventory.js` `enhance` 上限 `curEnhance >= 10`（约 172 行）；`calcFinalStats` 用 `enhance*0.15`（cultivate.js:277），`getRateDetail`/`calcCultivateRate` 用 `enhance*0.1`（cultivate.js:28 / save.js:229）。
- 说明：你之前要求“神通等级上限拉到 100”已落实（技能 100）；装备强化仍是 10，属两套独立系统。若你希望装备也 100，需改；另外装备灵力加成在“修炼速率公式”用 0.1、“属性公式”用 0.15，两处系数不一致，建议统一。

### 13. 配置掉落率浮点噪声
- 位置：`js/config.js` 多处 `rate: 0.15000000000000002`
- 说明：`0.15` 的浮点存储噪声，功能无碍，只是难看，建议改成 `0.15`。

---

## 🟢 设计 / 平衡提示（非 bug，供参考）
- **大境界突破成本偏小**：`getBreakthroughCost` 对“大境界跨越”和“当前境界末层小突破”算出来**完全一样**（都用 `baseXiu * mult^(layers-1)`）。即练气 15→筑基 1 和练气 14→15 花费几乎相同，大境界跨越显得太便宜。
- **探索随机摊位可重复**：`triggerRandomShop` 用“可重复随机”抽 3 件，`allItems` 里可能同一物品出现两次。
- **后期数值跨度极大**：炼虚→道祖的 xiuReward 从 400 万跃到 24 亿，叠加你要求的悟性 ×10000 后极易数字爆表（属你认可的方向，仅提示）。

---

## 验证方式
- `node --check` 对 8 个 JS 文件全部通过（无语法错误）。
- 字段“只写不读”通过全仓 grep `breakBonus` / `tempHpDebuff` 确认（仅写入点，无读取点）。

---

## ✅ 已修复（2026-07-20 全修）

> 全部 13 项已修复并通过 `node --check`。改动文件：config / save / cultivate / combat / explore / ui。

| # | 问题 | 修复要点 | 文件 |
|---|---|---|---|
| 1 | 破障丹「使用」浪费 | `breakThrough` 现在读取 `player.breakBonus`（手动使用累积的加成），与库存自动消耗合并后计入成功率并清零 | cultivate.js |
| 2 | 土盾术敌方回合失效 | `enemyTurn` 计算伤害时叠加 `player.buffs` 的 `type:'def'`（与 `dealDamage` 守方一致） | combat.js |
| 3 | 宝箱「谨慎检查」灵石双倍 | 删掉提前那次加灵石，仅在 70% 普通路径统一发放；30% 仅灵石分支自行加一次 | explore.js |
| 4 | 矿洞掉血无效 | `startBattleWithEnemy` 用 `tempHpDebuff` 扣减本场初始气血（一次性，开战即清） | combat.js |
| 5 | 随机/强敌选不中可战敌人 | `triggerRandomCombat`/`triggerHardCombat` 增加 `canFight` 门槛过滤，与 `startBattle` 严格对齐；强敌按 realm/layer 降序挑最难的（仍可胜） | explore.js |
| 6 | 离线收益重复领取 | `applyOfflineReward` 末尾补 `player.lastSave = Date.now()` | save.js |
| 7 | 灵力/气血显示同值重复 | 顶栏与属性面板改为 `fmtNum(stats.ling/hp)` 直接显示数值 | ui.js |
| 8 | 法宝不校验灵力 | `useFabao` 激发前 `if (player.ling < fs.cost)` 拦截 | combat.js |
| 9 | 反弹/护盾整场不衰减 | 状态新增 `shieldTurns`/`reflectTurns`，激发时写入回合数；`endTurn` 每回合递减，归零清除 | combat.js |
| 10 | 丹药 buff「3回合」不衰减 | 进战斗时把 `tempBuffAtk/Def` 转为 `player.buffs` 条目（带 turns），随回合正常递减 | combat.js |
| 11 | 灵宠击杀不立即结算 | `petAction` 末尾补 `this.checkEnd()` | combat.js |
| 12 | 强化系数 0.1/0.15 不一致 | `getRateDetail` 与 `calcCultivateRate` 统一为 `0.15`（与 `calcFinalStats` 一致）。装备强化上限维持 10（与神通 100 是两套独立系统，属设计非 bug，未改） | cultivate.js / save.js |
| 13 | 掉落率浮点噪声 | `0.15000000000000002` 全部改为 `0.15` | config.js |

**未改动项**：装备强化上限 10（#12 设计层面，非 bug，等你确认是否要拉到 100）。
