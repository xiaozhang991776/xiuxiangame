/* ============================================
   仙途·轮回诀 — 地图探索与随机事件系统
   场景切换 · 随机事件 · 奇遇机缘 · 境界门槛
   ============================================ */

const Explore = {
    currentScene: null,
    exploring: false,
    cdUntil: 0,          // 探索冷却截止时间戳（ms）
    cdMap: { sc_sect: 10000, default: 3000 },  // 宗门静修需更久，其余场景较短

    /* ---------- 是否处于冷却 ---------- */
    isOnCd() { return Date.now() < this.cdUntil; },

    /* ---------- 当前场景冷却时长 ---------- */
    cdOf(sceneId) {
        return this.cdMap[sceneId] != null ? this.cdMap[sceneId] : this.cdMap.default;
    },

    /* ---------- 进入场景 ---------- */
    enterScene(sceneId) {
        const scene = getScene(sceneId);
        if (!scene) return;
        const player = Game.player;
        if (player.realmIdx < scene.realmReq) {
            if (typeof UI !== 'undefined') UI.toast(`境界不足，需${getRealm(scene.realmReq).name}境界`, 'bad');
            return;
        }
        // 探索冷却：防止同一场景反复触发白嫖战力/资源
        if (this.isOnCd()) {
            const remain = Math.ceil((this.cdUntil - Date.now()) / 1000);
            if (typeof UI !== 'undefined') UI.toast(`需静修片刻，方可再探（约${remain}s）`, 'bad');
            return;
        }
        this.currentScene = sceneId;
        if (typeof UI !== 'undefined') {
            UI.toast(`进入${scene.name}`, 'good');
            UI.addLog(`进入 ${scene.name}`);
        }
        // 触发一次探索
        this.explore();
    },

    /* ---------- 执行探索 ---------- */
    explore() {
        if (!this.currentScene) {
            if (typeof UI !== 'undefined') UI.toast('请先选择场景', 'bad');
            return;
        }
        const scene = getScene(this.currentScene);
        const player = Game.player;
        player.stats.exploreCount = (player.stats.exploreCount || 0) + 1;

        // 随机选择事件
        const eventId = scene.events[Math.floor(Math.random() * scene.events.length)];
        const evt = GameConfig.events[eventId];
        if (!evt) return;

        this.showEvent(evt, eventId);
        // 任务进度
        if (typeof Quests !== 'undefined') Quests.tickProgress('explore_count', player.stats.exploreCount);
        SaveSystem.save(player);
        // 进入探索冷却，避免无限刷取
        this.cdUntil = Date.now() + this.cdOf(this.currentScene);
    },

    /* ---------- 显示事件 ---------- */
    showEvent(evt, eventId) {
        if (typeof UI !== 'undefined') UI.showEvent(evt, eventId);
    },

    /* ---------- 处理事件选择 ---------- */
    handleChoice(eventId, choiceIdx) {
        const evt = GameConfig.events[eventId];
        if (!evt) return;
        const choice = evt.choices[choiceIdx];
        if (!choice) return;
        const player = Game.player;

        if (typeof UI !== 'undefined') UI.hideEvent();

        switch (choice.type) {
            case 'zhanli':
                const _incV = Math.floor(choice.value * (typeof DIFF !== 'undefined' ? DIFF.incomeMult : 1));
                player.zhanli += _incV;
                player.stats.totalZhanli = (player.stats.totalZhanli || 0) + _incV;
                if (typeof UI !== 'undefined') {
                    UI.toast(`获得${fmtNum(_incV)}战力`, 'gold');
                    UI.addLog(`奇遇：获得${fmtNum(choice.value)}战力`, 'evt');
                }
                if (typeof Quests !== 'undefined') Quests.tickProgress('zhanli_total', player.stats.totalZhanli);
                if (typeof UI !== 'undefined') UI.updateResourceBar();
                break;

            case 'item':
                Inventory.addItem(player, choice.value, choice.count || 1);
                const itemTpl = getEquipTemplate(choice.value) || getPill(choice.value) || getMaterial(choice.value) || getGongfa(choice.value);
                if (typeof UI !== 'undefined') {
                    UI.toast(`获得：${itemTpl.name}×${choice.count || 1}`, 'gold');
                    UI.addLog(`获得 ${itemTpl.name}×${choice.count || 1}`, 'evt');
                }
                break;

            case 'gongfa':
                Inventory.learnGongfa(player, choice.value);
                break;

            case 'gongfa_random':
                // 随机获得功法
                this.giveRandomGongfa(player);
                break;

            case 'combat_random':
                this.triggerRandomCombat(player);
                break;

            case 'combat_hard':
                this.triggerHardCombat(player);
                break;

            case 'treasure':
            case 'treasure_safe':
            case 'treasure_deep':
                this.openTreasure(player, choice.type);
                break;

            case 'auction':
                this.triggerAuction(player);
                break;

            case 'shop_random':
                this.triggerRandomShop(player);
                break;

            case 'quest': {
                if (typeof UI !== 'undefined') UI.toast('接到新的宗门任务', 'good');
                // 简单：给一些战力作为任务奖励预付（资源收紧：乘 incomeMult）
                const _qPre = Math.floor(100 * (typeof DIFF !== 'undefined' ? DIFF.incomeMult : 1));
                player.zhanli += _qPre;
                if (typeof UI !== 'undefined') UI.addLog(`接到宗门任务，预付${_qPre}战力`, 'evt');
                break;
            }

            case 'karma_good':
                // 行善积德，小概率获得奇遇（资源收紧：善报战力乘 incomeMult）
                if (Math.random() < 0.3) {
                    const _m = (typeof DIFF !== 'undefined') ? DIFF.incomeMult : 1;
                    const reward = Math.floor((player.zhanli * 0.01 + 50) * _m);
                    player.zhanli = Math.min(player.zhanli + reward, ZHANLI_CAP);
                    if (typeof UI !== 'undefined') {
                        UI.toast(`善有善报，获得${fmtNum(reward)}战力`, 'gold');
                        UI.addLog('行善积德，福报降临', 'evt');
                    }
                } else {
                    if (typeof UI !== 'undefined') UI.toast('送人离去，心安理得', 'good');
                }
                break;

            case 'karma_bad':
                // 行凶夺宝
                const stoneGain = Math.floor(150 + Math.random() * 300);
                player.stone += stoneGain;
                if (typeof UI !== 'undefined') {
                    UI.toast(`抢得${stoneGain}灵石`, 'gold');
                    UI.addLog(`抢夺他人，获得${stoneGain}灵石`, 'bad');
                }
                // 30%概率触发复仇战斗
                if (Math.random() < 0.3) {
                    setTimeout(() => this.triggerRandomCombat(player), 800);
                }
                break;

            case 'beggar_pay':
                if (player.stone < choice.cost) {
                    if (typeof UI !== 'undefined') UI.toast('灵石不足', 'bad');
                } else {
                    player.stone -= choice.cost;
                    // 70%概率乞丐给功法或物品
                    if (Math.random() < 0.7) {
                        if (Math.random() < 0.3) {
                            Inventory.addItem(player, 'g_five_elem', 1);
                            if (typeof UI !== 'undefined') {
                                UI.toast('乞丐传授你五行诀！', 'gold');
                                UI.addLog('乞丐传授五行诀', 'evt');
                            }
                        } else {
                            Inventory.addItem(player, 'p_xiu_pill', 2);
                            if (typeof UI !== 'undefined') UI.toast('乞丐赠你筑基丹×2', 'gold');
                        }
                    } else {
                        if (typeof UI !== 'undefined') UI.toast('乞丐扬长而去', 'good');
                    }
                }
                break;

            case 'hp_loss':
                const loss = choice.value;
                // 这里直接扣除玩家HP（临时），影响下一次战斗
                player.tempHpDebuff = (player.tempHpDebuff || 0) + loss;
                if (typeof UI !== 'undefined') {
                    UI.toast(`损失${loss}气血`, 'bad');
                    UI.addLog(`意外受伤，损失${loss}气血`, 'bad');
                }
                break;

            case 'pet':
                Inventory.catchPet(player, choice.value);
                break;

            case 'dragon_tribute':
                // 献上宝物
                if (player.stone >= 1000) {
                    player.stone -= 1000;
                    if (Math.random() < 0.5) {
                        Inventory.addItem(player, 'm_pearl', 2);
                        if (typeof UI !== 'undefined') UI.toast('龙王赏你灵珠×2', 'gold');
                    } else {
                        // 直接收服幼龙（已扣灵石）
                        const pet = getPet('pet_dragon');
                        const hasDragon = player.pets && player.pets.find(x => x.id === 'pet_dragon');
                        if (pet && !hasDragon) {
                            if (typeof PetSys !== 'undefined') PetSys.addPet(player, 'pet_dragon');
                            else { if (!player.pets) player.pets = []; player.pets.push({ id: 'pet_dragon', lv: 1, exp: 0, aff: 0, evo: 0 }); if (!player.pet) player.pet = 'pet_dragon'; }
                            if (typeof UI !== 'undefined') {
                                UI.toast(`收服灵宠：${pet.name}！`, 'gold');
                                UI.addLog(`龙王许你收服${pet.name}！`, 'evt');
                            }
                        } else {
                            // 已有灵宠，给灵珠补偿
                            Inventory.addItem(player, 'm_pearl', 3);
                            if (typeof UI !== 'undefined') UI.toast('你已有灵宠，龙王赐你灵珠×3', 'gold');
                        }
                    }
                } else {
                    if (typeof UI !== 'undefined') UI.toast('灵石不足，龙王不悦', 'bad');
                }
                break;

            case 'nothing':
            default:
                if (typeof UI !== 'undefined') UI.toast('无事发生', 'good');
                break;
        }

        SaveSystem.save(player);
        if (typeof UI !== 'undefined') UI.renderAll();
    },

    /* ---------- 随机战斗 ---------- */
    triggerRandomCombat(player) {
        // 根据当前境界选择合适的敌人（只选“打得过”的，避免弹出“境界不足”）
        const canFight = (e) => !(player.realmIdx < e.realmIdx || (player.realmIdx === e.realmIdx && player.realmLayer < e.realmLayer));
        const candidates = GameConfig.enemies.filter(e =>
            e.realmIdx <= player.realmIdx && e.realmIdx >= Math.max(0, player.realmIdx - 1) && canFight(e)
        );
        if (candidates.length === 0) {
            // 无匹配敌人时动态生成同境界化身
            return Combat.startBattleWithEnemy(player, this._scaleEnemy(player), false);
        }
        const enemy = candidates[Math.floor(Math.random() * candidates.length)];
        Combat.startBattle(player, enemy.id);
    },

    /* ---------- 强敌战斗 ---------- */
    triggerHardCombat(player) {
        // 选“打得过”的敌人中尽量强的一个（与startBattle门槛严格对齐）
        const canFight = (e) => !(player.realmIdx < e.realmIdx || (player.realmIdx === e.realmIdx && player.realmLayer < e.realmLayer));
        const candidates = GameConfig.enemies.filter(e =>
            e.realmIdx <= player.realmIdx && e.realmIdx >= Math.max(0, player.realmIdx - 1) && canFight(e)
        );
        if (candidates.length === 0) {
            // 无匹配敌人时动态生成更强化身
            return Combat.startBattleWithEnemy(player, this._scaleEnemy(player, true), true);
        }
        // 按 realmIdx、realmLayer 降序，挑最难的（仍是可战胜的）
        candidates.sort((a, b) => (b.realmIdx - a.realmIdx) || (b.realmLayer - a.realmLayer));
        Combat.startBattle(player, candidates[0].id, true);
    },

    /* ---------- 动态生成高境界敌人化身 ---------- */
    _scaleEnemy(player, hard = false) {
        // 找到配置中最强的敌人作为基准
        let base = GameConfig.enemies.reduce((max, e) => {
            if (e.realmIdx > max.realmIdx) return e;
            if (e.realmIdx === max.realmIdx && e.realmLayer > max.realmLayer) return e;
            return max;
        }, GameConfig.enemies[0]);
        if (!base) base = GameConfig.enemies[0];
        const gap = Math.max(0, player.realmIdx - base.realmIdx);
        const scale = Math.pow(hard ? 2.0 : 1.5, gap) * (1 + (player.realmLayer - 1) * 0.05);
        const prefix = player.realmIdx < 5 ? base.name : getRealm(player.realmIdx).name + '·化身';
        return {
            id: '__scaled_' + player.realmIdx + '_' + player.realmLayer + (hard ? '_h' : ''),
            name: prefix + '（境界压制）',
            icon: base.icon,
            elem: base.elem,
            realmIdx: player.realmIdx,
            realmLayer: player.realmLayer,
            hp: Math.floor(base.hp * scale),
            atk: Math.floor(base.atk * scale),
            def: Math.floor(base.def * scale),
            spd: Math.floor(base.spd * (1 + gap * 0.2)),
            ling: Math.floor(base.ling * scale),
            zhanliReward: Math.floor(base.zhanliReward * scale),
            stoneReward: Math.floor(base.stoneReward * scale),
            drops: base.drops
        };
    },

    /* ---------- 开启宝箱 ---------- */
    openTreasure(player, type) {
        let qualityPool;
        let stoneReward;
        const _m = (typeof DIFF !== 'undefined') ? DIFF.incomeMult : 1;
        if (type === 'treasure') {
            qualityPool = [0, 0, 1, 1, 2];
            stoneReward = Math.floor((150 + Math.random() * 600) * _m);
        } else if (type === 'treasure_safe') {
            // 谨慎检查，避免陷阱但奖励较少
            qualityPool = [0, 0, 1];
            stoneReward = Math.floor((90 + Math.random() * 300) * _m);
            if (typeof UI !== 'undefined') UI.toast(`获得${stoneReward}灵石`, 'gold');
            if (Math.random() < 0.3) {
                // 30%概率只有灵石，无装备
                player.stone += stoneReward;
                return;
            }
        } else {
            // 深海宝库
            qualityPool = [1, 2, 2, 3, 3, 4];
            stoneReward = Math.floor((1500 + Math.random() * 6000) * _m);
        }
        player.stone += stoneReward;
        if (typeof UI !== 'undefined') UI.toast(`获得${stoneReward}灵石`, 'gold');

        // 随机装备
        const eqPool = GameConfig.equipmentTemplates.filter(e => qualityPool.includes(e.quality));
        if (eqPool.length > 0) {
            const eq = eqPool[Math.floor(Math.random() * eqPool.length)];
            Inventory.addItem(player, eq.id, 1);
            if (typeof UI !== 'undefined') {
                UI.toast(`获得：${eq.name}！`, 'gold');
                UI.addLog(`宝箱奇遇：获得${eq.name}`, 'evt');
            }
        }
        // 概率获得丹药
        if (Math.random() < 0.4) {
            const pillPool = GameConfig.pills.filter(p => qualityPool.includes(p.quality));
            if (pillPool.length > 0) {
                const pill = pillPool[Math.floor(Math.random() * pillPool.length)];
                Inventory.addItem(player, pill.id, 1);
                if (typeof UI !== 'undefined') UI.toast(`获得：${pill.name}×1`, 'gold');
            }
        }
    },

    /* ---------- 拍卖会 ---------- */
    triggerAuction(player) {
        // 随机出现一个高品质物品，价格较高
        const pool = GameConfig.equipmentTemplates.filter(e => e.quality >= 2);
        if (pool.length === 0) return;
        const item = pool[Math.floor(Math.random() * pool.length)];
        const q = getQuality(item.quality);
        const price = Math.floor(item.price * 0.8);
        if (typeof UI !== 'undefined') {
            UI.showModal({
                title: '拍卖盛会',
                body: `<p>拍卖品：<span style="color:${q.color}">${item.name}</span></p>
                       <p style="color:#9a8e7a;margin:8px 0">${item.desc}</p>
                       <p>起拍价：<span style="color:#d4af37">${price}灵石</span></p>
                       <p>当前灵石：${fmtNum(player.stone)}</p>`,
                footer: [
                    { text: '竞拍', type: 'primary', action: () => {
                        if (player.stone >= price) {
                            player.stone -= price;
                            Inventory.addItem(player, item.id, 1);
                            if (typeof UI !== 'undefined') {
                                UI.toast(`竞拍成功：${item.name}`, 'gold');
                                UI.addLog(`拍卖获得 ${item.name}`, 'evt');
                                UI.hideModal();
                                UI.renderAll();
                            }
                            SaveSystem.save(player);
                        } else {
                            if (typeof UI !== 'undefined') UI.toast('灵石不足', 'bad');
                        }
                    }},
                    { text: '放弃', action: () => { if (typeof UI !== 'undefined') UI.hideModal(); } }
                ]
            });
        }
    },

    /* ---------- 随机摊位 ---------- */
    triggerRandomShop(player) {
        // 随机3个物品，价格8折
        const allItems = [
            ...GameConfig.equipmentTemplates.map(e => ({ id: e.id, type: 'equipment', price: e.price })),
            ...GameConfig.pills.map(p => ({ id: p.id, type: 'pill', price: p.price })),
            ...GameConfig.materials.map(m => ({ id: m.id, type: 'material', price: m.price }))
        ];
        const random = [];
        for (let i = 0; i < 3; i++) {
            const item = allItems[Math.floor(Math.random() * allItems.length)];
            random.push({ ...item, sellPrice: Math.floor(item.price * 0.8) });
        }
        if (typeof UI !== 'undefined') {
            const body = random.map((r, i) => {
                let name = '';
                if (r.type === 'equipment') name = getEquipTemplate(r.id).name;
                else if (r.type === 'pill') name = getPill(r.id).name;
                else name = getMaterial(r.id).name;
                return `<div style="display:flex;justify-content:space-between;padding:8px;border:1px solid rgba(201,169,106,0.2);border-radius:6px;margin-bottom:6px">
                    <span>${name}</span>
                    <span style="color:#d4af37">${r.sellPrice}灵石</span>
                </div>`;
            }).join('');
            UI.showModal({
                title: '老叟摊位',
                body: `<p style="margin-bottom:10px">老叟神秘一笑，取出三件物品：</p>${body}<p>当前灵石：${fmtNum(player.stone)}</p>`,
                footer: random.map((r, i) => ({
                    text: `买${i + 1}`,
                    action: () => {
                        if (player.stone >= r.sellPrice) {
                            player.stone -= r.sellPrice;
                            Inventory.addItem(player, r.id, 1);
                            if (typeof UI !== 'undefined') {
                                UI.toast('购买成功', 'gold');
                                UI.hideModal();
                                UI.renderAll();
                            }
                            SaveSystem.save(player);
                        } else {
                            if (typeof UI !== 'undefined') UI.toast('灵石不足', 'bad');
                        }
                    }
                })).concat([{ text: '离开', action: () => { if (typeof UI !== 'undefined') UI.hideModal(); } }])
            });
        }
    },

    /* ---------- 随机赠送功法 ---------- */
    giveRandomGongfa(player) {
        const candidates = GameConfig.gongfas.filter(g => 
            !player.inventory.gongfa.includes(g.id) && player.realmIdx >= g.realmReq
        );
        if (candidates.length === 0) {
            // 没有可学的，给战力补偿（资源收紧：乘 incomeMult）
            const xiu = Math.floor((500 + Math.floor(Math.random() * 2000)) * (typeof DIFF !== 'undefined' ? DIFF.incomeMult : 1));
            player.zhanli += xiu;
            if (typeof UI !== 'undefined') UI.toast(`获得${fmtNum(xiu)}战力`, 'gold');
            return;
        }
        const gf = candidates[Math.floor(Math.random() * candidates.length)];
        Inventory.learnGongfa(player, gf.id);
    }
};

