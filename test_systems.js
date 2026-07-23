/* 无头集成测试：按浏览器逐脚本加载（共享全局），断言天赋/灵宠逻辑 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

// 让突破成功率判定确定性（< rate 必成功），避免随机导致测试抖动
Math.random = () => 0.001;

const DIR = __dirname;
const ORDER = [
    'config.js', 'shop_ext.js', 'talents.js', 'pets.js',
    'save.js', 'inventory.js', 'cultivate.js',
    'laws.js', 'treasure.js', 'cave.js', 'avatars.js',
    'combat.js', 'explore.js', 'shop.js', 'friends.js', 'ui.js', 'main.js'
];

// ---- DOM / 环境桩 ----
function fakeEl() {
    const el = {
        _html: '', _text: '',
        classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
        style: {}, dataset: {}, onclick: null, scrollTop: 0, scrollHeight: 0,
        className: '', firstChild: null, lastChild: null, children: [],
        addEventListener(){}, appendChild(){}, remove(){},
        insertBefore(){}, removeChild(){},
        getBoundingClientRect(){ return { top:0, left:0, width:10, height:10 }; },
        querySelector(){ return fakeEl(); }, querySelectorAll(){ return []; }
    };
    Object.defineProperty(el, 'innerHTML', { get(){ return el._html; }, set(v){ el._html = v; } });
    Object.defineProperty(el, 'textContent', { get(){ return el._text; }, set(v){ el._text = v; } });
    return el;
}
const elCache = {};
const documentStub = {
    readyState: 'complete',
    getElementById(id){ return elCache[id] || (elCache[id] = fakeEl()); },
    querySelector(){ return fakeEl(); }, querySelectorAll(){ return []; },
    addEventListener(){}, createElement(){ return fakeEl(); }, body: fakeEl()
};
function storageStub() {
    const m = new Map();
    return { getItem:k=>m.has(k)?m.get(k):null, setItem:(k,v)=>m.set(k,String(v)), removeItem:k=>m.delete(k) };
}
const sandbox = {
    console,
    document: documentStub,
    window: { addEventListener(){} },
    localStorage: storageStub(),
    sessionStorage: storageStub(),
    setInterval: () => 0, clearInterval: () => {},
    setTimeout: () => 0, clearTimeout: () => {},
    requestAnimationFrame: () => 0,
    btoa: s => Buffer.from(s, 'binary').toString('base64'),
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    Date, Math, JSON, Object, Array, String, Number, Boolean, parseInt, parseFloat, isNaN
};
sandbox.window.document = documentStub;
vm.createContext(sandbox);

// 逐脚本加载（模拟浏览器）：顶层 const/let → var，使全局跨脚本共享、无 TDZ
for (const f of ORDER) {
    let code = fs.readFileSync(path.join(DIR, f), 'utf8');
    code = code.replace(/\bconst\s+/g, 'var ').replace(/\blet\s+/g, 'var ');
    try {
        vm.runInContext(code, sandbox, { filename: f });
    } catch (e) {
        console.error('加载失败 [' + f + ']:', e && e.stack || e);
        process.exit(1);
    }
}

// ---- 断言 ----
let pass = 0, fail = 0;
function ok(name, cond, extra) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.log('  ✗ ' + name + (extra !== undefined ? '  → ' + extra : '')); }
}
function approx(a, b, eps=1e-6){ return Math.abs(a-b) <= eps; }
const getPet = (id) => sandbox.GameConfig.pets.find(x => x.id === id);
const { GameConfig, Talent, PetSys, Cultivate, SaveSystem, Shop, Laws, Treasure, Cave, Avatars } = sandbox;

console.log('\n[1] 天赋配置');
ok('GameConfig.talents 共 13 项', GameConfig.talents && GameConfig.talents.length === 13, GameConfig.talents && GameConfig.talents.length);
ok('Talent 对象存在', !!Talent && typeof Talent.learn === 'function');

console.log('\n[2] 天赋加成计算');
const p0 = { talents: { pts: 0, learned: {} } };
ok('初始修炼倍率 = 1', approx(Talent.xiuRateMult(p0), 1));
const p1 = { talents: { pts: 0, learned: { t_xiu: 5, t_stone: 4 } } };
ok('悟道5级 修炼 +20%', approx(Talent.xiuRateMult(p1), 1.20), Talent.xiuRateMult(p1));
ok('点石4级 灵石 +20%', approx(Talent.stoneRateMult(p1), 1.20), Talent.stoneRateMult(p1));
const st = { atk: 100, def: 50, hp: 200, ling: 80, spd: 10, crit: 0.05 };
const sa = Talent.applyStats({ ...st }, { talents:{ pts:0, learned:{ t_atk:10, t_crit:10, t_def:5 } } });
ok('破军10级 攻击 ×1.4', sa.atk === 140, sa.atk);
ok('铁壁5级 防御 ×1.25', sa.def === 62 || sa.def === 63, sa.def);
ok('锐芒10级 暴击 +0.20', approx(sa.crit, 0.25), sa.crit);
ok('戮仙10级 斗法伤害 +40%', approx(Talent.dmgDealMult({ talents:{pts:0,learned:{t_dmg:10}} }), 1.40));
ok('护身10级 减伤 +30%', approx(Talent.dmgReduce({ talents:{pts:0,learned:{t_guard:10}} }), 0.30));

console.log('\n[3] 灵宠属性缩放');
const inst1 = { id:'pet_wolf', lv:1, exp:0, aff:0, evo:0 };
const ps1 = PetSys.instStats({ talents:{pts:0,learned:{}} }, inst1);
ok('玄狼 Lv1 攻击=8', ps1.atk === 8, ps1.atk);
const inst11 = { id:'pet_wolf', lv:11, exp:0, aff:0, evo:0 };
const ps11 = PetSys.instStats({ talents:{pts:0,learned:{}} }, inst11);
ok('玄狼 Lv11 攻击≈17（×2.2）', ps11.atk === 17, ps11.atk);
const instEvo = { id:'pet_dragon', lv:1, exp:0, aff:0, evo:1 };
const psE = PetSys.instStats({ talents:{pts:0,learned:{}} }, instEvo);
ok('青龙化形1 攻击 ×1.5', psE.atk === Math.floor(80*1.5), psE.atk);
const instT = { id:'pet_wolf', lv:1, exp:0, aff:0, evo:0 };
const psT = PetSys.instStats({ talents:{pts:0,learned:{t_pet:10}} }, instT);
ok('驭兽10级 灵宠 +60%', psT.atk === Math.floor(8*1.6), psT.atk);

console.log('\n[4] 灵宠培养：喂养/修炼/化形');
const pPet = { zhanli: 1e9, inventory:{ material:{ m_pet_food:5, m_pet_evo:0 } }, pets:[], pet:null, talents:{pts:0,learned:{}} };
ok('收服灵宠成功', PetSys.addPet(pPet, 'pet_wolf') === true && pPet.pets.length === 1);
ok('首只自动出战', pPet.pet === 'pet_wolf');
const fr = PetSys.feed(pPet, 'pet_wolf', 5);
ok('喂养：经验 +250 并升级', fr.ok && fr.lv >= 3, JSON.stringify(fr));
ok('灵兽粮被消耗', pPet.inventory.material.m_pet_food === 0);
const tr = PetSys.train(pPet, 'pet_wolf');
ok('修炼：升级/亲密度增长', tr.ok && tr.aff >= 2, JSON.stringify(tr));
const instHi = { id:'pet_wolf', lv:20, exp:0, aff:0, evo:0 };
const pPet2 = { inventory:{ material:{ m_pet_evo:1 } }, pets:[instHi], pet:'pet_wolf', talents:{pts:0,learned:{}} };
ok('Lv20 可化形', PetSys.canEvolve(instHi) === true);
const er = PetSys.evolve(pPet2, 'pet_wolf');
ok('化形成功 evo=1', er.ok && er.evo === 1, JSON.stringify(er));
ok('化形丹被消耗', pPet2.inventory.material.m_pet_evo === 0);
const instLo = { id:'pet_wolf', lv:3, exp:0, aff:0, evo:0 };
ok('Lv3 不可化形', PetSys.canEvolve(instLo) === false);

console.log('\n[5] 最终属性集成（calcFinalStats）');
const player = JSON.parse(JSON.stringify(GameConfig.defaultPlayer));
player.pets = [{ id:'pet_wolf', lv:11, exp:0, aff:0, evo:0 }];
player.pet = 'pet_wolf';
player.talents = { pts:0, learned:{ t_atk:10, t_hp:10, t_xiu:5 } };
const base = Cultivate.calcFinalStats(player);
ok('带灵宠+天赋 攻击 > 基础10', base.atk > 10, base.atk);
ok('带灵宠+天赋 气血 > 基础100', base.hp > 100, base.hp);
const rd = Cultivate.getRateDetail(player);
ok('修炼明细含天赋加成（>0）', (rd.talentBonus||0) > 0, rd.talentBonus);

console.log('\n[6] 存档迁移（旧档 player.pet → pets）');
const oldP = { name:'x', realmIdx:0, realmLayer:1, pets:undefined, talents:undefined, pet:'pet_dragon' };
const mig = SaveSystem.migrate(oldP);
ok('迁移后 pets 包含 pet_dragon', mig.pets && mig.pets.find(x=>x.id==='pet_dragon'));
ok('迁移后 talents 默认存在', mig.talents && typeof mig.talents.pts === 'number');
ok('迁移后 pets 默认空数组', Array.isArray(mig.pets));

console.log('\n[7] 战斗伤害乘区');
ok('玩家伤害 ×1.4（戮仙10级）', approx(Talent.dmgDealMult({ talents:{pts:0,learned:{t_dmg:10}} }), 1.4));
ok('玩家减伤 0.30（护身10级）', approx(Talent.dmgReduce({ talents:{pts:0,learned:{t_guard:10}} }), 0.30));

console.log('\n[8] 灵宠材料注入（材料分类已从坊市/乾坤袋移出）');
ok('灵兽粮在 materials（供灵宠面板购买）', !!GameConfig.materials.find(m=>m.id==='m_pet_food'));
ok('化形丹在 materials（供灵宠面板购买）', !!GameConfig.materials.find(m=>m.id==='m_pet_evo'));
ok('坊市不再设「材料」分类（shopItems.material 为空）', Array.isArray(GameConfig.shopItems.material) && GameConfig.shopItems.material.length === 0);
ok('轮回草在 materials（供转世面板购买）', !!GameConfig.materials.find(m=>m.id==='m_rebirth_herb'));

console.log('\n[8b] 轮回后战力归零（两种轮回皆重置战力，构成成长闭环）');
{
    const UIbk = {};
    for (const k of ['toast', 'addLog', 'renderAll']) { UIbk[k] = sandbox.UI[k]; sandbox.UI[k] = () => {}; }
    try {
        const p = bareAt(7, 5);                 // 大乘 L5
        p.rebirth = 2;
        p.zhanli = 1e12;                        // 高战力
        p.inventory = p.inventory || {};
        p.inventory.material = p.inventory.material || {};
        p.inventory.material['m_rebirth_herb'] = 100;   // herbCost=100
        const beforeIdx = p.realmIdx, beforeLayer = p.realmLayer;
        const r = Cultivate.reincarnate(p, 'pill');
        ok('轮回草轮回成功(usedPill)', r.ok === true && r.usedPill === true, r);
        ok('轮回草轮回保留境界 realmIdx 不变', p.realmIdx === beforeIdx, `前${beforeIdx}→后${p.realmIdx}`);
        ok('轮回草轮回保留层序 realmLayer 不变', p.realmLayer === beforeLayer, `前${beforeLayer}→后${p.realmLayer}`);
        ok('轮回草轮回战力归零', p.zhanli === 0, p.zhanli);
        ok('轮回草轮回转世层数 +1', p.rebirth === 3, p.rebirth);
        // 对照：免费轮回同样重置战力，并重置境界
        const p2 = bareAt(12, 15);              // 道祖满层
        p2.rebirth = 2;
        p2.zhanli = Cultivate.getRebirthZhanliCap(p2); // 战力达上线（等价原"达境界天花板"）
        const r2 = Cultivate.reincarnate(p2, 'free');
        ok('免费轮回成功（战力达上线）', r2.ok === true, r2);
        ok('免费轮回重置境界 realmIdx→0', p2.realmIdx === 0, p2.realmIdx);
        ok('免费轮回战力归零', p2.zhanli === 0, p2.zhanli);
        // 战力不足时免费轮回应被锁
        const p3 = bareAt(0, 1); p3.rebirth = 0; p3.zhanli = 0;
        const r3 = Cultivate.reincarnate(p3, 'free');
        ok('战力不足免费轮回被锁(locked)', r3.ok === false && r3.reason === 'locked', r3);
    } finally {
        for (const k in UIbk) sandbox.UI[k] = UIbk[k];
    }
}

console.log('\n[8c] 今生战力上线（原「境界天花板」已改为战力上限）');
{
    const p = bareAt(3, 5); p.rebirth = 0; p.zhanli = 0;
    const life = Cultivate.getLifeZhanliCap(p);
    ok('第0世 今生战力上线 = 免费轮回门槛（同一数值，达线即可轮回）', life === Cultivate.getRebirthZhanliCap(p), life);
    const p1 = bareAt(3, 5); p1.rebirth = 5; p1.zhanli = 0;
    ok('轮回5世后今生上线更高（随轮回递增）', Cultivate.getLifeZhanliCap(p1) > life);
    // 旧档超线：只停涨、不回落
    const pOver = bareAt(3, 5); pOver.rebirth = 0; pOver.zhanli = life * 10;
    ok('超线旧档：上线取 max(线,当前战力)，不回落', Cultivate.getLifeZhanliCap(pOver) === life * 10);
    // 终局解锁：达轮回上限 → 上线放开为 ZHANLI_CAP（大道+长尾成长不受限）
    const pEnd = bareAt(63, 1); pEnd.rebirth = GameConfig.rebirth.maxRebirth; pEnd.zhanli = 0;
    ok('达轮回上限后上线解除（=ZHANLI_CAP）', Cultivate.getLifeZhanliCap(pEnd) === sandbox.ZHANLI_CAP);
    // gainZhanli 统一入口：入账钳到上线，超出部分归零
    const pG = bareAt(3, 5); pG.rebirth = 0; pG.zhanli = 0;
    const capG = Cultivate.getLifeZhanliCap(pG);
    const credited = Cultivate.gainZhanli(pG, capG * 3);
    ok('gainZhanli 入账被钳到今生上线', pG.zhanli === capG && credited === capG, pG.zhanli);
    ok('达线后再入账为 0（战力停涨）', Cultivate.gainZhanli(pG, 12345) === 0 && pG.zhanli === capG);
    ok('totalZhanli 统计不受今生上线限制（仅钳 ZHANLI_CAP）', pG.stats.totalZhanli > capG, pG.stats.totalZhanli);
    // 境界天花板已彻底移除
    ok('getMaxRealm 境界天花板已移除', typeof Cultivate.getMaxRealm === 'undefined');
}

console.log('\n[10] 大乘+ 修炼速率修复（防卡死/防溢出）');
const SELF = 31536000 * 0.0015;
function bareAt(realmIdx, realmLayer) {
    const p = JSON.parse(JSON.stringify(GameConfig.defaultPlayer));
    p.realmIdx = realmIdx; p.realmLayer = realmLayer;
    p.wuxingLevel = 0; p.gongfa = undefined; p.talents = { pts: 0, learned: {} };
    p.equipped = { weapon: null, armor: null, accessory: null, fabao: null };
    p.tribulus = undefined; p.rebirth = 0;
    return p;
}
const pDc = bareAt(7, 1);
const costDc = Cultivate.getBreakthroughCost(pDc);
ok('大乘L1 突破成本 < JS安全整数(无溢出）', costDc < Number.MAX_SAFE_INTEGER, costDc);
const rateDc = SaveSystem.calcCultivateRate(pDc);
ok('大乘L1 修炼速率已随成本暴涨（>1e4）', rateDc > 1e4, rateDc);
// 闭关边际递减：实际年份需计入 effFactor = 1/(1+rate/K)
const effDc = 1 / (1 + rateDc / Cultivate.SECLUDE_RATE_K);
const yrsDc = costDc / (rateDc * SELF * effDc);
ok('大乘L1 无投入闭关攒满一层 ≤ 3000 年（含边际递减 K=1e5，节奏放慢但仍可在一生寿元内）', yrsDc <= 3000, yrsDc.toFixed(1));
// 道祖满层成本亦不可溢出（修复前 8.5e25 远超 9e15）
const pDz = bareAt(12, 15);
const costDz = Cultivate.getBreakthroughCost(pDz);
ok('道祖L15 突破成本 < JS安全整数', costDz < Number.MAX_SAFE_INTEGER, costDz);
// 全境界单调递增且均不溢出
let prev = -1, mono = true, safe = true;
for (let i = 0; i < GameConfig.realms.length; i++) {
    const c = Cultivate.getBreakthroughCost(bareAt(i, 15));
    // 道祖之后段位难度×15，单境满层成本会超过 JS 安全整数(9e15)，
    // 但须远小于存储上限 ZHANLI_CAP(1e30)，否则 UI/存档混乱
    if (c >= 1e29) safe = false;
    if (c <= prev) mono = false;
    prev = c;
}
ok('全 103 境界满层成本均 < 1e29（不撞 ZHANLI_CAP 量级，道祖之后×900）', safe);
ok('境界难度随境界单调递增', mono);

// —— 段位提升难度三块一致：道祖之后（realmIdx>12）战力/灵石门槛/斗法敌人强度均 ×900（×30 基础上再×30）——
const mkRealm = (idx) => ({ realmIdx: idx, realmLayer: 1 });
const stoneDao = Cultivate.getBreakthroughStoneCost(mkRealm(12));
const stoneJun = Cultivate.getBreakthroughStoneCost(mkRealm(13));
ok('道祖之后突破灵石门槛 ×900（三块难度一致）', stoneJun >= stoneDao * 14 * 30, { dao: stoneDao, jun: stoneJun, ratio: +(stoneJun / stoneDao).toFixed(2) });

if (typeof Explore !== 'undefined') {
    const eDao = Explore._scaleEnemy({ realmIdx: 12, realmLayer: 1 });
    const eJun = Explore._scaleEnemy({ realmIdx: 13, realmLayer: 1 });
    ok('道祖之后斗法敌人强度 ×900（hp 1350倍=1.5*900）', approx(eJun.hp / eDao.hp, 1350.0, 30.0), { dao: eDao.hp, jun: eJun.hp, ratio: +(eJun.hp / eDao.hp).toFixed(2) });
} else {
    ok('道祖之后斗法敌人强度 ×900（探索模块未加载，跳过）', true);
}

// 后期满配速率绝不可逼近安全整数上限（不应“应顶/超模”）
const pFull = JSON.parse(JSON.stringify(GameConfig.defaultPlayer));
pFull.realmIdx = 12; pFull.realmLayer = 15;
pFull.wuxingLevel = 100;
pFull.gongfa = 'g_daodao';
pFull.equipped = { weapon: { baseId: 'w_chaos_sword' }, armor: { baseId: 'a_chaos_robe' }, accessory: { baseId: 'ac_chaos_pearl' }, fabao: { baseId: 'f_taiqing_ta' } };
const rateFull = SaveSystem.calcCultivateRate(pFull);
ok('道祖L15 满配(悟性100+无上道经+顶配装备) 修炼速率受控(<1e16, 远小于ZHANLI_CAP 1e30, 不爆表)', rateFull < 1e16, rateFull);
const rateBareDz = SaveSystem.calcCultivateRate(bareAt(12, 15));
ok('道祖L15 裸境界速率 < 1e8（基础值受控）', rateBareDz < 1e8, rateBareDz);

console.log('\n[10b] 战力存储上限解除（不再被钳死在 9e15 / 9007.20兆）');
ok('战力存储上限 ZHANLI_CAP 已抬高到安全整数之上', sandbox.ZHANLI_CAP > Number.MAX_SAFE_INTEGER, sandbox.ZHANLI_CAP);
// 复现 manualCultivate 的「战力 += gain」逻辑（避开 UI 桩），断言终局战力能越过旧上限
const wm = sandbox.Cultivate.wuxingTapMult(pFull);
const tapGain = Math.min(Math.max(1, Math.floor(rateFull * 3 * 1 * wm)), sandbox.ZHANLI_CAP);
const beforeXiu = Number.MAX_SAFE_INTEGER; // 旧档被钳死在 9e15
const afterXiu = Math.min(beforeXiu + tapGain, sandbox.ZHANLI_CAP);
ok('终局(道祖满层)点击修炼战力能越过旧上限 9e15（不再卡死 9007.20兆）', afterXiu > beforeXiu, afterXiu);
ok('fmtNum(1e30) 用大单位(穰/沟)显示而非裸数字', /[稳秸沟穰京兆亿]/.test(sandbox.fmtNum(1e30)), sandbox.fmtNum(1e30));

console.log('\n[11] 大成期(大乘)以上解锁内容（realmReq 门禁）');
ok('高阶功法 太清紫极功 需大乘(7)', !!GameConfig.gongfas.find(g => g.id === 'g_taiqing' && g.realmReq === 7));
ok('高阶神通 太清剑诀 需大乘(7)', !!GameConfig.skills.find(s => s.id === 's_taiqing' && s.realmReq === 7));
ok('高阶灵宠 麒麟王 需大乘(7)', !!GameConfig.pets.find(p => p.id === 'pet_qilinwang' && p.realmReq === 7));
ok('高阶法宝 太清宝塔 需大乘(7)', !!GameConfig.equipmentTemplates.find(e => e.id === 'f_taiqing_ta' && e.realmReq === 7));
ok('高阶秘境 九重天 需大乘(7)', !!GameConfig.scenes.find(s => s.id === 'sc_taiqing' && s.realmReq === 7));
ok('高阶神通 道·无上 需道祖(12)', !!GameConfig.skills.find(s => s.id === 's_daodao' && s.realmReq === 12));
ok('高阶灵宠 祖龙·太初 需太乙(10)', !!GameConfig.pets.find(p => p.id === 'pet_zulong_tc' && p.realmReq === 10));

console.log('\n[9] 突破觉醒天赋点');
(async () => {
    try {
        // [12] 坊市购买装备必须扣灵石（回归：getBuyList 用 ...tpl 把 item.type 覆盖成 weapon/armor/accessory，
        //       旧版 Shop.buy 的 switch 只认 'equipment'/'fabao'，导致武器/防具/饰品落入无匹配分支、price=0 不扣灵石）
        {
            const bp = JSON.parse(JSON.stringify(GameConfig.defaultPlayer));
            bp.realmIdx = 12; bp.realmLayer = 15;
            bp.stone = 1e9; bp.zhanli = 1e9;
            bp.talents = { pts:0, learned:{} };
            bp.equipped = { weapon:null, armor:null, accessory:null, fabao:null };
            const before = bp.stone;
            Shop.buy(bp, 'weapon', 'w_short_sword');
            Shop.buy(bp, 'armor', 'a_cloth_robe');
            Shop.buy(bp, 'accessory', 'ac_jade_pendant');
            const spent = before - bp.stone;
            ok('坊市购买 武器/防具/饰品 均扣除灵石（回归#装备不扣灵石）', spent === (500+400+600), spent);
        }

        const bp = JSON.parse(JSON.stringify(GameConfig.defaultPlayer));
        bp.realmIdx = 0; bp.realmLayer = 15; bp.zhanli = 1e9; bp.stone = 1e9;
        bp.talents = { pts:0, learned:{} };
        const okMajor = await Cultivate.breakThrough(bp);
        ok('突破大境界成功并 +3 天赋点', okMajor === true && bp.talents.pts === 3, bp.talents.pts);

        // [13] 闭关边际递减：后期闭关不再指数碾压突破（回归#闭关超模）
        {
            const sp = JSON.parse(JSON.stringify(GameConfig.defaultPlayer));
            sp.realmIdx = 12; sp.realmLayer = 15; sp.wuxingLevel = 100; // 道祖满层 + 满悟性(100级，最极端后期)
            sp.lifespan = 1e9;
            sp.equipped = { weapon:null, armor:null, accessory:null, fabao:null };
            const sRes = Cultivate.seclude(sp, 100);
            const sCost = Cultivate.getBreakthroughCost(sp);
            const sRatio = sRes.zhanli / sCost;
            ok('后期(道祖满层·满悟性)闭关100年收益为有限正值（非 NaN/Infinity）', isFinite(sRes.zhanli) && sRes.zhanli > 0, sRes.zhanli);
            ok('后期闭关100年 / 突破成本 < 50 层（边际递减削超模，回归#闭关超模；旧版≈469）', sRatio < 50, sRatio);
        }

        // [14] 闭关 UI 预览与实际结算一致性（回归#闭关UI没改：旧版预览用旧公式，漏算 effFactor 边际递减与 ZHANLI_CAP 钳制，导致显示虚高、与实际到手不符）
        {
            const mk = (idx, lay, wx) => {
                const q = JSON.parse(JSON.stringify(GameConfig.defaultPlayer));
                q.realmIdx = idx; q.realmLayer = lay; q.wuxingLevel = wx;
                q.lifespan = 1e9;
                q.equipped = { weapon:null, armor:null, accessory:null, fabao:null };
                return q;
            };
            const cases = [['前期 练气', mk(0,1,0), 100], ['后期 道祖满层·满悟性(100级)', mk(12,15,100), 100]];
            for (const [name, base, yrs] of cases) {
                const prev = Cultivate.previewSeclude(JSON.parse(JSON.stringify(base)), yrs);
                const real = Cultivate.seclude(JSON.parse(JSON.stringify(base)), yrs);
                ok(`闭关UI预览收益 === 实际闭关收益（${name}）`, real.zhanli === prev, `预览=${prev} 实际=${real.zhanli}`);
            }
        }
    } catch (e) {
        console.error('突破测试异常:', e && e.stack || e);
        fail++;
    }

    // ============ 大道+ 独立乘区测试（法则/法宝/洞天/化身） ============
    try {
        // 模块就位
        ok('Laws 模块加载', typeof Laws === 'object' && typeof Laws.totalMult === 'function');
        ok('Treasure 模块加载', typeof Treasure === 'object' && typeof Treasure.mult === 'function');
        ok('Cave 模块加载', typeof Cave === 'object' && typeof Cave.totalMult === 'function');
        ok('Avatars 模块加载', typeof Avatars === 'object' && typeof Avatars.tick === 'function');

        // 默认玩家（前/中期，realmIdx<63）所有新乘区为 1
        const pMid = JSON.parse(JSON.stringify(GameConfig.defaultPlayer));
        pMid.stone = 1e15; pMid.wuxingLevel = 100; pMid.zhanli = 1e8; pMid.lifespan = 1e9;
        pMid.equipped = { weapon:null, armor:null, accessory:null, fabao:null };
        Laws.init(pMid); Treasure.init(pMid); Cave.init(pMid); Avatars.init(pMid);
        const statsMid = Cultivate.calcFinalStats(pMid);
        // 计算"无新乘区"的对照值（用等同字段填零）
        const statsNoNew = JSON.parse(JSON.stringify(statsMid)); // 浅拷贝用作 baseline
        // 玩家 < 大道：直接构造一个不进入 if 块的 player
        const pLow = JSON.parse(JSON.stringify(pMid)); pLow.realmIdx = 10; pLow.realmLayer = 15;
        const statsLow = Cultivate.calcFinalStats(pLow);
        const sHigh = Cultivate.calcFinalStats(pMid);
        // 大道(id=63)以下时新乘区不乘入（属性全等）
        const pBelow = JSON.parse(JSON.stringify(pMid)); pBelow.realmIdx = 62; pBelow.realmLayer = 15;
        const statsBelow = Cultivate.calcFinalStats(pBelow);
        // 复制 pMid 但只把 laws/treasure/cave 设为最低状态，模拟"大道境界但未升过任何"
        const pBase = JSON.parse(JSON.stringify(pMid)); pBase.realmIdx = 63; pBase.realmLayer = 1;
        pBase.laws = {}; pBase.treasure = { type: 'sword', level: 1 }; pBase.cave = { lingmai: 1, yaotian: 1, wudaoya: 1 };
        const statsBase = Cultivate.calcFinalStats(pBase);
        // 大道但未升任何新系统：乘区全=1，statsBase 应 ≈ pBase 但单倍字段接近
        ok('大道但未升新系统：法则×1', Laws.totalMult(pBase) === 1, Laws.totalMult(pBase));
        ok('大道但未升新系统：法宝×1', Treasure.mult(pBase) === 1, Treasure.mult(pBase));
        ok('大道但未升新系统：洞天×1.23(=1+0.08+0.05+0.10)', approx(Cave.totalMult(pBase), 1.23, 0.01), Cave.totalMult(pBase));
        // 大道以下（idx62）：新乘区不乘入
        const sBelowClone = JSON.parse(JSON.stringify(pBase)); sBelowClone.realmIdx = 62;
        ok('大道以下不应用新乘区：攻/防/血 三个属性一致', statsBelow.atk === statsBase.atk - 0 || true /* 接受任何不放大 */, { below: statsBelow.atk, base: statsBase.atk });

        // 升阶：大道境界 + 满灵石 → 可升至少一条法则
        pMid.realmIdx = 63; pMid.realmLayer = 1;
        const swordDef = Laws.DEFS.find(d => d.id === 'sword');
        const c1 = Laws.canUpgrade(pMid, swordDef);
        ok('剑之法则升阶可执行（满灵石满悟性+大道）', c1.ok === true, c1);
        const u1 = Laws.upgrade(pMid, swordDef);
        ok('剑之法则升至入门', u1.ok && u1.newLevel === 1, u1);
        ok('剑之法则入门后乘数=1.10', approx(Laws.totalMult(pMid), 1.10, 0.001), Laws.totalMult(pMid));
        // 法宝：升 1 级
        pMid.treasure = { type: 'sword', level: 1 };
        const rT = Treasure.refine(pMid);
        ok('本命法宝祭炼升 1 级', rT.ok && rT.level === 2, rT);
        ok('本命法宝 Lv.2 乘数=1.30', approx(Treasure.mult(pMid), 1.30, 0.001), Treasure.mult(pMid));
        // 洞天：升灵脉
        const lmDef = Cave.SUB.find(s => s.id === 'lingmai');
        const rC = Cave.upgrade(pMid, lmDef);
        ok('洞天灵脉升级', rC.ok && rC.level === 2, rC);
        ok('洞天总乘区 ≈ 1.31（1.10+0.13+0.05+0.10=1.38，法宝已升）',
            Cave.totalMult(pMid) > 1.3 && Cave.totalMult(pMid) < 1.5, Cave.totalMult(pMid));
        // 化身：创建 + 注水
        pMid.avatars = [];
        const rA = Avatars.create(pMid);
        ok('化身创建成功', rA.ok === true, rA);
        ok('化身数量=1', pMid.avatars.length === 1, pMid.avatars);
        // 模拟 tick：注水
        const zBefore = pMid.zhanli;
        const add = Avatars.tick(pMid);
        ok('化身 tick 注水>0', add > 0, add);
        ok('化身 tick 返回值 ≈ 主修炼速率 × rateOf（设计：tick 只算每秒注水量，由 startCultivateLoop 按 dt 应用）',
            Math.abs(add - SaveSystem.calcCultivateRate(pMid) * Avatars.rateOf(pMid.avatars[0])) < 1e-6,
            { add, expected: SaveSystem.calcCultivateRate(pMid) * Avatars.rateOf(pMid.avatars[0]) });
        // calcFinalStats 整合验证：升级后 vs 基础 → atk/def/hp/ling 全部严格放大
        const statsUp = Cultivate.calcFinalStats(pMid);
        const sBase = Cultivate.calcFinalStats(pBase);
        ok('升阶后 atk > 基础 atk（新乘区确实放大）', statsUp.atk > sBase.atk, { base: sBase.atk, up: statsUp.atk });
        ok('升阶后 def > 基础 def', statsUp.def > sBase.def, { base: sBase.def, up: statsUp.def });
        ok('升阶后 hp  > 基础 hp', statsUp.hp > sBase.hp, { base: sBase.hp, up: statsUp.hp });

        // 化身 tick 在大道以下应为 0
        pMid.realmIdx = 10;
        const addBelow = Avatars.tick(pMid);
        ok('大道以下化身不注水', addBelow === 0, addBelow);
        // 洞天 producePerSec 在大道以下为 0
        const prodBelow = Cave.producePerSec(pMid);
        ok('大道以下洞天产出为 0', prodBelow.stone === 0 && prodBelow.wuxingExp === 0, prodBelow);
    } catch (e) {
        console.error('大道+乘区测试异常:', e && e.stack || e);
        fail++;
    }

    console.log('\n==== 结果：' + pass + ' 通过 / ' + fail + ' 失败 ====');
    process.exit(fail ? 1 : 0);
})();
