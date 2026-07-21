/* ============================================
   仙途·轮回诀 — 背包与装备系统
   物品管理 · 装备穿戴/强化/分解 · 丹药使用/炼制
   ============================================ */

const Inventory = {
    /* ---------- 添加物品到背包 ---------- */
    addItem(player, itemId, count = 1) {
        // 判断物品类型
        // 装备模板
        const eqTpl = getEquipTemplate(itemId);
        if (eqTpl) {
            // 装备实例化（每个装备独立uid，便于强化）
            for (let i = 0; i < count; i++) {
                player.inventory.equipment.push({
                    uid: genUid(),
                    baseId: itemId,
                    enhance: 0
                });
            }
            this.save(player);
            return true;
        }
        // 法宝
        const fabaoTpl = GameConfig.equipmentTemplates.find(e => e.id === itemId && e.type === 'fabao');
        if (fabaoTpl) {
            for (let i = 0; i < count; i++) {
                player.inventory.fabao.push({
                    uid: genUid(),
                    baseId: itemId,
                    enhance: 0
                });
            }
            this.save(player);
            return true;
        }
        // 丹药
        const pill = getPill(itemId);
        if (pill) {
            player.inventory.pill[itemId] = (player.inventory.pill[itemId] || 0) + count;
            this.save(player);
            return true;
        }
        // 材料
        const mat = getMaterial(itemId);
        if (mat) {
            player.inventory.material[itemId] = (player.inventory.material[itemId] || 0) + count;
            this.save(player);
            return true;
        }
        // 功法
        const gf = getGongfa(itemId);
        if (gf) {
            if (!player.inventory.gongfa.includes(itemId)) {
                player.inventory.gongfa.push(itemId);
            }
            this.save(player);
            return true;
        }
        return false;
    },

    /* ---------- 添加掉落（带概率） ---------- */
    addDrops(player, drops) {
        const gained = [];
        if (!drops) return gained;
        drops.forEach(d => {
            if (Math.random() < d.rate) {
                this.addItem(player, d.id, d.count || 1);
                gained.push({ id: d.id, count: d.count || 1 });
            }
        });
        return gained;
    },

    /* ---------- 获取背包分类列表 ---------- */
    getList(player, category) {
        switch (category) {
            case 'equipment': {
                return player.inventory.equipment.map(eq => {
                    const tpl = getEquipTemplate(eq.baseId);
                    return { ...eq, ...tpl, isInstance: true };
                }).concat(player.inventory.fabao.map(eq => {
                    const tpl = getEquipTemplate(eq.baseId);
                    return { ...eq, ...tpl, isInstance: true };
                }));
            }
            case 'pill':
                return Object.entries(player.inventory.pill)
                    .filter(([_, c]) => c > 0)
                    .map(([id, c]) => ({ ...getPill(id), count: c }));
            case 'material':
                return Object.entries(player.inventory.material)
                    .filter(([_, c]) => c > 0)
                    .map(([id, c]) => ({ ...getMaterial(id), count: c }));
            case 'gongfa':
                return player.inventory.gongfa.map(id => getGongfa(id));
            case 'fabao':
                return player.inventory.fabao.map(eq => {
                    const tpl = getEquipTemplate(eq.baseId);
                    return { ...eq, ...tpl, isInstance: true };
                });
            default:
                return [];
        }
    },

    /* ---------- 装备穿戴 ---------- */
    equip(player, uid) {
        // 在equipment和fabao中查找
        let eqInstance = player.inventory.equipment.find(e => e.uid === uid);
        let isFabao = false;
        if (!eqInstance) {
            eqInstance = player.inventory.fabao.find(e => e.uid === uid);
            isFabao = true;
        }
        if (!eqInstance) return false;

        const tpl = getEquipTemplate(eqInstance.baseId);
        if (!tpl) return false;

        const slot = tpl.type; // weapon/armor/accessory/fabao
        // 从背包移除
        if (isFabao) {
            player.inventory.fabao = player.inventory.fabao.filter(e => e.uid !== uid);
        } else {
            player.inventory.equipment = player.inventory.equipment.filter(e => e.uid !== uid);
        }
        // 将原装备放回背包
        if (player.equipped[slot]) {
            const oldEq = player.equipped[slot];
            if (oldEq.baseId && getEquipTemplate(oldEq.baseId).type === 'fabao') {
                player.inventory.fabao.push(oldEq);
            } else {
                player.inventory.equipment.push(oldEq);
            }
        }
        // 装备新物品
        player.equipped[slot] = eqInstance;
        if (typeof UI !== 'undefined') UI.toast(`已装备：${tpl.name}`, 'good');
        if (typeof UI !== 'undefined') UI.addLog(`装备 ${tpl.name}`);
        this.save(player);
        return true;
    },

    /* ---------- 卸下装备 ---------- */
    unequip(player, slot) {
        const eq = player.equipped[slot];
        if (!eq) return false;
        const tpl = getEquipTemplate(eq.baseId);
        if (tpl.type === 'fabao') {
            player.inventory.fabao.push(eq);
        } else {
            player.inventory.equipment.push(eq);
        }
        player.equipped[slot] = null;
        if (typeof UI !== 'undefined') UI.toast(`已卸下：${tpl.name}`, 'good');
        this.save(player);
        return true;
    },

    /* ---------- 装备强化 ---------- */
    enhance(player, uid) {
        let eqInstance = player.inventory.equipment.find(e => e.uid === uid)
            || player.inventory.fabao.find(e => e.uid === uid)
            || Object.values(player.equipped).find(e => e && e.uid === uid);
        if (!eqInstance) return false;
        const tpl = getEquipTemplate(eqInstance.baseId);
        if (!tpl) return false;

        const curEnhance = eqInstance.enhance || 0;
        if (curEnhance >= 100) {
            if (typeof UI !== 'undefined') UI.toast('已达强化上限+100！', 'bad');
            return false;
        }
        // 强化消耗灵石（随等级递增）
        const q = getQuality(tpl.quality);
        const cost = Math.floor(tpl.price * 0.3 * (curEnhance + 1));
        if (player.stone < cost) {
            if (typeof UI !== 'undefined') UI.toast(`灵石不足！需要${cost}灵石`, 'bad');
            return false;
        }
        player.stone -= cost;
        eqInstance.enhance = curEnhance + 1;
        if (typeof UI !== 'undefined') {
            UI.toast(`强化成功！+${curEnhance + 1}（耗${cost}灵石）`, 'gold');
            UI.addLog(`${tpl.name}强化至+${curEnhance + 1}，耗${cost}灵石`, 'evt');
        }
        this.save(player);
        return true;
    },

    /* ---------- 装备分解（获得灵石） ---------- */
    decompose(player, uid) {
        let eqInstance = player.inventory.equipment.find(e => e.uid === uid)
            || player.inventory.fabao.find(e => e.uid === uid);
        if (!eqInstance) return false;
        const tpl = getEquipTemplate(eqInstance.baseId);
        if (!tpl) return false;
        const q = getQuality(tpl.quality);
        // 分解获得灵石 = 售价 * 0.6 + 强化返还
        const base = Math.floor(tpl.price * q.sellMult * 0.6);
        const enhanceReturn = (eqInstance.enhance || 0) * Math.floor(tpl.price * 0.1);
        const total = base + enhanceReturn;
        // 移除物品
        player.inventory.equipment = player.inventory.equipment.filter(e => e.uid !== uid);
        player.inventory.fabao = player.inventory.fabao.filter(e => e.uid !== uid);
        player.stone += total;
        // 高品质装备分解返还部分材料
        if (tpl.quality >= 1) {
            const matId = tpl.type === 'weapon' || tpl.type === 'armor' ? 'm_ore' : 'm_pearl';
            this.addItem(player, matId, tpl.quality);
            if (typeof UI !== 'undefined') UI.toast(`分解获得${total}灵石 + ${getMaterial(matId).name}×${tpl.quality}`, 'gold');
        } else {
            if (typeof UI !== 'undefined') UI.toast(`分解获得${total}灵石`, 'gold');
        }
        this.save(player);
        return true;
    },

    /* ---------- 使用丹药 ---------- */
    usePill(player, pillId) {
        if (!player.inventory.pill[pillId] || player.inventory.pill[pillId] <= 0) return false;
        const pill = getPill(pillId);
        if (!pill) return false;
        player.inventory.pill[pillId]--;

        const eff = pill.effect;
        let msg = '';
        switch (eff.type) {
            case 'hp':
                // 临时回血（在战斗外使用没有效果，这里允许使用但提示）
                msg = `恢复${eff.value}气血（战斗中生效）`;
                // 标记临时HP buff
                player.tempHpBuff = (player.tempHpBuff || 0) + eff.value;
                break;
            case 'ling':
                player.tempLingBuff = (player.tempLingBuff || 0) + eff.value;
                msg = `恢复${eff.value}灵力（战斗中生效）`;
                break;
            case 'xiu':
                player.xiu += eff.value;
                player.stats.totalXiu = (player.stats.totalXiu || 0) + eff.value;
                msg = `获得${eff.value}修为`;
                break;
            case 'perm_hp':
                player.permBonus.hp = (player.permBonus.hp || 0) + eff.value;
                msg = `永久气血+${eff.value}`;
                break;
            case 'perm_atk':
                player.permBonus.atk = (player.permBonus.atk || 0) + eff.value;
                msg = `永久攻击+${eff.value}`;
                break;
            case 'perm_ling':
                player.permBonus.ling = (player.permBonus.ling || 0) + eff.value;
                msg = `永久灵力+${eff.value}`;
                break;
            case 'perm_all':
                player.permBonus.atk = (player.permBonus.atk || 0) + eff.value;
                player.permBonus.hp = (player.permBonus.hp || 0) + eff.value * 5;
                player.permBonus.def = (player.permBonus.def || 0) + eff.value;
                player.permBonus.ling = (player.permBonus.ling || 0) + eff.value * 3;
                msg = `永久+${eff.value}攻击 +${eff.value * 5}气血`;
                break;
            case 'buff_atk':
                player.tempBuffAtk = { value: eff.value, turns: eff.turns };
                msg = `战斗中攻击+${eff.value}（${eff.turns}回合）`;
                break;
            case 'buff_def':
                player.tempBuffDef = { value: eff.value, turns: eff.turns };
                msg = `战斗中防御+${eff.value}（${eff.turns}回合）`;
                break;
            case 'breakBonus':
                // 立即触发突破，使用此丹药时自动调用突破
                msg = `破障丹已使用，下次突破成功率+20%`;
                player.breakBonus = (player.breakBonus || 0) + eff.value;
                break;
        }
        if (typeof UI !== 'undefined') {
            UI.toast(`使用${pill.name}：${msg}`, 'good');
            UI.addLog(`使用${pill.name}，${msg}`);
        }
        this.save(player);
        return true;
    },

    /* ---------- 炼制丹药 ---------- */
    craftPill(player, pillId) {
        const pill = getPill(pillId);
        if (!pill || !pill.craft) return false;
        // 检查材料
        for (const matId in pill.craft.materials) {
            const need = pill.craft.materials[matId];
            const have = player.inventory.material[matId] || 0;
            if (have < need) {
                if (typeof UI !== 'undefined') UI.toast(`材料不足：${getMaterial(matId).name}×${need - have}`, 'bad');
                return false;
            }
        }
        // 检查灵石
        if (player.stone < pill.craft.cost) {
            if (typeof UI !== 'undefined') UI.toast(`灵石不足！需要${pill.craft.cost}灵石`, 'bad');
            return false;
        }
        // 扣除材料
        for (const matId in pill.craft.materials) {
            player.inventory.material[matId] -= pill.craft.materials[matId];
            if (player.inventory.material[matId] <= 0) delete player.inventory.material[matId];
        }
        player.stone -= pill.craft.cost;
        // 品质概率浮动：悟性越高，大成功（产出翻倍）概率越大
        const luck = 0.12 + (player.wuxingLevel || 0) * 0.02;
        const big = Math.random() < luck;
        const count = big ? 2 : 1;
        // 添加丹药
        this.addItem(player, pillId, count);
        if (typeof UI !== 'undefined') {
            UI.toast(big ? `炼丹大成功！${pill.name}×${count}` : `炼制成功：${pill.name}×1`, big ? 'gold' : 'gold');
            UI.addLog(big ? `炼丹大成功，${pill.name}×${count}` : `炼制丹药 ${pill.name}`, 'evt');
        }
        this.save(player);
        return true;
    },

    /* ---------- 炼器：锻造装备（品质随缘） ---------- */
    craftEquip(player, eqId) {
        const tpl = getEquipTemplate(eqId);
        if (!tpl || !tpl.craft || tpl.type === 'fabao') return false;
        // 检查材料
        for (const mid in tpl.craft.materials) {
            const need = tpl.craft.materials[mid];
            const have = player.inventory.material[mid] || 0;
            if (have < need) {
                if (typeof UI !== 'undefined') UI.toast(`材料不足：${getMaterial(mid).name}×${need - have}`, 'bad');
                return false;
            }
        }
        // 检查灵石
        if (player.stone < tpl.craft.cost) {
            if (typeof UI !== 'undefined') UI.toast(`灵石不足！需要${tpl.craft.cost}灵石`, 'bad');
            return false;
        }
        // 扣除材料与灵石
        for (const mid in tpl.craft.materials) {
            player.inventory.material[mid] -= tpl.craft.materials[mid];
            if (player.inventory.material[mid] <= 0) delete player.inventory.material[mid];
        }
        player.stone -= tpl.craft.cost;
        // 品质概率浮动：悟性/境界越高，高品概率越大
        const tier = this._rollForgeTier(player);
        const scale = 1 + 0.15 * tier;
        const inst = {
            uid: genUid(),
            baseId: eqId,
            enhance: 0,
            forgeTier: tier,
            atk: Math.round((tpl.atk || 0) * scale),
            def: Math.round((tpl.def || 0) * scale),
            hp: Math.round((tpl.hp || 0) * scale),
            ling: Math.round((tpl.ling || 0) * scale),
            crit: (tpl.crit || 0)
        };
        player.inventory.equipment.push(inst);
        const q = getQuality(tier);
        if (typeof UI !== 'undefined') {
            UI.toast(`锻造${tier >= 3 ? '极品' : '成功'}：${tpl.name}【${q.name}】`, 'gold');
            UI.addLog(`于器炉锻造 ${tpl.name}（${q.name}）`, 'evt');
        }
        this.save(player);
        return true;
    },

    // 锻造品质roll：白(凡)→绿(灵)→蓝(宝)→紫(仙)→橙(神)，luck 提升高品概率
    _rollForgeTier(player) {
        const luck = (player.wuxingLevel || 0) * 0.015 + (player.realmIdx || 0) * 0.005;
        const base = [0.62, 0.23, 0.11, 0.035, 0.005];
        const p = base.map((v, i) => v + (i >= 2 ? luck * 0.3 : (i === 0 ? -luck * 0.6 : 0)));
        const sum = p.reduce((a, b) => a + b, 0);
        const r = Math.random();
        let acc = 0;
        for (let i = 0; i < 5; i++) {
            acc += p[i] / sum;
            if (r < acc) return i;
        }
        return 4;
    },

    /* ---------- 学习功法 ---------- */
    learnGongfa(player, gfId) {
        if (player.inventory.gongfa.includes(gfId)) {
            if (typeof UI !== 'undefined') UI.toast('已拥有此功法', 'bad');
            return false;
        }
        const gf = getGongfa(gfId);
        if (!gf) return false;
        if (player.realmIdx < gf.realmReq) {
            if (typeof UI !== 'undefined') UI.toast(`境界不足，需${getRealm(gf.realmReq).name}境界`, 'bad');
            return false;
        }
        player.inventory.gongfa.push(gfId);
        if (typeof UI !== 'undefined') UI.toast(`习得功法：${gf.name}`, 'gold');
        this.save(player);
        return true;
    },

    /* ---------- 装备功法 ---------- */
    equipGongfa(player, gfId) {
        if (!player.inventory.gongfa.includes(gfId)) {
            if (typeof UI !== 'undefined') UI.toast('尚未习得此功法', 'bad');
            return false;
        }
        player.gongfa = gfId;
        const gf = getGongfa(gfId);
        if (typeof UI !== 'undefined') {
            UI.toast(`已装备功法：${gf.name}`, 'good');
            UI.addLog(`改修 ${gf.name}`);
        }
        this.save(player);
        return true;
    },

    /* ---------- 收服灵宠 ---------- */
    catchPet(player, petId) {
        const pet = getPet(petId);
        if (!pet) return false;
        if (player.realmIdx < pet.realmReq) {
            if (typeof UI !== 'undefined') UI.toast(`境界不足，无法收服${pet.name}`, 'bad');
            return false;
        }
        if (player.pet === petId) {
            if (typeof UI !== 'undefined') UI.toast('已收服此灵宠', 'bad');
            return false;
        }
        player.pet = petId;
        if (typeof UI !== 'undefined') {
            UI.toast(`收服灵宠：${pet.name}！`, 'gold');
            UI.addLog(`收服灵宠 ${pet.name}！`, 'evt');
        }
        this.save(player);
        return true;
    },

    /* ---------- 学习技能 ---------- */
    learnSkill(player, skillId) {
        if (player.skills[skillId]) {
            if (typeof UI !== 'undefined') UI.toast('已学习此技能', 'bad');
            return false;
        }
        const skill = getSkill(skillId);
        if (!skill) return false;
        if (player.realmIdx < skill.realmReq) {
            if (typeof UI !== 'undefined') UI.toast(`境界不足，需${getRealm(skill.realmReq).name}境界`, 'bad');
            return false;
        }
        if (player.xiu < skill.learnCost) {
            if (typeof UI !== 'undefined') UI.toast(`修为不足！需要${fmtNum(skill.learnCost)}修为`, 'bad');
            return false;
        }
        player.xiu -= skill.learnCost;
        player.skills[skillId] = 1;
        if (typeof UI !== 'undefined') {
            UI.toast(`习得神通：${skill.name}！`, 'gold');
            UI.addLog(`习得神通 ${skill.name}`, 'evt');
        }
        this.save(player);
        return true;
    },

    /* ---------- 升级技能 ---------- */
    upgradeSkill(player, skillId) {
        if (!player.skills[skillId]) return false;
        const skill = getSkill(skillId);
        if (!skill) return false;
        const curLv = player.skills[skillId];
        if (curLv >= 100) {
            if (typeof UI !== 'undefined') UI.toast('技能已满级', 'bad');
            return false;
        }
        const cost = Math.floor(skill.learnCost * Math.pow(skill.upCostMult || 1.2, curLv));
        if (player.xiu < cost) {
            if (typeof UI !== 'undefined') UI.toast(`修为不足！需要${fmtNum(cost)}修为`, 'bad');
            return false;
        }
        player.xiu -= cost;
        player.skills[skillId] = curLv + 1;
        if (typeof UI !== 'undefined') {
            UI.toast(`${skill.name}升至${curLv + 1}级`, 'gold');
        }
        this.save(player);
        return true;
    },

    /* ---------- 出售物品 ---------- */
    sellItem(player, category, itemId, count = 1) {
        switch (category) {
            case 'pill': {
                const have = player.inventory.pill[itemId] || 0;
                if (have < count) return false;
                const pill = getPill(itemId);
                const price = Math.floor(pill.price * 0.5) * count;
                player.inventory.pill[itemId] -= count;
                if (player.inventory.pill[itemId] <= 0) delete player.inventory.pill[itemId];
                player.stone += price;
                if (typeof UI !== 'undefined') UI.toast(`出售${pill.name}×${count}，获得${price}灵石`, 'gold');
                break;
            }
            case 'material': {
                const have = player.inventory.material[itemId] || 0;
                if (have < count) return false;
                const mat = getMaterial(itemId);
                const price = Math.floor(mat.price * 0.5) * count;
                player.inventory.material[itemId] -= count;
                if (player.inventory.material[itemId] <= 0) delete player.inventory.material[itemId];
                player.stone += price;
                if (typeof UI !== 'undefined') UI.toast(`出售${mat.name}×${count}，获得${price}灵石`, 'gold');
                break;
            }
            case 'equipment': {
                // 装备出售需要按uid
                return this.sellEquipment(player, itemId);
            }
        }
        this.save(player);
        return true;
    },

    /* ---------- 出售装备 ---------- */
    sellEquipment(player, uid) {
        let eqInstance = player.inventory.equipment.find(e => e.uid === uid)
            || player.inventory.fabao.find(e => e.uid === uid);
        if (!eqInstance) return false;
        const tpl = getEquipTemplate(eqInstance.baseId);
        if (!tpl) return false;
        const q = getQuality(tpl.quality);
        const price = Math.floor(tpl.price * q.sellMult * 0.5) + (eqInstance.enhance || 0) * Math.floor(tpl.price * 0.1);
        player.inventory.equipment = player.inventory.equipment.filter(e => e.uid !== uid);
        player.inventory.fabao = player.inventory.fabao.filter(e => e.uid !== uid);
        player.stone += price;
        if (typeof UI !== 'undefined') UI.toast(`出售${tpl.name}，获得${price}灵石`, 'gold');
        this.save(player);
        return true;
    },

    /* ---------- 立即保存（数据变更必须落盘，不受"自动存档"开关影响） ---------- */
    save(player) {
        if (player) {
            SaveSystem.save(player);
        }
    },

    /* ---------- 检查材料是否足够 ---------- */
    hasMaterials(player, materials) {
        for (const matId in materials) {
            if ((player.inventory.material[matId] || 0) < materials[matId]) return false;
        }
        return true;
    }
};
