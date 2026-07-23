/* ============================================
   仙途·轮回诀 — 天赋系统
   天赋点 · 六系天赋树 · 被动加成（属性/修炼/灵石/战斗）
   在 config.js 之后、其余模块之前加载
   ============================================ */

// 天赋配置：六系，每系若干天赋；per 为每级加成（小数即百分比，如 0.04 = 每级 +4%）
// stat 取值：atk/def/hp/ling/spd/crit（属性，乘区或暴击平加） |
//            xiuRate/stoneRate/pet（乘区倍率） |
//            dmgDeal/dmgReduce/breakRate/tribRate（战斗与机缘的平加）
const TALENT_DEFS = [
    // 攻伐系
    { id: 't_atk',   branch: '攻伐', icon: '⚔', name: '破军',   max: 10, effect: { stat: 'atk', per: 0.04 },  desc: '攻击 +4%/级' },
    { id: 't_crit',  branch: '攻伐', icon: '✦', name: '锐芒',   max: 10, effect: { stat: 'crit', per: 0.02 }, desc: '暴击率 +2%/级' },
    // 守御系
    { id: 't_def',   branch: '守御', icon: '🛡', name: '铁壁',   max: 10, effect: { stat: 'def', per: 0.05 },  desc: '防御 +5%/级' },
    { id: 't_hp',    branch: '守御', icon: '❤', name: '血海',   max: 10, effect: { stat: 'hp', per: 0.04 },   desc: '气血 +4%/级' },
    // 长生系
    { id: 't_ling',  branch: '长生', icon: '☯', name: '灵渊',   max: 10, effect: { stat: 'ling', per: 0.05 }, desc: '灵力 +5%/级' },
    { id: 't_sp',    branch: '长生', icon: '🌪', name: '疾风',   max: 10, effect: { stat: 'spd', per: 0.04 },  desc: '速度 +4%/级' },
    // 悟道系
    { id: 't_xiu',   branch: '悟道', icon: '📜', name: '明悟',   max: 10, effect: { stat: 'xiuRate', per: 0.04 }, desc: '修炼速率 +4%/级' },
    { id: 't_stone', branch: '悟道', icon: '💎', name: '点石',   max: 10, effect: { stat: 'stoneRate', per: 0.05 }, desc: '灵石获取 +5%/级' },
    // 御兽系
    { id: 't_pet',   branch: '御兽', icon: '🐾', name: '驭兽',   max: 10, effect: { stat: 'pet', per: 0.06 },     desc: '出战灵宠属性 +6%/级' },
    // 天命系
    { id: 't_break', branch: '天命', icon: '🔓', name: '通玄',   max: 10, effect: { stat: 'breakRate', per: 0.03 }, desc: '突破成功率 +3%/级' },
    { id: 't_trib',  branch: '天命', icon: '⚡', name: '逆命',   max: 10, effect: { stat: 'tribRate', per: 0.04 },  desc: '渡劫成功率 +4%/级' },
    { id: 't_dmg',   branch: '天命', icon: '💥', name: '戮仙',   max: 10, effect: { stat: 'dmgDeal', per: 0.04 },   desc: '斗法伤害 +4%/级' },
    { id: 't_guard', branch: '天命', icon: '🛡', name: '护身',   max: 10, effect: { stat: 'dmgReduce', per: 0.03 }, desc: '受到伤害 -3%/级' }
];

const Talent = {
    /* 天赋点（突破大境界 +3，每满 5 小境界 +1） */
    grant(player, n) {
        if (!player.talents) player.talents = { pts: 0, learned: {} };
        player.talents.pts += n;
        if (typeof Sound !== 'undefined' && n >= 3) Sound.play('levelup');
    },
    pts(player) { return (player.talents && player.talents.pts) || 0; },
    level(player, id) { return (player.talents && player.talents.learned && player.talents.learned[id]) || 0; },
    def(id) { return TALENT_DEFS.find(t => t.id === id); },

    /* 学习/升级某天赋：每级消耗 1 天赋点 */
    learn(player, id) {
        const t = this.def(id);
        if (!t) return false;
        if (this.level(player, id) >= t.max) { if (typeof UI !== 'undefined') UI.toast('该天赋已满级', 'bad'); return false; }
        if (this.pts(player) < 1) { if (typeof UI !== 'undefined') UI.toast('天赋点不足', 'bad'); return false; }
        if (!player.talents) player.talents = { pts: 0, learned: {} };
        player.talents.pts -= 1;
        player.talents.learned[id] = this.level(player, id) + 1;
        if (typeof Cultivate !== 'undefined') Cultivate.save(player);
        if (typeof UI !== 'undefined') {
            UI.toast(`修习天赋「${t.name}」至 ${player.talents.learned[id]} 级`, 'gold');
            UI.addLog(`禀天赋「${t.name}」至 ${player.talents.learned[id]} 重`, 'evt');
        }
        return true;
    },

    /* 汇总某 stat 的总加成（level × per 之和） */
    sum(player, stat) {
        if (!player.talents || !player.talents.learned) return 0;
        let s = 0;
        TALENT_DEFS.forEach(t => {
            if (t.effect.stat === stat) s += (player.talents.learned[t.id] || 0) * t.effect.per;
        });
        return s;
    },

    /* 乘区倍率 */
    xiuRateMult(player)  { return 1 + this.sum(player, 'xiuRate'); },
    stoneRateMult(player) { return 1 + this.sum(player, 'stoneRate'); },
    petBonusMult(player)  { return 1 + this.sum(player, 'pet'); },
    dmgDealMult(player)  { return 1 + this.sum(player, 'dmgDeal'); },
    dmgReduce(player)    { return Math.min(0.8, this.sum(player, 'dmgReduce')); },
    breakRateAdd(player)  { return this.sum(player, 'breakRate'); },
    tribChanceAdd(player){ return this.sum(player, 'tribRate'); },

    /* 把天赋加成应用到最终属性对象（atk/def/hp/ling/spd/crit） */
    applyStats(stats, player) {
        if (!player.talents) return stats;
        const m = (stat) => 1 + this.sum(player, stat);
        stats.atk  = Math.floor(stats.atk  * m('atk'));
        stats.def  = Math.floor(stats.def  * m('def'));
        stats.hp   = Math.floor(stats.hp   * m('hp'));
        stats.ling = Math.floor(stats.ling * m('ling'));
        stats.spd  = Math.floor(stats.spd  * m('spd'));
        stats.crit = stats.crit + this.sum(player, 'crit');
        return stats;
    }
};

// 注入配置（config.js 已先加载）
if (typeof GameConfig !== 'undefined' && !GameConfig.talents) {
    GameConfig.talents = TALENT_DEFS;
}
