/* ============================================
   分身/化身 — 大道以上解锁
   "一气化三清"：最多 3 个化身，自动向 zhanli 池注水
   化身不进战斗属性，只给 zhanli 加成（独立增益，不污染战斗流水线）
   初始 rate 0.5%，随化身等级提升
   ============================================ */
const Avatars = {
    UNLOCK_IDX: 63,
    MAX_AVATARS: 3,
    BASE_RATE: 0.005,   // 0.5% 主修炼速率
    PER_LVL_RATE: 0.005, // 每级 +0.5%
    MAX_LVL: 50,
    CREATE_COST: 1e10,   // 创建化身成本

    init(player) {
        if (!player.avatars) player.avatars = [];
    },
    rateOf(av) {
        return this.BASE_RATE + (av.lv - 1) * this.PER_LVL_RATE;
    },
    /* 升级成本 */
    upCost(av) {
        return Math.floor(1e8 * Math.pow(2, av.lv - 1));
    },
    canCreate(player) {
        if (!player) return { ok: false, reason: '无玩家' };
        if (player.realmIdx < this.UNLOCK_IDX) return { ok: false, reason: '需大道境界' };
        if (!player.avatars) return { ok: false };
        if (player.avatars.length >= this.MAX_AVATARS) return { ok: false, reason: `最多 ${this.MAX_AVATARS} 个化身` };
        if ((player.stone || 0) < this.CREATE_COST) return { ok: false, reason: `需${fmtNum(this.CREATE_COST)}灵石` };
        return { ok: true, cost: this.CREATE_COST };
    },
    create(player) {
        const r = this.canCreate(player);
        if (!r.ok) return r;
        player.stone -= r.cost;
        player.avatars.push({ id: Date.now() + Math.floor(Math.random() * 1000), lv: 1, total: 0 });
        return { ok: true };
    },
    canUpgrade(player, av) {
        if (!player || !av) return { ok: false, reason: '参数错误' };
        if (av.lv >= this.MAX_LVL) return { ok: false, reason: '已至顶' };
        const c = this.upCost(av);
        if ((player.stone || 0) < c) return { ok: false, reason: `需${fmtNum(c)}灵石` };
        return { ok: true, cost: c };
    },
    upgrade(player, av) {
        const r = this.canUpgrade(player, av);
        if (!r.ok) return r;
        player.stone -= r.cost;
        av.lv++;
        return { ok: true, lv: av.lv };
    },

    /* 闭关循环每 tick 调用：所有化身向 zhanli 池注水，返回总注水量 */
    tick(player) {
        if (player.realmIdx < this.UNLOCK_IDX || !player.avatars || !player.avatars.length) return 0;
        // 主修炼速率：复用 SaveSystem.calcCultivateRate（无依赖时回退到 0）
        const mainRate = (typeof SaveSystem !== 'undefined' && SaveSystem.calcCultivateRate)
            ? SaveSystem.calcCultivateRate(player) : 0;
        let add = 0;
        for (const av of player.avatars) {
            const inc = mainRate * this.rateOf(av);
            add += inc;
            av.total = (av.total || 0) + inc;
        }
        return add;
    }
};
if (typeof module !== 'undefined' && module.exports) module.exports = { Avatars };
