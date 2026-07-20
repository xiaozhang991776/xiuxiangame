/* ============================================
   仙途·轮回诀 — 修炼系统 & 境界系统
   修炼效率 · 境界突破 · 离线收益应用
   ============================================ */

const Cultivate = {
    /* ---------- 计算修炼效率加成明细 ---------- */
    getRateDetail(player) {
        const realm = getRealm(player.realmIdx);
        let base = 1.0;

        // 境界加成
        const realmMult = 1 + player.realmIdx * 0.5 + (player.realmLayer - 1) * 0.1;
        base *= realmMult;

        // 功法加成
        const gf = getGongfa(player.gongfa);
        const gfBonus = gf ? gf.xiuBonus : 0;
        base *= (1 + gfBonus);

        // 装备加成（装备灵力总和的0.5%）
        let equipLing = 0;
        for (const slot in player.equipped) {
            const eq = player.equipped[slot];
            if (eq) {
                const tpl = getEquipTemplate(eq.baseId);
                if (tpl) {
                    const enhanceBonus = 1 + (eq.enhance || 0) * 0.1;
                    equipLing += (tpl.ling || 0) * enhanceBonus;
                }
            }
        }
        const equipMult = 1 + equipLing * 0.005;
        base *= equipMult;

        // 悟性加成
        const wuxingMult = this.wuxingRateMult(player);
        base *= wuxingMult;

        return {
            base,
            realmMult,
            gfBonus,
            equipMult,
            wuxingMult,
            realmBonus: (realmMult - 1),
            equipBonus: (equipMult - 1),
            wuxingBonus: (wuxingMult - 1)
        };
    },

    /* ---------- 获取当前境界突破所需修为 ---------- */
    getBreakthroughCost(player) {
        const realm = getRealm(player.realmIdx);
        // 当前大境界内，层数越高所需越多
        const layerProgress = (player.realmLayer - 1) / realm.layers;
        return Math.floor(realm.baseXiu * Math.pow(realm.xiuMult, player.realmLayer - 1));
    },

    /* ---------- 获取当前突破（段位/大境界）所需额外灵石 ---------- */
    // 随总段位线性增长：前期便宜，终局约数百万灵石，不随修为指数爆炸而卡死
    getBreakthroughStoneCost(player) {
        const realm = getRealm(player.realmIdx);
        const seq = player.realmIdx * realm.layers + (player.realmLayer - 1);
        return Math.floor(200 + seq * 40000);
    },

    /* ---------- 是否可以突破当前小境界 ---------- */
    canBreakthroughLayer(player) {
        if (player.realmLayer >= getRealm(player.realmIdx).layers) {
            // 满层，需要突破大境界
            return this.canBreakthroughRealm(player);
        }
        return player.xiu >= this.getBreakthroughCost(player);
    },

    /* ---------- 是否可以突破大境界 ---------- */
    canBreakthroughRealm(player) {
        if (player.realmIdx >= GameConfig.realms.length - 1) return false; // 已达最高境界
        if (player.realmLayer < getRealm(player.realmIdx).layers) return false;
        return player.xiu >= this.getBreakthroughCost(player);
    },

    /* ---------- 执行突破 ---------- */
    async breakThrough(player) {
        // 大境界突破
        if (player.realmLayer >= getRealm(player.realmIdx).layers) {
            if (player.realmIdx >= GameConfig.realms.length - 1) {
                if (typeof UI !== 'undefined') UI.toast('已达最高境界，无法突破！', 'bad');
                return false;
            }
            const realm = getRealm(player.realmIdx);
            const cost = this.getBreakthroughCost(player);
            if (player.xiu < cost) {
                if (typeof UI !== 'undefined') UI.toast('修为不足，无法突破！', 'bad');
                return false;
            }
            // 额外灵石门槛
            const stoneCost = this.getBreakthroughStoneCost(player);
            if (player.stone < stoneCost) {
                if (typeof UI !== 'undefined') UI.toast(`灵石不足，突破需${fmtNum(stoneCost)}灵石`, 'bad');
                return false;
            }
            player.stone -= stoneCost;
            // 突破成功率
            let rate = realm.breakthroughRate;
            // 破障丹加成
            if (player.inventory.pill.p_breakthrough > 0) {
                rate += 0.2;
                player.inventory.pill.p_breakthrough--;
                if (typeof UI !== 'undefined') UI.toast('使用破障丹，成功率+20%', 'gold');
            }
            player.xiu -= cost;
            if (Math.random() < rate) {
                // 突破成功
                player.realmIdx++;
                player.realmLayer = 1;
                // 大境界突破增寿元（按新境界）
                player.lifespan = (player.lifespan || 0) + player.realmIdx * 200;
                player.stats.breakthroughs = (player.stats.breakthroughs || 0) + 1;
                const newRealm = getRealm(player.realmIdx);
                if (typeof UI !== 'undefined') {
                    UI.showBreakthroughFX(`突破！${newRealm.name}一层`);
                    UI.toast(`恭喜突破至${newRealm.name}境界！`, 'gold');
                    UI.addLog(`道心通明，突破至${newRealm.name}一层！`, 'evt');
                }
                // 触发任务进度
                if (typeof Quests !== 'undefined') {
                    Quests.tickProgress('realm_idx', player.realmIdx + 1);
                    Quests.tickProgress('realm_layer', player.realmIdx * 100 + player.realmLayer);
                }
                this.save(player);
                return true;
            } else {
                // 突破失败，损失部分修为
                const loss = Math.floor(cost * 0.3);
                player.xiu = Math.max(0, player.xiu - loss);
                if (typeof UI !== 'undefined') {
                    UI.toast('突破失败，走火入魔！', 'bad');
                    UI.addLog(`突破失败，损失${fmtNum(loss)}修为`, 'bad');
                }
                this.save(player);
                return false;
            }
        }
        // 小境界突破（必成功）
        const cost = this.getBreakthroughCost(player);
        if (player.xiu < cost) {
            if (typeof UI !== 'undefined') UI.toast('修为不足，无法突破！', 'bad');
            return false;
        }
        // 额外灵石门槛
        const stoneCost = this.getBreakthroughStoneCost(player);
        if (player.stone < stoneCost) {
            if (typeof UI !== 'undefined') UI.toast(`灵石不足，突破需${fmtNum(stoneCost)}灵石`, 'bad');
            return false;
        }
        player.stone -= stoneCost;
        player.xiu -= cost;
        player.realmLayer++;
        player.stats.breakthroughs = (player.stats.breakthroughs || 0) + 1;
        const realm = getRealm(player.realmIdx);
        if (typeof UI !== 'undefined') {
            UI.showBreakthroughFX(`${realm.name}${cnNum(player.realmLayer)}层`);
            UI.toast(`突破至${realm.name}${cnNum(player.realmLayer)}层`, 'gold');
            UI.addLog(`修为精进，突破至${realm.name}${cnNum(player.realmLayer)}层`, 'evt');
        }
        if (typeof Quests !== 'undefined') {
            Quests.tickProgress('realm_layer', player.realmIdx * 100 + player.realmLayer);
        }
        this.save(player);
        return true;
    },

    SECLUDE_EFFICIENCY: 0.0015, // 闭关修为收益系数（从 0.15 再除以 100）

    // 悟性系统：顿悟消耗资源，永久提升每次点击修为与修炼速率
    WUXING_MAX: 50,            // 悟性上限（重）
    WUXING_TAP_PER: 1000,    // 每重：每次点击修炼修为 ×10000（+100000%）
    WUXING_RATE_PER: 500,    // 每重：修炼速率 ×10000（+50000%）
    wuxingTapMult(player) { return 1 + (player.wuxingLevel || 0) * this.WUXING_TAP_PER; },
    wuxingRateMult(player) { return 1 + (player.wuxingLevel || 0) * this.WUXING_RATE_PER; },
    // 顿悟到下一级的资源成本（指数增长，门槛较高）
    enlightenCosts(player) {
        const lv = player.wuxingLevel || 0;
        return {
            stone: Math.floor(5000 * Math.pow(5, lv)),
            xiu:   Math.floor(50000 * Math.pow(5, lv))
        };
    },
    // 顿悟：消耗指定类型资源，提升一级悟性
    enlighten(player, type) {
        const lv = player.wuxingLevel || 0;
        if (lv >= this.WUXING_MAX) {
            if (typeof UI !== 'undefined') UI.toast('悟性已臻化境，无法再顿悟', 'bad');
            return false;
        }
        const c = this.enlightenCosts(player);
        let ok = false;
        if (type === 'stone') { if (player.stone >= c.stone) { player.stone -= c.stone; ok = true; } }
        else if (type === 'xiu') { if (player.xiu >= c.xiu) { player.xiu -= c.xiu; ok = true; } }
        else { return false; }
        if (!ok) {
            if (typeof UI !== 'undefined') UI.toast('资源不足，无法顿悟', 'bad');
            return false;
        }
        player.wuxingLevel = lv + 1;
        this.save(player);
        if (typeof UI !== 'undefined') {
            UI.toast(`顿悟成功！悟性升至 ${player.wuxingLevel} 重，每次修炼修为+${Math.round((this.wuxingTapMult(player) - 1) * 100)}%、修炼速率+${Math.round((this.wuxingRateMult(player) - 1) * 100)}%`, 'gold');
            UI.addLog(`灵台清明，悟性突破至第 ${player.wuxingLevel} 重`, 'evt');
        }
        return true;
    },

    /* ---------- 闭关潜修（消耗寿元换修为） ---------- */
    seclude(player, years) {
        years = Math.floor(years);
        if (!years || years <= 0) {
            if (typeof UI !== 'undefined') UI.toast('请选择闭关时长', 'bad');
            return null;
        }
        if (years > (player.lifespan || 0)) {
            if (typeof UI !== 'undefined') UI.toast(`寿元不足，仅余${player.lifespan}年`, 'bad');
            return null;
        }
        // 修为收益 = 年数 × 每秒修炼速率 × 一年的秒数 × 折损系数
        const rate = SaveSystem.calcCultivateRate(player);
        const xiuGain = Math.floor(years * rate * 31536000 * this.SECLUDE_EFFICIENCY);
        player.lifespan -= years;
        // 寿元耗尽：羽化归虚，游戏重开
        if (player.lifespan <= 0) {
            player.lifespan = 0;
            this.save(player);
            if (typeof UI !== 'undefined') UI.addLog(`${player.name}寿元已尽，羽化归虚……`, 'evt');
            if (typeof Game !== 'undefined' && typeof Game.onLifespanZero === 'function') {
                Game.onLifespanZero(player);
            }
            return { xiu: xiuGain, years, dead: true };
        }
        player.xiu += xiuGain;
        player.stats.totalXiu = (player.stats.totalXiu || 0) + xiuGain;
        this.save(player);
        if (typeof Quests !== 'undefined') Quests.tickProgress('xiu_total', player.stats.totalXiu);
        if (typeof UI !== 'undefined') UI.addLog(`闭关${years}年，悟得${fmtNum(xiuGain)}修为（耗寿元${years}年）`, 'evt');
        return { xiu: xiuGain, years };
    },

    /* ---------- 获取当前境界名 ---------- */
    getRealmName(player) {
        const realm = getRealm(player.realmIdx);
        return `${realm.name}${cnNum(player.realmLayer)}层`;
    },

    /* ---------- 计算玩家最终属性（含境界、装备、永久加成） ---------- */
    calcFinalStats(player) {
        const realm = getRealm(player.realmIdx);
        const layerBonus = (player.realmLayer - 1) / realm.layers; // 0~1
        const realmAtk = Math.floor(realm.atkBonus * (1 + layerBonus));
        const realmDef = Math.floor(realm.defBonus * (1 + layerBonus));
        const realmHp = Math.floor(realm.hpBonus * (1 + layerBonus));
        const realmLing = Math.floor(realm.lingBonus * (1 + layerBonus));

        let atk = player.baseAtk + realmAtk + (player.permBonus.atk || 0);
        let def = player.baseDef + realmDef + (player.permBonus.def || 0);
        let hp = player.baseHp + realmHp + (player.permBonus.hp || 0);
        let ling = player.baseLing + realmLing + (player.permBonus.ling || 0);
        let spd = player.baseSpd;
        let crit = player.baseCrit;

        // 装备加成
        for (const slot in player.equipped) {
            const eq = player.equipped[slot];
            if (eq) {
                const tpl = getEquipTemplate(eq.baseId);
                if (tpl) {
                    const enhance = 1 + (eq.enhance || 0) * 0.15;
                    atk += Math.floor((tpl.atk || 0) * enhance);
                    def += Math.floor((tpl.def || 0) * enhance);
                    hp += Math.floor((tpl.hp || 0) * enhance);
                    ling += Math.floor((tpl.ling || 0) * enhance);
                    crit += (tpl.crit || 0);
                }
            }
        }

        // 灵宠加成
        if (player.pet) {
            const pet = getPet(player.pet);
            if (pet) {
                atk += Math.floor(pet.atk * 0.3);
                def += Math.floor(pet.def * 0.3);
                hp += Math.floor(pet.hp * 0.2);
            }
        }

        return { atk, def, hp, ling, spd, crit, realmAtk, realmDef, realmHp, realmLing };
    },

    /* ---------- 切换修炼状态 ---------- */
    toggleCultivate() {
        Game.cultivating = !Game.cultivating;
        const btn = document.getElementById('cultivateToggle');
        const status = document.getElementById('cultivateStatus');
        if (btn) btn.textContent = Game.cultivating ? '暂停修炼' : '开始修炼';
        if (status) status.textContent = Game.cultivating ? '气机流转，修为缓缓增长' : '修炼已暂停';
        if (typeof UI !== 'undefined') UI.toast(Game.cultivating ? '开始修炼' : '修炼已暂停', 'good');
    },

    /* ---------- 手动修炼（点击一次立即获得修为） ---------- */
    tapCombo: 0,
    tapComboTimer: 0,
    manualCultivate(player) {
        if (!player) return 0;
        const rate = SaveSystem.calcCultivateRate(player);
        // 连击：1.5 秒内连续点击累积连击，最高 x2 加成
        const now = Date.now();
        if (this.tapComboTimer && now - this.tapComboTimer < 1500) {
            this.tapCombo = Math.min(this.tapCombo + 1, 12);
        } else {
            this.tapCombo = 1;
        }
        this.tapComboTimer = now;
        const comboMult = 1 + (this.tapCombo - 1) * 0.08; // 最高约 1.88x
        // 每次点击 ≈ 3 秒被动修炼收益，再乘连击
        const gain = Math.max(1, Math.floor(rate * 3 * comboMult * this.wuxingTapMult(player)));
        player.xiu += gain;
        player.stats.totalXiu = (player.stats.totalXiu || 0) + gain;
        // 任务进度
        if (typeof Quests !== 'undefined') Quests.tickProgress('xiu_total', player.stats.totalXiu);
        // 视觉反馈
        if (typeof UI !== 'undefined') {
            UI.showTapGain(gain, this.tapCombo > 1 ? this.tapCombo : 0);
            UI.updateResourceBar();
            UI.updateCultivationBar();
        }
        this.save(player);
        return gain;
    },

    /* ---------- 立即保存 ---------- */
    save(player) {
        if (player && player.settings && player.settings.autoSave) {
            SaveSystem.save(player);
        }
    }
};

/* 中文数字 */
function cnNum(n) {
    const map = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    if (n <= 10) return map[n];
    if (n < 20) return '十' + map[n - 10];
    return n.toString();
}
