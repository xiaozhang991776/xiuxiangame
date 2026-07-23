/* ============================================
   本命法宝 — 大道以上解锁
   5 种法宝 × 30 级；大额乘区 + 独特战斗效果
   treasureMult = 1 + (level-1) × perLvl，独立乘区
   战斗效果（lifesteal/reflect/shield/firstStrike/trueDmg）由 Combat 接入
   ============================================ */
const Treasure = {
    UNLOCK_IDX: 32, // 大道以上解锁（大道在 realms 数组中的真实 idx=32）
    MAX_LEVEL: 30,
    TYPES: [
        { id: 'sword',   name: '本命飞剑', icon: '🗡', perLvl: 0.30, effect: 'lifesteal',    effectDesc: '攻击回血 15%' },
        { id: 'seal',    name: '本命宝印', icon: '☩', perLvl: 0.25, effect: 'reflect',      effectDesc: '反弹 30% 伤害' },
        { id: 'bell',    name: '本命神钟', icon: '🔔', perLvl: 0.28, effect: 'shield',       effectDesc: '每回合+10%HP 护盾' },
        { id: 'pagoda',  name: '本命宝塔', icon: '🗼', perLvl: 0.32, effect: 'firstStrike',  effectDesc: '先手增伤 30%' },
        { id: 'pearl',   name: '本命元珠', icon: '◎', perLvl: 0.26, effect: 'trueDmg',      effectDesc: '无视防御真伤 10%' }
    ],
    DEFAULT_TYPE: 'sword',

    init(player) {
        if (!player.treasure) player.treasure = { type: this.DEFAULT_TYPE, level: 1 };
    },
    def(player) {
        if (!player.treasure) return this.TYPES[0];
        return this.TYPES.find(t => t.id === player.treasure.type) || this.TYPES[0];
    },
    /* 乘区：1 + (level-1) × perLvl */
    mult(player) {
        if (!player.treasure) return 1;
        const d = this.def(player);
        return 1 + (player.treasure.level - 1) * d.perLvl;
    },
    /* 祭炼成本：随等级指数 */
    cost(player) {
        const lv = player.treasure ? player.treasure.level : 1;
        return Math.floor(1000 * Math.pow(3, lv - 1));
    },
    canRefine(player) {
        if (!player) return { ok: false, reason: '无玩家' };
        if (player.realmIdx < this.UNLOCK_IDX) return { ok: false, reason: '需大道境界' };
        if (!player.treasure) return { ok: false, reason: '未拥有本命法宝' };
        if (player.treasure.level >= this.MAX_LEVEL) return { ok: false, reason: '已至圆满' };
        const c = this.cost(player);
        if ((player.stone || 0) < c) return { ok: false, reason: `需${fmtNum(c)}灵石` };
        return { ok: true, cost: c };
    },
    refine(player) {
        const r = this.canRefine(player);
        if (!r.ok) return r;
        player.stone -= r.cost;
        player.treasure.level++;
        return { ok: true, level: player.treasure.level };
    }
};
if (typeof module !== 'undefined' && module.exports) module.exports = { Treasure };