/* ---------- 任务系统 ---------- */
const Quests = {
    /* ---------- 获取任务列表 ---------- */
    getList(player) {
        return GameConfig.quests.map(q => {
            const state = player.quests[q.id] || { progress: 0, claimed: false };
            let progress = state.progress;
            // 实时更新部分任务进度
            if (q.type === 'zhanli_total') progress = player.stats.totalZhanli || 0;
            if (q.type === 'combat_win') progress = player.stats.combatWins || 0;
            if (q.type === 'explore_count') progress = player.stats.exploreCount || 0;
            if (q.type === 'realm_idx') progress = player.realmIdx + 1;
            if (q.type === 'realm_layer') progress = player.realmIdx * 100 + player.realmLayer;
            return { ...q, progress, claimed: state.claimed, done: progress >= q.target };
        });
    },

    /* ---------- 更新任务进度 ---------- */
    tickProgress(type, value) {
        const player = Game.player;
        if (!player) return;
        GameConfig.quests.forEach(q => {
            if (q.type !== type) return;
            const state = player.quests[q.id] || { progress: 0, claimed: false };
            if (state.claimed) return;
            // 对于累加型任务，直接设置当前值
            if (['zhanli_total', 'combat_win', 'explore_count', 'realm_idx', 'realm_layer'].includes(type)) {
                state.progress = value;
            } else {
                state.progress = Math.max(state.progress, value);
            }
            player.quests[q.id] = state;
        });
    },

    /* ---------- 领取任务奖励 ---------- */
    claim(player, questId) {
        const q = GameConfig.quests.find(x => x.id === questId);
        if (!q) return;
        const state = player.quests[questId] || { progress: 0, claimed: false };
        if (state.claimed) return;
        // 实时进度
        let progress = state.progress;
        if (q.type === 'zhanli_total') progress = player.stats.totalZhanli || 0;
        if (q.type === 'combat_win') progress = player.stats.combatWins || 0;
        if (q.type === 'explore_count') progress = player.stats.exploreCount || 0;
        if (q.type === 'realm_idx') progress = player.realmIdx + 1;
        if (q.type === 'realm_layer') progress = player.realmIdx * 100 + player.realmLayer;
        if (progress < q.target) {
            if (typeof UI !== 'undefined') UI.toast('任务未完成', 'bad');
            return;
        }
        state.claimed = true;
        player.quests[questId] = state;
        // 发放奖励（资源收紧：灵石/战力奖励乘 incomeMult）
        const _m = (typeof DIFF !== 'undefined') ? DIFF.incomeMult : 1;
        let _gotStone = 0, _gotXiu = 0;
        if (q.reward.stone) { const _s = Math.floor(q.reward.stone * _m); player.stone += _s; _gotStone = _s; }
        if (q.reward.zhanli) {
            const _x = Math.floor(q.reward.zhanli * _m);
            player.zhanli += _x;
            player.stats.totalZhanli = (player.stats.totalZhanli || 0) + _x;
            _gotXiu = _x;
        }
        if (q.reward.items) {
            q.reward.items.forEach(it => Inventory.addItem(player, it.id, it.count));
        }
        if (typeof UI !== 'undefined') {
            UI.toast(`领取奖励：${_gotStone ? fmtNum(_gotStone) + '灵石 ' : ''}${_gotXiu ? fmtNum(_gotXiu) + '战力' : ''}`, 'gold');
            UI.addLog(`完成任务 ${q.name}，领取奖励`, 'evt');
            UI.renderAll();
        }
        SaveSystem.save(player);
    }
};
