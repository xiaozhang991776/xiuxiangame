/* ============================================
   仙途·轮回诀 — 商店与交易系统
   灵石货币 · 购买物品 · 出售换取灵石 · 炼丹
   ============================================ */

const Shop = {
    currentTab: 'buy',
    sellCategory: 'pill',

    /* ---------- 获取购买列表 ---------- */
    getBuyList() {
        const list = [];
        const shop = GameConfig.shopItems;
        // 装备
        shop.equipment.forEach(id => {
            const tpl = getEquipTemplate(id);
            if (tpl) list.push({ type: 'equipment', category: 'equipment', id, ...tpl });
        });
        // 丹药
        shop.pill.forEach(id => {
            const p = getPill(id);
            if (p) list.push({ type: 'pill', category: 'pill', id, ...p });
        });
        // 材料
        shop.material.forEach(id => {
            const m = getMaterial(id);
            if (m) list.push({ type: 'material', category: 'material', id, ...m });
        });
        // 功法
        shop.gongfa.forEach(id => {
            const g = getGongfa(id);
            if (g) list.push({ type: 'gongfa', category: 'gongfa', id, ...g });
        });
        // 法宝
        shop.fabao.forEach(id => {
            const f = getEquipTemplate(id);
            if (f) list.push({ type: 'fabao', category: 'fabao', id, ...f });
        });
        // 灵宠
        shop.pet.forEach(id => {
            const p = getPet(id);
            if (p) list.push({ type: 'pet', category: 'pet', id, ...p });
        });
        return list;
    },

    /* ---------- 购买物品 ---------- */
    buy(player, type, id) {
        let price = 0;
        let canBuy = true;
        let reason = '';
        switch (type) {
            case 'equipment':
            case 'fabao': {
                const tpl = getEquipTemplate(id);
                if (!tpl) return;
                price = tpl.price;
                if (player.realmIdx < (tpl.quality - 1) && tpl.quality > 1) {
                    canBuy = false; reason = '境界不足';
                }
                break;
            }
            case 'pill': {
                const p = getPill(id);
                if (!p) return;
                price = p.price;
                break;
            }
            case 'material': {
                const m = getMaterial(id);
                if (!m) return;
                price = m.price;
                break;
            }
            case 'gongfa': {
                const g = getGongfa(id);
                if (!g) return;
                price = g.price;
                if (player.inventory.gongfa.includes(id)) {
                    canBuy = false; reason = '已拥有';
                }
                if (player.realmIdx < g.realmReq) {
                    canBuy = false; reason = '境界不足';
                }
                break;
            }
            case 'pet': {
                const p = getPet(id);
                if (!p) return;
                price = p.price || (p.realmReq + 1) * 2000;
                if (player.pets && player.pets.find(x => x.id === id)) {
                    canBuy = false; reason = '已拥有';
                }
                if (player.realmIdx < p.realmReq) {
                    canBuy = false; reason = '境界不足';
                }
                break;
            }
        }
        if (!canBuy) {
            if (typeof UI !== 'undefined') UI.toast(reason, 'bad');
            return;
        }
        if (player.stone < price) {
            if (typeof UI !== 'undefined') UI.toast(`灵石不足，需要${price}灵石`, 'bad');
            return;
        }
        player.stone -= price;

        // 根据类型添加
        if (type === 'pet') {
            Inventory.catchPet(player, id);
        } else if (type === 'gongfa') {
            Inventory.learnGongfa(player, id);
            // learnGongfa会判断，强制添加
            if (!player.inventory.gongfa.includes(id)) player.inventory.gongfa.push(id);
        } else {
            Inventory.addItem(player, id, 1);
        }

        if (typeof UI !== 'undefined') {
            let name = '';
            if (type === 'equipment' || type === 'fabao') name = getEquipTemplate(id).name;
            else if (type === 'pill') name = getPill(id).name;
            else if (type === 'material') name = getMaterial(id).name;
            else if (type === 'gongfa') name = getGongfa(id).name;
            else if (type === 'pet') name = getPet(id).name;
            UI.toast(`购买成功：${name}`, 'gold');
            UI.addLog(`坊市购买 ${name}，花费${price}灵石`, 'evt');
            UI.renderAll();
        }
        SaveSystem.save(player);
    },

    /* ---------- 获取出售列表 ---------- */
    getSellList(player, category) {
        return Inventory.getList(player, category);
    },

    /* ---------- 出售物品 ---------- */
    sell(player, category, id, count = 1) {
        Inventory.sellItem(player, category, id, count);
        if (typeof UI !== 'undefined') UI.renderAll();
    },

    /* ---------- 出售装备（按uid） ---------- */
    sellEquipment(player, uid) {
        Inventory.sellEquipment(player, uid);
        if (typeof UI !== 'undefined') UI.renderAll();
    },

    /* ---------- 炼丹 ---------- */
    craft(player, pillId) {
        Inventory.craftPill(player, pillId);
        if (typeof UI !== 'undefined') UI.renderAll();
    },

    /* ---------- 获取炼丹列表 ---------- */
    getCraftList(player) {
        return GameConfig.pills.filter(p => p.craft).map(p => {
            const canCraft = Inventory.hasMaterials(player, p.craft.materials) && player.stone >= p.craft.cost;
            const mats = Object.entries(p.craft.materials).map(([mid, cnt]) => {
                const m = getMaterial(mid);
                const have = player.inventory.material[mid] || 0;
                return { name: m.name, need: cnt, have, enough: have >= cnt };
            });
            return { ...p, canCraft, mats, cost: p.craft.cost };
        });
    },

    /* ---------- 炼器 ---------- */
    forge(player, eqId) {
        Inventory.craftEquip(player, eqId);
        if (typeof UI !== 'undefined') UI.renderAll();
    },

    /* ---------- 获取炼器列表 ---------- */
    getForgeList(player) {
        return GameConfig.equipmentTemplates.filter(e => e.craft && e.type !== 'fabao').map(e => {
            const canCraft = Inventory.hasMaterials(player, e.craft.materials) && player.stone >= e.craft.cost;
            const mats = Object.entries(e.craft.materials).map(([mid, cnt]) => {
                const m = getMaterial(mid);
                const have = player.inventory.material[mid] || 0;
                return { name: m.name, need: cnt, have, enough: have >= cnt };
            });
            return { ...e, canCraft, mats, cost: e.craft.cost };
        });
    }
};
