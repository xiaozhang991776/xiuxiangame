/* 无头集成测试：按浏览器逐脚本加载（共享全局），断言天赋/灵宠逻辑 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

// 让突破成功率判定确定性（< rate 必成功），避免随机导致测试抖动
Math.random = () => 0.001;

const DIR = __dirname;
const ORDER = [
    'config.js', 'shop_ext.js', 'talents.js', 'pets.js',
    'save.js', 'inventory.js', 'cultivate.js', 'combat.js',
    'explore.js', 'shop.js', 'friends.js', 'ui.js', 'main.js'
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
const { GameConfig, Talent, PetSys, Cultivate, SaveSystem } = sandbox;

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
const pPet = { xiu: 1e9, inventory:{ material:{ m_pet_food:5, m_pet_evo:0 } }, pets:[], pet:null, talents:{pts:0,learned:{}} };
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

console.log('\n[8] 坊市注入新材料');
ok('灵兽粮在 materials', !!GameConfig.materials.find(m=>m.id==='m_pet_food'));
ok('化形丹在 materials', !!GameConfig.materials.find(m=>m.id==='m_pet_evo'));
ok('灵兽粮在 shopItems.material', GameConfig.shopItems.material.includes('m_pet_food'));
ok('化形丹在 shopItems.material', GameConfig.shopItems.material.includes('m_pet_evo'));

console.log('\n[9] 突破觉醒天赋点');
(async () => {
    try {
        const bp = JSON.parse(JSON.stringify(GameConfig.defaultPlayer));
        bp.realmIdx = 0; bp.realmLayer = 15; bp.xiu = 1e9; bp.stone = 1e9;
        bp.talents = { pts:0, learned:{} };
        const okMajor = await Cultivate.breakThrough(bp);
        ok('突破大境界成功并 +3 天赋点', okMajor === true && bp.talents.pts === 3, bp.talents.pts);
    } catch (e) {
        console.error('突破测试异常:', e && e.stack || e);
        fail++;
    }
    console.log('\n==== 结果：' + pass + ' 通过 / ' + fail + ' 失败 ====');
    process.exit(fail ? 1 : 0);
})();
