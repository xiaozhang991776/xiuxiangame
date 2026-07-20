/* ============================================
   仙途·轮回诀 — 回合制战斗系统
   技能/法宝/灵宠 · 五行克制 · 冷却/灵力/连招
   ============================================ */

const Combat = {
    state: null,  // 当前战斗状态

    /* ---------- 初始化战斗（通过 enemyId） ---------- */
    startBattle(player, enemyId, isHard = false) {
        const enemyTpl = getEnemy(enemyId);
        if (!enemyTpl) return false;
        return this.startBattleWithEnemy(player, enemyTpl, isHard);
    },

    /* ---------- 初始化战斗（通过 enemy 对象） ---------- */
    startBattleWithEnemy(player, enemyTpl, isHard = false) {
        // 检查境界要求
        if (player.realmIdx < enemyTpl.realmIdx ||
            (player.realmIdx === enemyTpl.realmIdx && player.realmLayer < enemyTpl.realmLayer)) {
            if (typeof UI !== 'undefined') UI.toast(`境界不足，无法挑战此敌人`, 'bad');
            return false;
        }

        const stats = Cultivate.calcFinalStats(player);
        // 难度强化（秘境强敌）
        const mult = isHard ? 1.5 : 1.0;

        // 临时气血增益/减益（矿洞受伤等），用于本场战斗初始气血
        const tempHpBuff = player.tempHpBuff || 0;
        const tempHpDebuff = player.tempHpDebuff || 0;
        const effHp = Math.max(1, stats.hp + tempHpBuff - tempHpDebuff);
        if (tempHpDebuff) player.tempHpDebuff = 0; // 一次性减益，用掉即清

        this.state = {
            player: {
                name: player.name,
                avatar: ['道','仙','魔','佛'][player.avatar],
                elem: player.element,
                hp: effHp,
                maxHp: effHp,
                ling: stats.ling + (player.tempLingBuff || 0),
                maxLing: stats.ling + (player.tempLingBuff || 0),
                atk: stats.atk,
                def: stats.def,
                spd: stats.spd,
                crit: stats.crit,
                buffs: [],
                debuffs: [],
                skillCd: {},  // 技能冷却
                pet: player.pet ? getPet(player.pet) : null,
                petCd: 0,
                fabao: player.equipped.fabao ? getEquipTemplate(player.equipped.fabao.baseId) : null,
                fabaoCd: 0,
                reflect: 0,
                shield: 0,
                reflectTurns: 0,
                shieldTurns: 0
            },
            enemy: {
                name: enemyTpl.name,
                avatar: enemyTpl.icon,
                elem: enemyTpl.elem,
                hp: Math.floor(enemyTpl.hp * mult),
                maxHp: Math.floor(enemyTpl.hp * mult),
                atk: Math.floor(enemyTpl.atk * mult),
                def: Math.floor(enemyTpl.def * mult),
                spd: enemyTpl.spd,
                ling: enemyTpl.ling,
                buffs: [],
                debuffs: [],
                sealTurns: 0
            },
            enemyTpl: enemyTpl,
            turn: 1,
            log: [],
            finished: false,
            playerFirst: stats.spd >= enemyTpl.spd,
            playerTurn: stats.spd >= enemyTpl.spd  // 回合标记：true=玩家可操作，false=敌方行动中
        };

        // 将丹药临时增益转为可衰减buff（与“N回合”描述一致）
        if (player.tempBuffAtk) this.state.player.buffs.push({ type: 'atk', value: player.tempBuffAtk.value, turns: player.tempBuffAtk.turns });
        if (player.tempBuffDef) this.state.player.buffs.push({ type: 'def', value: player.tempBuffDef.value, turns: player.tempBuffDef.turns });

        // 显示战斗界面
        if (typeof UI !== 'undefined') UI.showBattle(this.state);
        this.addLog('战斗开始！', '');
        // 速度高者先手
        if (!this.state.playerFirst) {
            setTimeout(() => this.enemyTurn(), 800);
        }
        return true;
    },

    /* ---------- 玩家使用技能 ---------- */
    useSkill(skillId) {
        if (!this.state || this.state.finished) return;
        if (this.state.playerTurn === false) return; // 敌方回合，锁操作
        const player = Game.player;
        if (!player.skills[skillId]) return;
        const skill = getSkill(skillId);
        if (!skill) return;

        const st = this.state.player;
        // 冷却检查
        if ((st.skillCd[skillId] || 0) > 0) {
            if (typeof UI !== 'undefined') UI.toast(`${skill.name}冷却中`, 'bad');
            return;
        }
        // 灵力检查
        if (st.ling < skill.cost) {
            if (typeof UI !== 'undefined') UI.toast('灵力不足', 'bad');
            return;
        }

        st.ling -= skill.cost;
        if (skill.cd > 0) st.skillCd[skillId] = skill.cd;

        const lvl = player.skills[skillId];
        const lvlMult = 1 + (lvl - 1) * 0.15;

        // 处理不同技能效果
        if (skill.healMult) {
            // 治疗技能
            const heal = Math.floor(st.maxHp * skill.healMult * lvlMult);
            st.hp = Math.min(st.maxHp, st.hp + heal);
            this.addLog(`施展${skill.name}，恢复${heal}气血`, 'heal');
            this.showFloat('player', heal, 'heal');
        } else if (skill.shield) {
            // 护盾技能
            const shield = Math.floor(st.maxHp * skill.shield * lvlMult);
            st.shield = shield;
            this.addLog(`施展${skill.name}，获得${shield}护盾`, 'heal');
        } else if (skill.buff) {
            // 增益buff
            st.buffs.push({ ...skill.buff, lvlMult });
            this.addLog(`施展${skill.name}，${skill.buff.type}+${Math.floor(skill.buff.value * lvlMult)}`, 'heal');
        } else {
            // 攻击技能
            this.dealDamage('player', 'enemy', skill, lvlMult);
        }

        // 连招处理
        if (skill.combo) {
            for (let i = 1; i < skill.combo; i++) {
                setTimeout(() => {
                    if (this.state && !this.state.finished) {
                        const comboMult = lvlMult * (1 + i * 0.2);
                        this.dealDamage('player', 'enemy', skill, comboMult, true);
                    }
                }, i * 400);
            }
        }

        // 检查战斗结束
        if (this.checkEnd()) return;

        // 切换到敌人回合（锁定玩家操作）
        this.state.playerTurn = false;
        if (typeof UI !== 'undefined') UI.updateBattle(this.state);
        setTimeout(() => this.enemyTurn(), 1200);
    },

    /* ---------- 使用法宝 ---------- */
    useFabao() {
        if (!this.state || this.state.finished) return;
        if (this.state.playerTurn === false) return; // 敌方回合，锁操作
        const player = this.state.player;
        if (!player.fabao) return;
        if (player.fabaoCd > 0) {
            if (typeof UI !== 'undefined') UI.toast('法宝冷却中', 'bad');
            return;
        }
        const skillId = player.fabao.skill;
        if (!skillId || !GameConfig.fabaoSkills[skillId]) return;
        const fs = GameConfig.fabaoSkills[skillId];

        // 灵力校验，避免扣成负数
        if (player.ling < fs.cost) {
            if (typeof UI !== 'undefined') UI.toast('灵力不足', 'bad');
            return;
        }
        player.ling -= fs.cost;
        player.fabaoCd = fs.cd;

        if (fs.shield) {
            player.shield = Math.floor(player.maxHp * fs.shield);
            player.shieldTurns = fs.turns || 2;
            this.addLog(`激发法宝${player.fabao.name}：${fs.name}，获得护盾`, 'heal');
        } else if (fs.reflect) {
            player.reflect = fs.reflect;
            player.reflectTurns = fs.turns || 2;
            this.addLog(`激发法宝${player.fabao.name}：${fs.name}，反弹伤害`, 'heal');
        } else if (fs.dmgMult) {
            // 法宝攻击
            const baseDmg = player.atk * fs.dmgMult;
            const elemMult = getElementMultiplier(player.elem, this.state.enemy.elem);
            let dmg = Math.floor(baseDmg * elemMult);
            if (fs.ignoreDef) dmg = Math.floor(dmg * 1.2);
            else dmg = Math.max(1, dmg - this.state.enemy.def);
            this.state.enemy.hp -= dmg;
            this.addLog(`激发法宝${player.fabao.name}：${fs.name}，造成${dmg}伤害${elemMult > 1 ? '（五行克制）' : ''}`, 'dmg');
            this.showFloat('enemy', dmg, elemMult > 1.3 ? 'crit' : 'dmg');
        }

        if (this.checkEnd()) return;
        // 切换到敌人回合（锁定玩家操作）
        this.state.playerTurn = false;
        if (typeof UI !== 'undefined') UI.updateBattle(this.state);
        setTimeout(() => this.enemyTurn(), 1200);
    },

    /* ---------- 造成伤害核心 ---------- */
    dealDamage(from, to, skill, lvlMult = 1, isCombo = false) {
        const attacker = this.state[from];
        const defender = this.state[to];
        let baseAtk = attacker.atk;
        // buff加成
        attacker.buffs.forEach(b => {
            if (b.type === 'atk') baseAtk += Math.floor(b.value * (b.lvlMult || 1));
        });
        // debuff减成
        attacker.debuffs.forEach(d => {
            if (d.type === 'atk') baseAtk = Math.floor(baseAtk * (1 - d.value));
        });

        const dmgMult = (skill.dmgMult || 1.0) * lvlMult;
        let dmg = baseAtk * dmgMult;
        // 五行克制
        const elemMult = skill.elem ? getElementMultiplier(skill.elem, defender.elem) : 1.0;
        dmg *= elemMult;
        // 防御减免
        if (!skill.ignoreDef) {
            let def = defender.def;
            defender.buffs.forEach(b => { if (b.type === 'def') def += Math.floor(b.value * (b.lvlMult || 1)); });
            defender.debuffs.forEach(d => { if (d.type === 'def') def = Math.floor(def * (1 - d.value)); });
            dmg = Math.max(1, dmg - def * 0.8);
        }
        // 暴击
        let isCrit = Math.random() < attacker.crit;
        if (isCrit) dmg *= 1.8;
        dmg = Math.floor(dmg);

        // 护盾抵扣
        if (defender.shield > 0) {
            const absorbed = Math.min(defender.shield, dmg);
            defender.shield -= absorbed;
            dmg -= absorbed;
            if (absorbed > 0) this.addLog(`${defender.name}护盾抵消${absorbed}伤害`, 'heal');
        }
        if (dmg > 0) {
            defender.hp -= dmg;
            // 反弹伤害
            if (defender.reflect > 0) {
                const reflectDmg = Math.floor(dmg * defender.reflect);
                attacker.hp -= reflectDmg;
                this.addLog(`${defender.name}反弹${reflectDmg}伤害`, 'dmg');
                this.showFloat(from, reflectDmg, 'dmg');
            }
        }

        const logType = isCrit ? 'crit' : (elemMult > 1.3 ? 'elem' : 'dmg');
        let logMsg = `${attacker.name}施展${skill.name || '攻击'}，造成${dmg}伤害`;
        if (isCrit) logMsg += '（暴击）';
        if (elemMult > 1.3) logMsg += '（五行克制）';
        if (isCombo) logMsg += '（连击）';
        this.addLog(logMsg, logType);
        this.showFloat(to, dmg, logType);

        // 技能附带debuff
        if (skill.debuff && dmg > 0) {
            defender.debuffs.push({ ...skill.debuff, turns: skill.debuff.turns });
            this.addLog(`${defender.name}被${skill.debuff.type}影响`, 'elem');
        }
    },

    /* ---------- 灵宠行动 ---------- */
    petAction() {
        if (!this.state || !this.state.player.pet) return;
        const player = this.state.player;
        if (player.petCd > 0) return;
        const petSkill = GameConfig.petSkills[player.pet.skill];
        if (!petSkill) return;
        player.petCd = petSkill.cd;

        if (petSkill.shield) {
            player.shield = Math.floor(player.maxHp * petSkill.shield);
            player.shieldTurns = petSkill.cd || 3;
            this.addLog(`${player.pet.name}施展${petSkill.name}，护主加盾`, 'heal');
        } else if (petSkill.dmgMult) {
            const baseDmg = player.pet.atk * petSkill.dmgMult;
            const elemMult = getElementMultiplier(player.pet.elem, this.state.enemy.elem);
            const dmg = Math.max(1, Math.floor(baseDmg * elemMult - this.state.enemy.def * 0.5));
            this.state.enemy.hp -= dmg;
            this.addLog(`${player.pet.name}施展${petSkill.name}，造成${dmg}伤害`, 'dmg');
            this.showFloat('enemy', dmg, 'dmg');
            if (petSkill.debuff) {
                this.state.enemy.debuffs.push({ ...petSkill.debuff });
            }
        }
        this.checkEnd(); // 灵宠补刀击杀立即结算
    },

    /* ---------- 敌人回合 ---------- */
    enemyTurn() {
        if (!this.state || this.state.finished) return;
        const enemy = this.state.enemy;
        if (enemy.hp <= 0) return;

        // 封印状态
        if (enemy.sealTurns > 0) {
            enemy.sealTurns--;
            this.addLog(`${enemy.name}被封印，无法行动`, 'miss');
            this.endTurn();
            return;
        }

        // 简单AI：随机普攻或强力攻击
        const player = this.state.player;
        const isStrong = Math.random() < 0.3;
        let dmg = enemy.atk * (isStrong ? 1.5 : 1.0);
        // 五行克制
        const elemMult = getElementMultiplier(enemy.elem, player.elem);
        dmg *= elemMult;
        // 玩家防御（含防御类buff/debuff，与dealDamage守方处理一致）
        let pDef = player.def;
        player.buffs.forEach(b => { if (b.type === 'def') pDef += Math.floor(b.value * (b.lvlMult || 1)); });
        player.debuffs.forEach(d => { if (d.type === 'def') pDef = Math.floor(pDef * (1 - d.value)); });
        dmg = Math.max(1, dmg - pDef * 0.8);
        // 暴击
        const isCrit = Math.random() < 0.08;
        if (isCrit) dmg *= 1.6;
        dmg = Math.floor(dmg);

        // 护盾
        if (player.shield > 0) {
            const absorbed = Math.min(player.shield, dmg);
            player.shield -= absorbed;
            dmg -= absorbed;
        }
        if (dmg > 0) {
            player.hp -= dmg;
            // 反弹
            if (player.reflect > 0) {
                const reflectDmg = Math.floor(dmg * player.reflect);
                enemy.hp -= reflectDmg;
                this.addLog(`反弹${reflectDmg}伤害`, 'dmg');
                this.showFloat('enemy', reflectDmg, 'dmg');
            }
        }
        const logType = isCrit ? 'crit' : (elemMult > 1.3 ? 'elem' : 'dmg');
        let logMsg = `${enemy.name}${isStrong ? '强力' : ''}攻击，造成${dmg}伤害`;
        if (isCrit) logMsg += '（暴击）';
        if (elemMult > 1.3) logMsg += '（五行克制）';
        this.addLog(logMsg, logType);
        this.showFloat('player', dmg, logType);

        // 攻击动画
        if (typeof UI !== 'undefined') UI.battleAnim('enemy');

        this.endTurn();
    },

    /* ---------- 回合结束处理 ---------- */
    endTurn() {
        if (this.checkEnd()) return;
        this.state.turn++;
        // 冷却递减
        const p = this.state.player;
        for (const k in p.skillCd) {
            if (p.skillCd[k] > 0) p.skillCd[k]--;
        }
        if (p.fabaoCd > 0) p.fabaoCd--;
        if (p.petCd > 0) p.petCd--;
        // buff/debuff回合递减
        p.buffs = p.buffs.filter(b => { b.turns--; return b.turns > 0; });
        p.debuffs = p.debuffs.filter(d => { d.turns--; return d.turns > 0; });
        this.state.enemy.buffs = this.state.enemy.buffs.filter(b => { b.turns--; return b.turns > 0; });
        this.state.enemy.debuffs = this.state.enemy.debuffs.filter(d => { d.turns--; return d.turns > 0; });
        // 护盾/反弹回合递减（归零即清除），与“N回合”描述一致
        if (p.shieldTurns > 0) { p.shieldTurns--; if (p.shieldTurns <= 0) p.shield = 0; }
        if (p.reflectTurns > 0) { p.reflectTurns--; if (p.reflectTurns <= 0) p.reflect = 0; }

        // 灵宠自动行动
        if (this.state.player.pet && this.state.player.petCd === 0) {
            setTimeout(() => this.petAction(), 400);
        }

        // 进入新的玩家回合（解除锁定）
        if (!this.state.finished) this.state.playerTurn = true;
        if (typeof UI !== 'undefined') UI.updateBattle(this.state);
    },

    /* ---------- 检查战斗结束 ---------- */
    checkEnd() {
        if (!this.state) return false;
        if (this.state.player.hp <= 0) {
            this.state.finished = true;
            this.addLog('你战败了...', 'miss');
            setTimeout(() => this.endBattle(false), 1200);
            return true;
        }
        if (this.state.enemy.hp <= 0) {
            this.state.finished = true;
            this.addLog('你战胜了对手！', 'heal');
            setTimeout(() => this.endBattle(true), 1200);
            return true;
        }
        return false;
    },

    /* ---------- 战斗结束 ---------- */
    endBattle(victory) {
        const player = Game.player;
        const enemyTpl = this.state.enemyTpl;
        if (victory) {
            // 奖励
            const xiuReward = enemyTpl.xiuReward;
            const stoneReward = enemyTpl.stoneReward;
            player.xiu += xiuReward;
            player.stone += stoneReward;
            player.stats.totalXiu = (player.stats.totalXiu || 0) + xiuReward;
            player.stats.combatWins = (player.stats.combatWins || 0) + 1;
            // 掉落
            const drops = Inventory.addDrops(player, enemyTpl.drops);
            // 清除临时buff
            delete player.tempHpBuff;
            delete player.tempLingBuff;
            delete player.tempBuffAtk;
            delete player.tempBuffDef;

            if (typeof UI !== 'undefined') {
                UI.hideBattle();
                UI.toast(`胜利！获得${fmtNum(xiuReward)}修为，${fmtNum(stoneReward)}灵石`, 'gold');
                UI.addLog(`战胜${enemyTpl.name}，获得${fmtNum(xiuReward)}修为`, 'evt');
                drops.forEach(d => {
                    const tpl = getEquipTemplate(d.id) || getPill(d.id) || getMaterial(d.id);
                    UI.addLog(`获得掉落：${tpl.name}×${d.count}`, 'evt');
                    UI.toast(`获得：${tpl.name}×${d.count}`, 'gold');
                });
                UI.renderAll();
            }
            // 任务进度
            if (typeof Quests !== 'undefined') Quests.tickProgress('combat_win', player.stats.combatWins);
            SaveSystem.save(player);
        } else {
            // 失败惩罚：损失部分修为
            const loss = Math.floor(player.xiu * 0.05);
            player.xiu -= loss;
            delete player.tempHpBuff;
            delete player.tempLingBuff;
            delete player.tempBuffAtk;
            delete player.tempBuffDef;
            if (typeof UI !== 'undefined') {
                UI.hideBattle();
                UI.toast(`战败，损失${fmtNum(loss)}修为`, 'bad');
                UI.addLog(`败于${enemyTpl.name}，损失${fmtNum(loss)}修为`, 'bad');
                UI.renderAll();
            }
            SaveSystem.save(player);
        }
        this.state = null;
    },

    /* ---------- 逃跑 ---------- */
    flee() {
        if (!this.state || this.state.finished) return;
        if (this.state.playerTurn === false) return; // 敌方回合，锁操作
        // 50%几率逃跑成功
        if (Math.random() < 0.5) {
            this.state.finished = true;
            this.addLog('成功逃遁', 'miss');
            if (typeof UI !== 'undefined') {
                UI.hideBattle();
                UI.toast('成功逃脱', 'good');
            }
            this.state = null;
        } else {
            this.addLog('逃遁失败！', 'bad');
            setTimeout(() => this.enemyTurn(), 800);
        }
    },

    /* ---------- 添加战斗日志 ---------- */
    addLog(msg, type) {
        if (!this.state) return;
        this.state.log.push({ msg, type });
        if (this.state.log.length > 50) this.state.log.shift();
        if (typeof UI !== 'undefined') UI.updateBattleLog(this.state.log);
    },

    /* ---------- 显示伤害飘字 ---------- */
    showFloat(target, value, type) {
        if (typeof UI !== 'undefined') UI.showDamageFloat(target, value, type);
    }
};
