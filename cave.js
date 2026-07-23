/* ============================================
   洞天福地 — 大道以上解锁
   3 个子洞天（灵脉/药田/悟道崖）独立升级
   - 灵脉：被动产出灵石/秒
   - 药田：被动产出悟性/小时
   - 悟道崖：被动产出悟性经验/小时
   caveMult = 1 + 0.08×灵脉 + 0.05×药田 + 0.10×悟道崖
   ============================================ */
const Cave = {
    UNLOCK_IDX: 32, // 大道以上解锁（大道在 realms 数组中的真实 idx=32）
    MAX_LVL: 20,
    SUB: [
        { id: 'lingmai', name: '灵脉',   icon: '⛰', desc: '产出灵石/秒',      perLvl: 0.08, base: 100, exp: 1.5 },
        { id: 'yaotian', name: '药田',   icon: '🌱', desc: '产出悟性/小时',   perLvl: 0.05, base: 0.5,  exp: 1.0 },
        { id: 'wudaoya', name: '悟道崖', icon: '☯', desc: '产出悟性经验/小时',perLvl: 0.10, base: 1.0,  exp: 1.0 }
    ],

    init(player) {
        if (!player.cave) player.cave = { lingmai: 1, yaotian: 1, wudaoya: 1 };
    },
    sub(player, id) { return this.SUB.find(s => s.id === id) || this.SUB[0]; },
    getLv(player, subId) { return (player.cave && player.cave[subId]) || 1; },

    /* 总洞天乘区（独立乘区） */
    totalMult(player) {
        if (!player.cave) return 1;
        let m = 1;
        for (const s of this.SUB) m += (player.cave[s.id] || 1) * s.perLvl;
        return m;
    },

    /* 升级成本 */
    upCost(player, sub) {
        const lv = this.getLv(player, sub.id);
        if (lv >= this.MAX_LVL) return null;
        return Math.floor(5000 * Math.pow(2.5, lv - 1));
    },
    canUpgrade(player, sub) {
        if (!player) return { ok: false, reason: '无玩家' };
        if (player.realmIdx < this.UNLOCK_IDX) return { ok: false, reason: '需大道境界' };
        if (!player.cave) return { ok: false, reason: '未开洞天' };
        const lv = player.cave[sub.id] || 1;
        if (lv >= this.MAX_LVL) return { ok: false, reason: '已至顶' };
        const c = this.upCost(player, sub);
        if ((player.stone || 0) < c) return { ok: false, reason: `需${fmtNum(c)}灵石` };
        return { ok: true, cost: c };
    },
    upgrade(player, sub) {
        const r = this.canUpgrade(player, sub);
        if (!r.ok) return r;
        player.stone -= r.cost;
        player.cave[sub.id]++;
        return { ok: true, level: player.cave[sub.id] };
    },

    /* 被动产出（/秒，闭关循环按 dt 折算） */
    producePerSec(player) {
        if (player.realmIdx < this.UNLOCK_IDX || !player.cave) return { stone: 0, wuxing: 0, wuxingExp: 0 };
        const lm = this.getLv(player, 'lingmai');
        const ya = this.getLv(player, 'yaotian');
        const wd = this.getLv(player, 'wudaoya');
        const lmDef = this.sub(player, 'lingmai');
        const yaDef = this.sub(player, 'yaotian');
        const wdDef = this.sub(player, 'wudaoya');
        return {
            stone:     Math.floor(lmDef.base * lm * Math.pow(lmDef.exp, lm - 1)),
            wuxing:    0, // 悟性等级通过 wuxingExp 累加：满一定量升级由 ui.js 触发或自动
            wuxingExp: (ya * yaDef.base + wd * wdDef.base) / 3600 // /小时 → /秒
        };
    }
};
if (typeof module !== 'undefined' && module.exports) module.exports = { Cave };
