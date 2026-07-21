/* ============================================
   仙途·轮回诀 — 仙途主线（境界里程碑剧情）
   突破大境界即解锁对应章节：弹窗叙事 + 发放奖励；
   新开「主线」标签页可随时回看。旧档载入静默补齐已达成章节。
   ============================================ */

const MainStory = {
    /* ---------- 取得章节列表（含玩家状态） ---------- */
    getChapters(player) {
        const list = (typeof GameConfig !== 'undefined' && GameConfig.mainStory) || [];
        if (!player.mainStory) player.mainStory = { currentIdx: 0, seen: {}, claimed: {} };
        return list.map((ch, i) => {
            const unlocked = player.realmIdx >= ch.realmReq;
            const seen = !!player.mainStory.seen[ch.id];
            const claimed = !!player.mainStory.claimed[ch.id];
            const realmName = (typeof getRealm === 'function' && GameConfig.realms[ch.realmReq]) ? GameConfig.realms[ch.realmReq].name : '';
            return { ...ch, index: i, unlocked, seen, claimed, realmName };
        });
    },

    /* ---------- 突破大境界后调用：解锁并弹出「刚好达成」的那一章 ---------- */
    onBreakthrough(player) {
        if (!player.mainStory) player.mainStory = { currentIdx: 0, seen: {}, claimed: {} };
        const list = (typeof GameConfig !== 'undefined' && GameConfig.mainStory) || [];
        // realmReq === player.realmIdx 的章节 = 本次刚突破到达的这一大境界
        list.filter(ch => ch.realmReq === player.realmIdx)
            .forEach(ch => this._unlock(player, ch, true));
        if (typeof SaveSystem !== 'undefined') SaveSystem.save(player);
    },

    /* ---------- 游戏载入/旧档迁移时调用：静默补齐已达成章节（不弹窗，避免刷屏） ---------- */
    checkInitial(player) {
        if (!player.mainStory) player.mainStory = { currentIdx: 0, seen: {}, claimed: {} };
        const list = (typeof GameConfig !== 'undefined' && GameConfig.mainStory) || [];
        list.forEach(ch => {
            if (player.realmIdx >= ch.realmReq && !player.mainStory.seen[ch.id]) {
                // 载入即已达此境：标记已阅、奖励视作已领（不重复发放、不弹窗）
                player.mainStory.seen[ch.id] = true;
                player.mainStory.claimed[ch.id] = true;
            }
        });
    },

    /* ---------- 新游戏开场：弹出首章作为序章（发奖 + 弹窗） ---------- */
    intro(player) {
        if (!player.mainStory) player.mainStory = { currentIdx: 0, seen: {}, claimed: {} };
        const list = (typeof GameConfig !== 'undefined' && GameConfig.mainStory) || [];
        const ch0 = list.find(c => c.realmReq === 0) || list[0];
        if (ch0) this._unlock(player, ch0, true);
        if (typeof SaveSystem !== 'undefined') SaveSystem.save(player);
    },

    /* ---------- 内部：解锁一章（发奖一次 + 可选弹窗） ---------- */
    _unlock(player, ch, popup) {
        if (!player.mainStory) player.mainStory = { currentIdx: 0, seen: {}, claimed: {} };
        if (player.mainStory.seen[ch.id]) return; // 已解锁过，跳过
        player.mainStory.seen[ch.id] = true;
        if (!player.mainStory.claimed[ch.id]) {
            this._grant(player, ch);
            player.mainStory.claimed[ch.id] = true;
        }
        if (popup && typeof UI !== 'undefined') UI.showMainStory(ch, false);
    },

    /* ---------- 内部：发放章节奖励 ---------- */
    _grant(player, ch) {
        const r = ch.reward || {};
        if (r.stone) player.stone = (player.stone || 0) + r.stone;
        if (r.xiu) {
            player.xiu = (player.xiu || 0) + r.xiu;
            player.stats.totalXiu = (player.stats.totalXiu || 0) + r.xiu;
        }
        if (r.items && typeof Inventory !== 'undefined') {
            r.items.forEach(it => Inventory.addItem(player, it.id, it.count));
        }
    },

    /* ---------- 面板回看：弹出某章叙事（不再发奖） ---------- */
    replay(player, id) {
        const list = (typeof GameConfig !== 'undefined' && GameConfig.mainStory) || [];
        const ch = list.find(c => c.id === id);
        if (ch && typeof UI !== 'undefined') UI.showMainStory(ch, true);
    }
};
