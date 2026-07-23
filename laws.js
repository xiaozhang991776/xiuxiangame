/* ============================================
   法则领悟 — 大道以上解锁
   6 条法则 × 5 阶（未入门→圆满），每条独立乘数
   总 lawMult = ∏ 各法则乘数（独立乘区，不互相稀释）
   ============================================ */
const Laws = {
    UNLOCK_IDX: 63, // 大道以上才能升阶
    DEFS: [
        { id: 'sword',   name: '剑之法则', icon: '🗡', mults: [1, 1.10, 1.25, 1.50, 2.00], stone: [1e6, 1e7, 1e8, 1e9],  wuxingNeed: 5  },
        { id: 'dan',     name: '丹之法则', icon: '⚗', mults: [1, 1.08, 1.20, 1.40, 1.80], stone: [8e5, 8e6, 8e7, 8e8],  wuxingNeed: 5  },
        { id: 'zhen',    name: '阵之法则', icon: '⚝', mults: [1, 1.08, 1.20, 1.40, 1.80], stone: [8e5, 8e6, 8e7, 8e8],  wuxingNeed: 5  },
        { id: 'space',   name: '时空法则', icon: '⌛',mults: [1, 1.12, 1.30, 1.60, 2.20], stone: [2e6, 2e7, 2e8, 2e9],  wuxingNeed: 8  },
        { id: 'fate',    name: '因果法则', icon: '☯', mults: [1, 1.10, 1.25, 1.50, 2.00], stone: [1e6, 1e7, 1e8, 1e9],  wuxingNeed: 5  },
        { id: 'rebirth', name: '轮回法则', icon: '☸', mults: [1, 1.15, 1.35, 1.70, 2.30], stone: [3e6, 3e7, 3e8, 3e9],  wuxingNeed: 10 }
    ],
    TIER_NAMES: ['未入门', '入门', '小成', '大成', '圆满'],

    /* 初始化玩家法则字段（migrate 友好） */
    init(player) {
        if (!player.laws) player.laws = {};
    },
    getLevel(player, def) {
        return (player.laws && player.laws[def.id]) || 0;
    },
    tierName(lv) { return this.TIER_NAMES[Math.min(lv, this.TIER_NAMES.length - 1)]; },

    /* 总法则乘区 = 各条法则乘数连乘（独立乘区） */
    totalMult(player) {
        let m = 1;
        for (const def of this.DEFS) {
            const lv = this.getLevel(player, def);
            if (lv > 0) m *= def.mults[Math.min(lv, def.mults.length - 1)];
        }
        return m;
    },

    /* 升阶可行性 */
    canUpgrade(player, def) {
        if (!player) return { ok: false, reason: '无玩家' };
        if (player.realmIdx < this.UNLOCK_IDX) return { ok: false, reason: '需大道境界' };
        const lv = this.getLevel(player, def);
        if (lv >= def.mults.length - 1) return { ok: false, reason: '已圆满' };
        const need = def.stone[lv] || 0;
        if ((player.stone || 0) < need) return { ok: false, reason: `需${fmtNum(need)}灵石` };
        if ((player.wuxingLevel || 0) < def.wuxingNeed) return { ok: false, reason: `需悟性${def.wuxingNeed}级` };
        return { ok: true, need };
    },
    upgrade(player, def) {
        const r = this.canUpgrade(player, def);
        if (!r.ok) return r;
        player.stone -= r.need;
        if (!player.laws) player.laws = {};
        player.laws[def.id] = this.getLevel(player, def) + 1;
        return { ok: true, newLevel: player.laws[def.id] };
    }
};
if (typeof module !== 'undefined' && module.exports) module.exports = { Laws };
