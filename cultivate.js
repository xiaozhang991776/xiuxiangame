/* ============================================
   仙途·轮回诀 — 修炼系统 & 境界系统
   修炼效率 · 境界突破 · 离线收益应用
   ============================================ */

const Cultivate = {
    /* ---------- 计算修炼效率加成明细 ---------- */
    getRateDetail(player) {
        const realm = getRealm(player.realmIdx);
        let base = 1.0;

        // 境界加成：让修炼速率随「下一层突破所需战力」同步指数增长。
        // 原线性加成(1+realmIdx*0.5+...)导致高境界(大乘+)战力需求爆炸、速率却线性增长，
        // 曾需数十万年闭关，且满层成本溢出 JS 安全整数(9e15)而永远卡死。
        // 现令 base ∝ baseXiu * xiuMult^(layer-1)（即下一层突破成本），使每层所需闭关时长与境界无关。
        const layerExp = Math.pow(realm.xiuMult, player.realmLayer - 1);
        const realmMult = Math.max(1, (realm.baseXiu * layerExp) / 5e6);
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
                    const enhanceBonus = 1 + (eq.enhance || 0) * 0.15;
                    equipLing += (tpl.ling || 0) * enhanceBonus;
                }
            }
        }
        const equipMult = 1 + equipLing * 0.0015;
        base *= equipMult;

        // 悟性加成
        const wuxingMult = this.wuxingRateMult(player);
        base *= wuxingMult;

        // 渡劫加成（劫后余韵）
        const trib = this.getTribulusBonus(player);
        const tribulusMult = 1 + trib.xiuMult;
        base *= tribulusMult;

        // 转世轮回加成
        const rb = this.getRebirthBonus(player);
        const rebirthMult = 1 + rb.xiuMult;
        base *= rebirthMult;

        // 天赋加成（悟道系·明悟）
        const talentXiu = (typeof Talent !== 'undefined') ? Talent.xiuRateMult(player) : 1;
        base *= talentXiu;

        // 难度系数：修炼速率 ×rateMult（默认 1；调难时 <1 让战力获取整体变慢）
        base *= (typeof DIFF !== 'undefined') ? DIFF.rateMult : 1;
        // 硬顶：最终修炼速率不得超过 JS 安全整数，防止界面上出现无法阅读的超大数字，也避免后续点击/闭关收益中间值溢出
        base = Math.min(base, Number.MAX_SAFE_INTEGER);

        return {
            base,
            realmMult,
            gfBonus,
            equipMult,
            wuxingMult,
            tribulusMult,
            rebirthMult,
            talentXiu,
            tribulusBonus: (tribulusMult - 1),
            rebirthBonus: (rebirthMult - 1),
            talentBonus: (talentXiu - 1),
            realmBonus: (realmMult - 1),
            equipBonus: (equipMult - 1),
            wuxingBonus: (wuxingMult - 1)
        };
    },

    /* ---------- 获取当前境界突破所需战力 ---------- */
    getBreakthroughCost(player) {
        const realm = getRealm(player.realmIdx);
        // 当前大境界内，层数越高所需越多
        const layerProgress = (player.realmLayer - 1) / realm.layers;
        // 难度系数：突破所需战力 ×breakXiuMult（调难时 >1）
        // 道祖(idx 12)之后的超脱系段位，突破难度统一 ×900（×30 基础上再×30）
        const postDaoguMult = player.realmIdx > 12 ? 900 : 1;
        return Math.floor(realm.baseXiu * Math.pow(realm.xiuMult, player.realmLayer - 1) * postDaoguMult * (typeof DIFF !== 'undefined' ? DIFF.breakXiuMult : 1));
    },

    /* ---------- 获取当前突破（段位/大境界）所需额外灵石 ---------- */
    // 随总段位线性增长：前期便宜，终局约数百万灵石，不随战力指数爆炸而卡死
    getBreakthroughStoneCost(player) {
        const realm = getRealm(player.realmIdx);
        const seq = player.realmIdx * realm.layers + (player.realmLayer - 1);
        // 随坊市物价 ×10 同步上调，使突破灵石门槛与坊市（同为灵石支付）重新挂钩；难度系数再 ×breakStoneMult
        // 道祖之后（realmIdx>12）段位难度 ×900（×30 基础上再×30），与突破战力门槛/斗法敌人强度一致
        const overCap = player.realmIdx > 12 ? 900 : 1;
        return Math.floor((2000 + seq * 400000) * overCap * (typeof DIFF !== 'undefined' ? DIFF.breakStoneMult : 1));
    },

    /* ---------- 是否可以突破当前小境界 ---------- */
    canBreakthroughLayer(player) {
        if (player.realmLayer >= getRealm(player.realmIdx).layers) {
            // 满层，需要突破大境界
            return this.canBreakthroughRealm(player);
        }
        return player.zhanli >= this.getBreakthroughCost(player);
    },

    /* ---------- 是否可以突破大境界 ---------- */
    canBreakthroughRealm(player) {
        if (player.realmIdx >= GameConfig.realms.length - 1) return false; // 已达最高境界
        if (player.realmLayer < getRealm(player.realmIdx).layers) return false;
        return player.zhanli >= this.getBreakthroughCost(player);
    },

    /* ---------- 执行突破 ---------- */
    async breakThrough(player) {
        // 大境界突破
        if (player.realmLayer >= getRealm(player.realmIdx).layers) {
            if (player.realmIdx >= GameConfig.realms.length - 1) {
                if (typeof UI !== 'undefined') UI.toast('已达最高境界，无法突破！', 'bad');
                return false;
            }
            // 今生不再设境界天花板：进度由「今生战力上线」(getLifeZhanliCap) 自然限速——
            // 战力涨到上线即停，付不起更高突破成本，需轮回提升上线方可更进一步
            const realm = getRealm(player.realmIdx);
            const cost = this.getBreakthroughCost(player);
            if (player.zhanli < cost) {
                if (typeof UI !== 'undefined') UI.toast('战力不足，无法突破！', 'bad');
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
            // 天命系·通玄 天赋加成
            if (typeof Talent !== 'undefined') rate = Math.min(1, rate + Talent.breakRateAdd(player));
            // 破障丹加成（库存自动消耗 + 手动使用累积）
            let btBonus = player.breakBonus || 0;
            if (player.inventory.pill.p_breakthrough > 0) {
                btBonus += 0.2;
                player.inventory.pill.p_breakthrough--;
                if (typeof UI !== 'undefined') UI.toast('使用破障丹，成功率+20%', 'gold');
            }
            if (btBonus > 0) {
                rate = Math.min(1, rate + btBonus);
                player.breakBonus = 0;
            }
            player.zhanli -= cost;
            if (Math.random() < rate) {
                // 突破成功
                player.realmIdx++;
                player.realmLayer = 1;
                // 大境界突破增寿元（按新境界；改1：由 500×境界序 收到 250×境界序，使单世寿元更紧、轮回节奏更密）
                player.lifespan = (player.lifespan || 0) + player.realmIdx * 250;
                player.stats.breakthroughs = (player.stats.breakthroughs || 0) + 1;
                // 突破大境界：觉醒天赋点（核心长线成长）
                if (typeof Talent !== 'undefined') {
                    Talent.grant(player, 3);
                    if (typeof UI !== 'undefined') UI.toast('境界突破，觉醒天赋点 +3！前往「天赋」面板修习', 'gold');
                }
                const newRealm = getRealm(player.realmIdx);
                if (typeof UI !== 'undefined') {
                    UI.showBreakthroughFX(`突破！${newRealm.name}一层`);
                    UI.toast(`恭喜突破至${newRealm.name}境界！`, 'gold');
                    UI.addLog(`道心通明，突破至${newRealm.name}一层！`, 'evt');
                    if (typeof Sound !== 'undefined') Sound.play('levelup');
                }
                // 突破大境界成功，触发天劫
                this.tribulateAfterBreakthrough(player);
                // 仙途主线：解锁并弹出对应章节（带 typeof 兜底）
                if (typeof MainStory !== 'undefined') MainStory.onBreakthrough(player);
                // 触发任务进度
                if (typeof Quests !== 'undefined') {
                    Quests.tickProgress('realm_idx', player.realmIdx + 1);
                    Quests.tickProgress('realm_layer', player.realmIdx * 100 + player.realmLayer);
                }
                this.save(player);
                return true;
            } else {
                // 突破失败，损失部分战力
                const loss = Math.floor(cost * 0.3);
                player.zhanli = Math.max(0, player.zhanli - loss);
                if (typeof UI !== 'undefined') {
                    UI.toast('突破失败，走火入魔！', 'bad');
                    UI.addLog(`突破失败，损失${fmtNum(loss)}战力`, 'bad');
                }
                this.save(player);
                return false;
            }
        }
        // 小境界突破（必成功）
        const cost = this.getBreakthroughCost(player);
        if (player.zhanli < cost) {
            if (typeof UI !== 'undefined') UI.toast('战力不足，无法突破！', 'bad');
            return false;
        }
        // 额外灵石门槛
        const stoneCost = this.getBreakthroughStoneCost(player);
        if (player.stone < stoneCost) {
            if (typeof UI !== 'undefined') UI.toast(`灵石不足，突破需${fmtNum(stoneCost)}灵石`, 'bad');
            return false;
        }
        player.stone -= stoneCost;
        player.zhanli -= cost;
        player.realmLayer++;
        // 段位（小境界）突破也增寿元（少量，按当前境界；大境界突破仍是主要来源）
        const layerLife = 20 + player.realmIdx * 3;
        player.lifespan = (player.lifespan || 0) + layerLife;
        player.stats.breakthroughs = (player.stats.breakthroughs || 0) + 1;
        // 每满 5 小境界：额外天赋点
        if (player.realmLayer % 5 === 0 && typeof Talent !== 'undefined') {
            Talent.grant(player, 1);
            if (typeof UI !== 'undefined') UI.toast('境界精进，天赋点 +1', 'gold');
        }
        const realm = getRealm(player.realmIdx);
        if (typeof UI !== 'undefined') {
            UI.showBreakthroughFX(`${realm.name}${cnNum(player.realmLayer)}层`);
            UI.toast(`突破至${realm.name}${cnNum(player.realmLayer)}层（寿元+${fmtNum(layerLife)}）`, 'gold');
            UI.addLog(`战力精进，突破至${realm.name}${cnNum(player.realmLayer)}层`, 'evt');
            if (typeof Sound !== 'undefined') Sound.play('success');
        }
        if (typeof Quests !== 'undefined') {
            Quests.tickProgress('realm_layer', player.realmIdx * 100 + player.realmLayer);
        }
        this.save(player);
        return true;
    },

    SECLUDE_EFFICIENCY: 0.0015, // 闭关战力收益系数（从 0.15 再除以 100）
    SECLUDE_RATE_K: 1e5,       // 闭关效率边际递减阈值：rate 超过此值后单位闭关收益被压缩，防止后期闭关收益随 rate 指数暴涨而碾压突破（rate≪K 时不衰减，rate≫K 时收益封顶不再膨胀）。再削弱档：从 3e6 降至 1e5，使中期(元婴~道祖)闭关100年收益从≈1层削到≈0.68层、后期(道祖满层)彻底封死；前期(练气~金丹)因 rate≪K 完全不动。
    YOULI_BASE_STONE: 60000,   // 游历：每游历一年基础灵石（练气期）；×100 倍（原 200；曾×15→×10→再×10）
    YOULI_GROWTH: 1.6,        // 游历灵石随境界增长系数

    // 悟性系统：顿悟消耗资源，永久提升每次点击战力与修炼速率
    WUXING_MAX: 100,           // 悟性上限（重）
    WUXING_TAP_PER: 15,     // 每重：每次点击修炼战力 +1500%（100重共×1501）；用户要求「悟性加成×100」（原 0.15）
    WUXING_RATE_PER: 15,     // 每重：修炼速率 +1500%（100重共×1501）；用户要求「悟性加成×100」（原 0.15）
    // 顿悟成本增长：基底小、指数温和，全程被钳制在「战力上限 ZHANLI_CAP」内可达，不溢出
    // 注：曾被钳到 Number.MAX_SAFE_INTEGER(9e15) 导致高悟性（≈60重起）单级费用卡死在 9007.20兆不再增长；
    //     现统一钳到 ZHANLI_CAP(1e30)，与「战力上限解除」「战力路径」保持一致，费用能持续、可见地增长
    WUXING_ZHANLI_BASE: 50000, WUXING_ZHANLI_GROWTH: 3,       // 战力路径：100 重单级被钳到 ZHANLI_CAP(1e30)
    WUXING_STONE_BASE: 5000, WUXING_STONE_GROWTH: 1.2,  // 灵石路径：100 重单级被钳到 ZHANLI_CAP(1e30)，指数调小(1.7→1.2)使费用增长更平滑
    wuxingTapMult(player) { return 1 + (player.wuxingLevel || 0) * this.WUXING_TAP_PER; },
    wuxingRateMult(player) { return 1 + (player.wuxingLevel || 0) * this.WUXING_RATE_PER; },
    // 顿悟到下一级的资源成本（指数增长，门槛较高；双路径分别钳制，确保全程可达）
    enlightenCosts(player) {
        const lv = player.wuxingLevel || 0;
        return {
            stone: Math.floor(Math.min(this.WUXING_STONE_BASE * Math.pow(this.WUXING_STONE_GROWTH, lv), ZHANLI_CAP)),
            zhanli:   Math.floor(Math.min(this.WUXING_ZHANLI_BASE * Math.pow(this.WUXING_ZHANLI_GROWTH, lv), ZHANLI_CAP))
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
        else if (type === 'zhanli') { if (player.zhanli >= c.zhanli) { player.zhanli -= c.zhanli; ok = true; } }
        else { return false; }
        if (!ok) {
            if (typeof UI !== 'undefined') UI.toast('资源不足，无法顿悟', 'bad');
            return false;
        }
        player.wuxingLevel = lv + 1;
        this.save(player);
        if (typeof UI !== 'undefined') {
            UI.toast(`顿悟成功！悟性升至 ${player.wuxingLevel} 重，每次修炼战力+${Math.round((this.wuxingTapMult(player) - 1) * 100)}%、修炼速率+${Math.round((this.wuxingRateMult(player) - 1) * 100)}%`, 'gold');
            UI.addLog(`灵台清明，悟性突破至第 ${player.wuxingLevel} 重`, 'evt');
        }
        return true;
    },

    /* ---------- 闭关潜修（消耗寿元换战力） ---------- */
    // 闭关战力收益（与 seclude 同公式，纯计算无副作用）：供 UI 预览与实际结算共用，杜绝「UI 预览与实际到手不符」的脱节 bug
    _secludeZhanliGain(player, years) {
        const rate = SaveSystem.calcCultivateRate(player);
        // 边际递减：rate 越高，单位闭关收益越低（effFactor = 1/(1+rate/K)）。
        // rate≪K 时 effFactor≈1（前期/中期不受削）；rate≫K 时 effFactor→K/rate，闭关收益封顶、不再随 rate 指数膨胀碾压突破。
        const effFactor = 1 / (1 + rate / this.SECLUDE_RATE_K);
        return Math.min(Math.floor(years * rate * 31536000 * this.SECLUDE_EFFICIENCY * effFactor), ZHANLI_CAP);
    },
    // 预览：给定年数的闭关战力收益（不扣寿命、不改状态），供 UI 闭关面板显示
    previewSeclude(player, years) {
        years = Math.floor(years);
        if (!years || years <= 0) return 0;
        return this._secludeZhanliGain(player, years);
    },
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
        // 战力收益 = 年数 × 每秒修炼速率 × 一年的秒数 × 折损系数（收益额本身钳 ZHANLI_CAP 防溢出）
        const xiuGain = this._secludeZhanliGain(player, years);
        player.lifespan -= years;
        // 寿元耗尽：羽化归虚，游戏重开
        if (player.lifespan <= 0) {
            player.lifespan = 0;
            this.save(player);
            if (typeof UI !== 'undefined') UI.addLog(`${player.name}寿元已尽，羽化归虚……`, 'evt');
            if (typeof Game !== 'undefined' && typeof Game.onLifespanZero === 'function') {
                Game.onLifespanZero(player);
            }
            return { zhanli: xiuGain, years, dead: true };
        }
        // 战力钳到「今生战力上线」（终局解锁后=ZHANLI_CAP）；累计战力统计仍钳 ZHANLI_CAP
        this.gainZhanli(player, xiuGain);
        this.save(player);
        if (typeof Quests !== 'undefined') Quests.tickProgress('zhanli_total', player.stats.totalZhanli);
        if (typeof UI !== 'undefined') UI.addLog(`闭关${years}年，悟得${fmtNum(xiuGain)}战力（耗寿元${years}年）`, 'evt');
        if (typeof Sound !== 'undefined') Sound.play('coin');
        return { zhanli: xiuGain, years };
    },

    /* ---------- 游历（消耗寿元，获得灵石/材料/丹药） ---------- */
    // 按当前境界从配置池里挑一件（品质不超 allow）
    _pickByRealm(list, realmIdx) {
        const allow = Math.min(4, Math.floor((realmIdx || 0) / 3));
        const pool = list.filter(x => (x.quality || 0) <= allow);
        const src = pool.length ? pool : list;
        return src[Math.floor(Math.random() * src.length)];
    },

    youli(player, years) {
        years = Math.floor(years);
        if (!years || years <= 0) {
            if (typeof UI !== 'undefined') UI.toast('请选择游历时长', 'bad');
            return null;
        }
        if (years > (player.lifespan || 0)) {
            if (typeof UI !== 'undefined') UI.toast(`寿元不足，仅余${player.lifespan}年`, 'bad');
            return null;
        }
        const realmIdx = player.realmIdx || 0;
        // 难度系数：游历灵石收入 ×incomeMult（调难时 <1，资源更紧）
        const stonePerYear = this.YOULI_BASE_STONE * Math.pow(this.YOULI_GROWTH, realmIdx) * (typeof DIFF !== 'undefined' ? DIFF.incomeMult : 1);
        let stoneGain = Math.floor(years * stonePerYear * (0.85 + Math.random() * 0.3));

        const gains = { stone: stoneGain, materials: [], pills: [] };
        const matMap = {};
        const pillMap = {};

        // 材料：每年约 0.12 份，每份随机 1~3 个（封顶避免极端）
        let matStacks = Math.min(300, Math.floor(years * 0.12) + (Math.random() < 0.4 ? 1 : 0));
        for (let i = 0; i < matStacks; i++) {
            const m = this._pickByRealm(GameConfig.materials, realmIdx);
            matMap[m.id] = (matMap[m.id] || 0) + 1 + Math.floor(Math.random() * 3);
        }
        // 丹药：每 5 年约 25% 概率（封顶避免极端）
        let pillRolls = Math.min(400, Math.floor(years / 5));
        for (let i = 0; i < pillRolls; i++) {
            if (Math.random() < 0.25) {
                const p = this._pickByRealm(GameConfig.pills, realmIdx);
                pillMap[p.id] = (pillMap[p.id] || 0) + 1;
            }
        }
        // 奇遇：8% 概率大额灵石 + 一件稀有宝物（品质 +1）
        let fortune = false, fortuneText = '';
        if (Math.random() < 0.08) {
            fortune = true;
            const bonus = Math.floor(stoneGain * (2 + Math.random() * 3));
            stoneGain += bonus;
            gains.stone = stoneGain;
            const allow = Math.min(4, Math.floor(realmIdx / 3));
            const rarePool = GameConfig.materials.concat(GameConfig.pills)
                .filter(x => (x.quality || 0) === Math.min(4, allow + 1));
            if (rarePool.length) {
                const r = rarePool[Math.floor(Math.random() * rarePool.length)];
                if (GameConfig.materials.indexOf(r) >= 0) matMap[r.id] = (matMap[r.id] || 0) + 1;
                else pillMap[r.id] = (pillMap[r.id] || 0) + 1;
            }
            fortuneText = `途中逢奇遇，额外获得 ${fmtNum(bonus)} 灵石及稀有宝物！`;
        }

        // 写入背包
        Object.keys(matMap).forEach(id => {
            const tpl = GameConfig.materials.find(m => m.id === id);
            Inventory.addItem(player, id, matMap[id]);
            gains.materials.push({ name: tpl.name, icon: tpl.icon, count: matMap[id] });
        });
        Object.keys(pillMap).forEach(id => {
            const tpl = GameConfig.pills.find(m => m.id === id);
            Inventory.addItem(player, id, pillMap[id]);
            gains.pills.push({ name: tpl.name, icon: tpl.icon, count: pillMap[id] });
        });

        // 扣除寿元
        player.lifespan -= years;
        if (player.lifespan <= 0) {
            player.lifespan = 0;
            const _rbD = this.getRebirthBonus(player);
            player.stone += Math.floor(stoneGain * (this.getTribulusBonus(player).stoneMult + 1) * (1 + _rbD.stoneMult) * this.stoneGainMult(player));
            this.save(player);
            if (typeof UI !== 'undefined') UI.addLog(`${player.name}游历${years}年，寿元已尽，羽化归虚……`, 'evt');
            if (typeof Game !== 'undefined' && typeof Game.onLifespanZero === 'function') {
                Game.onLifespanZero(player);
            }
            return { years, dead: true, stone: stoneGain, materials: gains.materials, pills: gains.pills, fortune, fortuneText };
        }
        const _rbN = this.getRebirthBonus(player);
        player.stone += Math.floor(stoneGain * (this.getTribulusBonus(player).stoneMult + 1) * (1 + _rbN.stoneMult) * this.stoneGainMult(player));
        this.save(player);
        if (typeof UI !== 'undefined') UI.addLog(`游历${years}年，收获${fmtNum(stoneGain)}灵石及诸多宝物`, 'evt');
        if (typeof Sound !== 'undefined') Sound.play('coin');
        return { years, stone: stoneGain, materials: gains.materials, pills: gains.pills, fortune, fortuneText };
    },

    /* ---------- 拿战力换灵石 ---------- */
    // 将富余战力兑换成灵石，缓解灵石卡突破/采买；兑换会消耗战力，可能拖慢突破，由玩家权衡
    ZHANLI_TO_STONE_RATE: 0.0005, // 汇率：约 2000 战力 ≈ 1 灵石（档位见 UI.openExchange）
    exchangeZhanliForStone(player, xiuAmount) {
        xiuAmount = Math.floor(xiuAmount);
        if (!xiuAmount || xiuAmount <= 0) {
            if (typeof UI !== 'undefined') UI.toast('请输入兑换的战力数量', 'bad');
            return null;
        }
        if (xiuAmount > (player.zhanli || 0)) {
            if (typeof UI !== 'undefined') UI.toast('战力不足', 'bad');
            return null;
        }
        const stone = Math.floor(xiuAmount * this.ZHANLI_TO_STONE_RATE);
        if (stone <= 0) {
            if (typeof UI !== 'undefined') UI.toast('兑换所得灵石过少', 'bad');
            return null;
        }
        player.zhanli -= xiuAmount;
        const _rbX = this.getRebirthBonus(player);
        player.stone += Math.floor(stone * (this.getTribulusBonus(player).stoneMult + 1) * (1 + _rbX.stoneMult) * this.stoneGainMult(player));
        this.save(player);
        if (typeof UI !== 'undefined') {
            UI.addLog(`以${fmtNum(xiuAmount)}战力，兑换得${fmtNum(stone)}灵石`, 'evt');
        }
        return { zhanliSpent: xiuAmount, stoneGot: stone };
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
        let spd = player.baseSpd + (player.permBonus.spd || 0);
        let crit = player.baseCrit + (player.permBonus.crit || 0);

        // 装备加成（锻造装备优先用实例属性，其余按模板×强化）
        for (const slot in player.equipped) {
            const eq = player.equipped[slot];
            if (eq) {
                const tpl = getEquipTemplate(eq.baseId);
                if (tpl) {
                    const enhance = 1 + (eq.enhance || 0) * 0.15;
                    const instVal = (k) => (eq[k] !== undefined ? eq[k] : (tpl[k] || 0));
                    atk += Math.floor(instVal('atk') * enhance);
                    def += Math.floor(instVal('def') * enhance);
                    hp += Math.floor(instVal('hp') * enhance);
                    ling += Math.floor(instVal('ling') * enhance);
                    crit += instVal('crit');
                }
            }
        }

        // 灵宠加成（出战灵宠，按培养等级/化形缩放）
        if (player.pet && typeof PetSys !== 'undefined') {
            const inst = PetSys.active(player);
            const ps = inst ? PetSys.instStats(player, inst) : null;
            if (ps) {
                atk += Math.floor(ps.atk * 0.3);
                def += Math.floor(ps.def * 0.3);
                hp += Math.floor(ps.hp * 0.2);
            }
        }

        // 转世轮回加成（仅 攻击 / 气血，根基越厚属性越强）
        const rb = this.getRebirthBonus(player);
        atk = Math.floor(atk * rb.atkMult);
        hp = Math.floor(hp * rb.hpMult);

        // 天赋加成（最终统一乘区，覆盖全属性）
        if (typeof Talent !== 'undefined' && player.talents) {
            const ts = Talent.applyStats({ atk, def, hp, ling, spd, crit }, player);
            atk = ts.atk; def = ts.def; hp = ts.hp; ling = ts.ling; spd = ts.spd; crit = ts.crit;
        }

        // 大道+ 独立乘区：法则 × 法宝 × 洞天（互不稀释）
        if (player.realmIdx >= 32) {
            const lawM = (typeof Laws !== 'undefined') ? Laws.totalMult(player) : 1;
            const trM  = (typeof Treasure !== 'undefined') ? Treasure.mult(player) : 1;
            const caM  = (typeof Cave !== 'undefined') ? Cave.totalMult(player) : 1;
            const m = lawM * trM * caM;
            if (m > 1) {
                atk = Math.floor(atk * m);
                def = Math.floor(def * m);
                hp  = Math.floor(hp  * m);
                ling = Math.floor(ling * m);
                spd = Math.floor(spd * m);
                crit = Math.min(0.95, crit * m);
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
        if (status) status.textContent = Game.cultivating ? '气机流转，战力缓缓增长' : '修炼已暂停';
        if (typeof UI !== 'undefined') UI.toast(Game.cultivating ? '开始修炼' : '修炼已暂停', 'good');
    },

    /* ---------- 手动修炼（点击一次立即获得战力） ---------- */
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
        // 每次点击 ≈ 3 秒被动修炼收益，再乘连击；入账钳到「今生战力上线」
        const gain = Math.min(Math.max(1, Math.floor(rate * 3 * comboMult * this.wuxingTapMult(player))), ZHANLI_CAP);
        const credited = this.gainZhanli(player, gain); // 达今生上线后实际入账为 0
        // 任务进度
        if (typeof Quests !== 'undefined') Quests.tickProgress('zhanli_total', player.stats.totalZhanli);
        // 视觉反馈：实际入账>0 显示「战力 +X」；达「今生上线」后点击不显示「战力 +0」（那像 bug），
        // 改为飘「已达今生上线」明确提示玩家该轮回了
        if (typeof UI !== 'undefined') {
            const capped = (credited === 0 && gain > 0);
            UI.showTapGain(capped ? 0 : credited, this.tapCombo > 1 ? this.tapCombo : 0, capped);
            UI.updateResourceBar();
            UI.updateCultivationBar();
        }
        this.save(player);
        return credited;
    },

    /* ---------- 渡劫天劫系统 ---------- */
    // 取劫后余韵永久加成（兼容旧档）
    getTribulusBonus(player) {
        const t = (player && player.tribulus) || { xiuMult: 0, stoneMult: 0 };
        return { xiuMult: t.xiuMult || 0, stoneMult: t.stoneMult || 0 };
    },
    // 转世轮回永久加成（仅保留 生命/攻击，更聚焦）
    getRebirthBonus(player) {
        const n = (player && player.rebirth) || 0;
        const c = (typeof GameConfig !== 'undefined' && GameConfig.rebirth && GameConfig.rebirth.perLevel)
            ? GameConfig.rebirth.perLevel : { atk: 0, hp: 0 };
        const atk = c.atk || 0, hp = c.hp || 0;
        // def/ling/stone 乘区固定为中性值，保证既有调用（灵石获取等）不报错
        // xiuMult 承载「每世 +100% 修炼收益」，供修炼速率明细(getRateDetail)与存档结算(save.js)共同使用
        const xiuBonus = (typeof GameConfig !== 'undefined' && GameConfig.rebirth && GameConfig.rebirth.xiuBonusPerRebirth) || 0;
        return {
            atkMult: 1 + n * atk,
            hpMult: 1 + n * hp,
            defMult: 1,
            lingMult: 1,
            xiuMult: n * xiuBonus,
            stoneMult: 0
        };
    },
    /* ---------- 轮回相关：今生战力上线（原「境界天花板」已改为战力上线） ---------- */
    // 今生战力可增长到的上限 = 免费轮回门槛（getRebirthZhanliCap，随轮回次数递增）。
    // 战力达线即停涨 → 付不起更高突破成本 → 需轮回提升上线，轮回仍是真实进度门槛。
    // 终局解锁：达轮回上限(maxRebirth) 或 上线境界已是最后一个境界时返回 ZHANLI_CAP，
    // 不影响大道+（洞天产出/化身注水/闭关）的长尾战力增长。
    getLifeZhanliCap(player) {
        const n = (player && player.rebirth) || 0;
        const c = (typeof GameConfig !== 'undefined' && GameConfig.rebirth) ? GameConfig.rebirth : {};
        const capRealmIdx = (c.baseRealm || 0) + n * (c.realmPerRebirth || 1);
        if (n >= (c.maxRebirth || 100) || capRealmIdx >= GameConfig.realms.length - 1) return ZHANLI_CAP;
        // 不低于当前战力：旧档超线只停涨、不回落
        return Math.max(this.getRebirthZhanliCap(player), (player && player.zhanli) || 0);
    },
    // 统一战力增长入口：任何来源的战力增加都钳到「今生战力上线」（totalZhanli 统计不受今生上线限制）
    gainZhanli(player, amount) {
        if (!player || !(amount > 0)) return 0;
        const cap = this.getLifeZhanliCap(player);
        const before = player.zhanli || 0;
        const beforeCapped = before >= cap;
        player.zhanli = Math.min(before + amount, cap);
        if (player.stats) player.stats.totalZhanli = Math.min((player.stats.totalZhanli || 0) + amount, ZHANLI_CAP);
        // 首次达线 toast（按 cap 数值去重：新一世 cap 变化后再次达线会再提示；每世内不重弹）
        const afterCapped = player.zhanli >= cap;
        if (!beforeCapped && afterCapped && player._zhanliCappedAt !== cap) {
            player._zhanliCappedAt = cap;
            if (typeof UI !== 'undefined') UI.toast(`战力已达今生上线（${fmtNum(cap)}），轮回后方可继续增长`, 'gold');
        }
        return player.zhanli - before; // 实际入账（达线后为 0）
    },
    /* ---------- 轮回战力上线 ---------- */
    // 第 n 世可免费轮回所需的战力阈值 = 今生天花板境界(baseRealm + n*realmPerRebirth)满层突破成本
    // 道祖之后(idx>12)的战力上线自动含 ×900 难度系数（getBreakthroughCost 内已处理）
    getRebirthZhanliCap(player) {
        const n = (player && player.rebirth) || 0;
        const c = (typeof GameConfig !== 'undefined' && GameConfig.rebirth) ? GameConfig.rebirth : {};
        const capRealmIdx = Math.min(GameConfig.realms.length - 1, (c.baseRealm || 0) + n * (c.realmPerRebirth || 1));
        const r = getRealm(capRealmIdx);
        return this.getBreakthroughCost({ realmIdx: capRealmIdx, realmLayer: r.layers });
    },
    // 估算某境界下的属性（临时改写 realm 字段后还原，不污染原对象）
    estimateStatsAt(player, realmIdx, realmLayer) {
        const oi = player.realmIdx, ol = player.realmLayer;
        player.realmIdx = realmIdx; player.realmLayer = realmLayer;
        const s = this.calcFinalStats(player);
        player.realmIdx = oi; player.realmLayer = ol;
        return s;
    },
    _addTribBonus(player, b) {
        if (!player.tribulus) player.tribulus = { xiuMult: 0, stoneMult: 0 };
        player.tribulus.xiuMult = (player.tribulus.xiuMult || 0) + (b.xiuMult || 0);
        player.tribulus.stoneMult = (player.tribulus.stoneMult || 0) + (b.stoneMult || 0);
    },
    // 按突破后的新境界选取天劫类型（循环）
    pickTribulation(player) {
        const arr = GameConfig.tribulations;
        return arr[(player.realmIdx || 0) % arr.length];
    },
    // 硬抗成功率：随境界与悟性小幅提升，但始终保留翻车风险
    calcTribSuccess(player, trib) {
        // 难度系数：基础成功率 ×tribChanceMult（调难时 <1，更难过）
        const base = ((trib && trib.baseChance) || 0.6) * (typeof DIFF !== 'undefined' ? DIFF.tribChanceMult : 1);
        const realmAdj = (player.realmIdx || 0) * 0.03;
        const wxAdj = (player.wuxingLevel || 0) * 0.004;
        const tribAdj = (typeof Talent !== 'undefined') ? Talent.tribChanceAdd(player) : 0;
        return Math.max(0.35, Math.min(0.95, base + realmAdj + wxAdj + tribAdj));
    },
    // 请护道人化解的灵石成本（随境界指数增长）
    protectCost(player, trib) {
        const base = (trib && trib.protectCostBase) || 300;
        return Math.floor(base * Math.pow(2.6, player.realmIdx || 0));
    },
    // 突破大境界成功后调用：先落地存档，再弹天劫
    tribulateAfterBreakthrough(player) {
        this.save(player);
        const trib = this.pickTribulation(player);
        this._pendingTrib = trib;
        const chance = this.calcTribSuccess(player, trib);
        const cost = this.protectCost(player, trib);
        if (typeof UI !== 'undefined') {
            UI.openTribulation({ player, trib, chance, cost, onDone: () => { if (typeof UI !== 'undefined') UI.renderAll(); } });
        }
    },
    // 结算天劫（硬抗 / 护道人）
    resolveTribulation(player, mode) {
        const trib = this._pendingTrib;
        if (!trib) return null;
        this._pendingTrib = null;
        if (mode === 'protect') {
            const cost = this.protectCost(player, trib);
            if ((player.stone || 0) < cost) {
                return { mode, fail: true, msg: '灵石不足，无法请护道人化解天劫' };
            }
            player.stone -= cost;
            const pb = trib.protectBonus || { xiuMult: 0.02, stoneMult: 0.015 };
            this._addTribBonus(player, pb);
            this.save(player);
            return { mode, success: true, protected: true, bonus: pb,
                msg: `请护道人耗${fmtNum(cost)}灵石化解${trib.name}，平安渡过（修炼速率+${Math.round(pb.xiuMult*100)}%、灵石获取+${Math.round(pb.stoneMult*100)}%）` };
        }
        // 硬抗
        const chance = this.calcTribSuccess(player, trib);
        if (Math.random() < chance) {
            const sb = trib.successBonus || { xiuMult: 0.06, stoneMult: 0.04 };
            this._addTribBonus(player, sb);
            this.save(player);
            return { mode, success: true, bonus: sb,
                msg: `硬抗${trib.name}成功！劫后余韵加身：修炼速率+${Math.round(sb.xiuMult*100)}%、灵石获取+${Math.round(sb.stoneMult*100)}%` };
        }
        // 硬抗失败：境界回落 + 损战力 + 损寿元（难度系数 tribPenaltyMult 加重惩罚）
        const _m = (typeof DIFF !== 'undefined') ? DIFF.tribPenaltyMult : 1;
        const fpRaw = trib.failPenalty || { layerDown: 2, xiuLossPct: 0.3, lifeLoss: 5 };
        const fp = {
            layerDown: Math.max(1, Math.round(fpRaw.layerDown * _m)),
            xiuLossPct: fpRaw.xiuLossPct * _m,
            lifeLoss: Math.round(fpRaw.lifeLoss * _m)
        };
        if ((player.realmLayer || 1) > fp.layerDown) {
            player.realmLayer -= fp.layerDown;
        } else if ((player.realmIdx || 0) > 0) {
            player.realmIdx -= 1;
            const r = getRealm(player.realmIdx);
            player.realmLayer = Math.max(1, r.layers - (fp.layerDown - (player.realmLayer || 1)));
        } else {
            player.realmLayer = 1;
        }
        const loss = Math.floor((player.zhanli || 0) * fp.zhanliLossPct);
        player.zhanli = Math.max(0, player.zhanli - loss);
        player.lifespan = Math.max(0, (player.lifespan || 0) - fp.lifeLoss);
        this.save(player);
        if (typeof Sound !== 'undefined') Sound.play('tribulation');
        return { mode, success: false, penalty: fp, xiuLost: loss,
            msg: `硬抗${trib.name}失败！境界回落、损失${fmtNum(loss)}战力、寿元-${fp.lifeLoss}` };
    },

    /* 灵石获取倍率（含 悟道系·点石 天赋） */
    stoneGainMult(player) {
        return (typeof Talent !== 'undefined') ? Talent.stoneRateMult(player) : 1;
    },

    /* ---------- 转世轮回 ---------- */
    reincarnate(player, mode) {
        const cfg = GameConfig.rebirth;
        // 轮回上限 100 世
        if ((player.rebirth || 0) >= (cfg.maxRebirth || 100)) {
            if (typeof UI !== 'undefined') UI.toast(`已达轮回上限 ${cfg.maxRebirth || 100} 世，不可再轮回`, 'bad');
            return { ok: false, reason: 'cap' };
        }
        let usedPill = false;
        if (mode === 'pill') {
            const have = ((player.inventory.material && player.inventory.material[cfg.herbId]) || 0);
            if (have < cfg.herbCost) {
                if (typeof UI !== 'undefined') UI.toast(`需 ${cfg.herbCost} 株${getMaterial(cfg.herbId).name}（坊市有售）`, 'bad');
                return { ok: false, reason: 'no_herb' };
            }
            player.inventory.material[cfg.herbId] -= cfg.herbCost;
            player.rebirth = (player.rebirth || 0) + 1;
            usedPill = true;
        } else {
            // 免费轮回：需先达「战力上线」（= 今生天花板境界满层突破成本），门槛随轮回次数递增
            const cap = this.getRebirthZhanliCap(player);
            if ((player.zhanli || 0) < cap) {
                if (typeof UI !== 'undefined') UI.toast(`需先达战力 ${fmtNum(cap)}（战力上线，随轮回次数递增）方可免费轮回`, 'bad');
                return { ok: false, reason: 'locked' };
            }
            player.rebirth = (player.rebirth || 0) + 1;
        }
        // 仅保留永久加成：生命/攻击/修炼收益、装备/资源/功法/灵宠/好友等
        delete player._zhanliCappedAt; // 清掉达线提示标记，下一世再次达线时会重新提示
        if (usedPill) {
            // 轮回草轮回：天价道具=高级捷径，保留当前境界与战力，仅重算寿元（重活一世，避免残留低寿命立刻羽化）。
            // 免去从 0 重练战力的枯燥，纯享「跳世 + 永久气血/攻击/修炼收益加成」。
            player.lifespan = 100;
        } else {
            // 免费轮回：散功重修，境界/战力/寿元归零（设计本意：重踏仙途，构成「达上线→轮回→归零→攀更高上线」成长闭环）
            player.realmIdx = 0;
            player.realmLayer = 1;
            player.zhanli = 0;
            player.lifespan = 100;
        }
        this.save(player);
        if (typeof UI !== 'undefined') {
            const rb = this.getRebirthBonus(player);
            const xiuPct = Math.round((player.rebirth || 0) * ((GameConfig.rebirth && GameConfig.rebirth.xiuBonusPerRebirth) || 0) * 100);
            UI.toast(usedPill
                ? `转世第 ${player.rebirth} 世！根基大进：气血 ×${rb.hpMult.toFixed(2)} · 攻击 ×${rb.atkMult.toFixed(2)} · 修炼收益 +${xiuPct}%`
                : `已免费轮回至第 ${player.rebirth} 世，重立道基（生命/攻击加成与修炼收益 +${xiuPct}% 永久保留）`, 'gold');
            UI.addLog(usedPill ? `历经${player.rebirth}世轮回，道基愈发浑厚` : `${player.name}散功重修，再踏仙途（第 ${player.rebirth} 世）`, 'evt');
            UI.renderAll();
            if (typeof Sound !== 'undefined') Sound.play('rebirth');
        }
        return { ok: true, usedPill, rebirth: player.rebirth };
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
