/* ============================================
   仙途·轮回诀 — 灵宠培养系统
   收服 · 出战 · 喂养 · 修炼 · 化形进阶 · 属性缩放
   在 config.js / shop_ext.js 之后加载
   ============================================ */

const PetSys = {
    /* 升级所需经验：随等级指数增长 */
    expNeed(lv) { return Math.floor(100 * Math.pow(1.25, (lv || 1) - 1)); },

    /* 收服一只灵宠（可同时拥有多只） */
    addPet(player, id) {
        if (!player.pets) player.pets = [];
        if (player.pets.find(x => x.id === id)) return false;
        player.pets.push({ id, lv: 1, exp: 0, aff: 0, evo: 0 });
        if (!player.pet) player.pet = id; // 首只自动出战
        return true;
    },

    /* 设置出战灵宠 */
    setActive(player, id) {
        if (player.pets && player.pets.find(x => x.id === id)) player.pet = id;
    },

    getInst(player, id) { return player.pets ? player.pets.find(x => x.id === id) : null; },
    active(player) { return player.pet ? this.getInst(player, player.pet) : null; },

    /* 化形称谓（evo 0/1/2/3 → 无/灵/仙/圣） */
    evoName(evo) { return ['', '·灵', '·仙', '·圣'][evo || 0] || ''; },
    maxEvo: 3,

    /* 计算某只灵宠的当前属性（含等级/化形/亲密度/御兽天赋） */
    instStats(player, inst) {
        const tpl = getPet(inst.id);
        if (!tpl) return null;
        const lv = inst.lv || 1, evo = inst.evo || 0, aff = inst.aff || 0;
        const mult = (1 + (lv - 1) * 0.12) * Math.pow(1.5, evo) * (1 + aff * 0.003);
        const tb = (player && typeof Talent !== 'undefined') ? Talent.petBonusMult(player) : 1;
        return {
            id: inst.id,
            name: tpl.name + this.evoName(evo),
            icon: tpl.icon,
            elem: tpl.elem,
            skill: tpl.skill,
            atk: Math.floor(tpl.atk * mult * tb),
            def: Math.floor(tpl.def * mult * tb),
            hp:  Math.floor(tpl.hp * mult * tb)
        };
    },

    /* 战斗用出战灵宠（含属性与技能） */
    getCombatPet(player) {
        const inst = this.active(player);
        if (!inst) return null;
        return this.instStats(player, inst);
    },

    /* 喂养：消耗 灵兽粮，增加经验（可一次多只） */
    feed(player, id, n = 1) {
        const inst = this.getInst(player, id);
        if (!inst) return { ok: false };
        const have = (player.inventory.material && player.inventory.material['m_pet_food']) || 0;
        const use = Math.min(n, have);
        if (use <= 0) return { ok: false, msg: '灵兽粮不足（坊市可购）' };
        player.inventory.material['m_pet_food'] -= use;
        let gained = 0;
        for (let i = 0; i < use; i++) {
            inst.exp += 50; gained += 50;
            while (inst.exp >= this.expNeed(inst.lv)) {
                inst.exp -= this.expNeed(inst.lv); inst.lv++;
            }
        }
        this._save(player);
        return { ok: true, used: use, gained, lv: inst.lv };
    },

    /* 修炼：消耗修为，增经验与亲密度 */
    train(player, id) {
        const inst = this.getInst(player, id);
        if (!inst) return { ok: false };
        const cost = 200 * (inst.lv || 1);
        if ((player.xiu || 0) < cost) return { ok: false, msg: '修为不足（需 ' + fmtNum(cost) + '）' };
        player.xiu -= cost;
        inst.exp += 60; inst.aff += 2;
        while (inst.exp >= this.expNeed(inst.lv)) {
            inst.exp -= this.expNeed(inst.lv); inst.lv++;
        }
        this._save(player);
        return { ok: true, lv: inst.lv, aff: inst.aff };
    },

    /* 是否可化形进阶 */
    canEvolve(inst) {
        if (!inst) return false;
        const evo = inst.evo || 0;
        return evo < this.maxEvo && (inst.lv || 1) >= (evo + 1) * 20;
    },

    /* 化形进阶：消耗 化形丹，evo+1，属性大幅跃升 */
    evolve(player, id) {
        const inst = this.getInst(player, id);
        if (!inst) return { ok: false };
        if (!this.canEvolve(inst)) return { ok: false, msg: '未达化形条件（需等级 ' + ((inst.evo + 1) * 20) + '）' };
        const need = inst.evo + 1;
        const have = (player.inventory.material && player.inventory.material['m_pet_evo']) || 0;
        if (have < need) return { ok: false, msg: '化形丹不足（需 ' + need + ' 枚）' };
        player.inventory.material['m_pet_evo'] -= need;
        inst.evo += 1;
        this._save(player);
        return { ok: true, evo: inst.evo };
    },

    _save(player) {
        if (typeof Cultivate !== 'undefined') Cultivate.save(player);
    }
};

// 注入新材料（灵兽粮 / 化形丹）到配置与坊市
(function injectPetMaterials() {
    if (typeof GameConfig === 'undefined') return;
    const mats = [
        { id: 'm_pet_food', name: '灵兽粮', icon: '粮', quality: 0, price: 60,    desc: '喂养灵宠的灵粮，可助其增长修为' },
        { id: 'm_pet_evo',  name: '化形丹', icon: '丹', quality: 3, price: 20000,  desc: '灵宠化形进阶之丹，等级足时可令其蜕变' }
    ];
    mats.forEach(m => { if (!GameConfig.materials.find(x => x.id === m.id)) GameConfig.materials.push(m); });
    // 灵兽粮/化形丹不再进坊市「材料」分类（该分类已移除），改由「灵宠」面板内直接购买
})();
