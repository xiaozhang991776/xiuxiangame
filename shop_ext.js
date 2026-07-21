/* ============================================
   仙途·轮回诀 — 坊市拓展包（生成）
   共 77 件新物品：丹药 30 / 装备 24 / 法宝 8 / 功法 6 / 灵宠 9（通用材料已移出，仅保留炼制/转世所需的灵草·灵矿等基础材料与灵兽粮·化形丹·轮回草）
   本文件在 config.js 之后加载，仅向 GameConfig 注入数据，不改动原配置。
   每件物品均含「详细介绍」（desc 字段），坊市卡片与乾坤袋详情中显示。
   ============================================ */
(function () {
    if (typeof GameConfig === 'undefined') return;
    const C = GameConfig;


    // 丹药（30）—— 含 4 个新增效果类型：perm_def / perm_crit / perm_spd / stone
    const newPills = [
        { id: 'p_huixue', name: '回血丹', icon: '丹', quality: 0, desc: '最寻常的疗伤丹，入口化暖流，瞬愈皮肉之伤，江湖修士人人随身。', effect: { type: 'hp', value: 80 }, price: 60, craft: { materials: { m_herb: 3 }, cost: 24 } },
        { id: 'p_xuming', name: '续命丹', icon: '丹', quality: 1, desc: '续一线将断之命，重伤垂死服之可回元气，救急的保命灵丹。', effect: { type: 'hp', value: 600 }, price: 300, craft: { materials: { m_herb: 6, m_ore: 2 }, cost: 120 } },
        { id: 'p_jiuzhuan', name: '九转还魂丹', icon: '丹', quality: 3, desc: '九转火候炼成的还魂奇药，魂飞魄散前一线尚存便可拉回人间。', effect: { type: 'hp', value: 5000 }, price: 2600, craft: { materials: { m_herb: 20, m_beast: 5, m_pearl: 2, m_qi_essence: 1 }, cost: 1040 } },
        { id: 'p_juling', name: '聚灵散', icon: '丹', quality: 0, desc: '散末状的聚灵药，化水饮下灵海顿涌，是斗法前常备的回灵之物。', effect: { type: 'ling', value: 120 }, price: 70, craft: { materials: { m_herb: 3 }, cost: 28 } },
        { id: 'p_ningling', name: '凝灵丹', icon: '丹', quality: 2, desc: '凝水成丹的灵液，一口下去灵力沛然，久战不竭之倚仗。', effect: { type: 'ling', value: 800 }, price: 700, craft: { materials: { m_herb: 10, m_beast: 2, m_pearl: 1 }, cost: 280 } },
        { id: 'p_taiyie', name: '太乙神液', icon: '丹', quality: 4, desc: '太乙仙池所淬的神液，饮之灵海暴涨，乃高阶修士的续灵至宝。', effect: { type: 'ling', value: 4000 }, price: 3600, craft: { materials: { m_herb: 40, m_beast: 12, m_pearl: 4, m_qi_essence: 2, m_chaos: 1 }, cost: 1440 } },
        { id: 'p_chongxu', name: '冲虚丹', icon: '丹', quality: 1, desc: '引虚气入丹田的悟道丹，服之修为自长，省去数年苦修。', effect: { type: 'xiu', value: 600 }, price: 320, craft: { materials: { m_herb: 6, m_ore: 2 }, cost: 128 } },
        { id: 'p_wudao', name: '悟道丹', icon: '丹', quality: 3, desc: '蕴大道碎片的丹丸，服下如亲聆先贤讲法，修为与悟性同进。', effect: { type: 'xiu', value: 4000 }, price: 3200, craft: { materials: { m_herb: 20, m_beast: 5, m_pearl: 2, m_qi_essence: 1 }, cost: 1280 } },
        { id: 'p_pojing', name: '破境散', icon: '丹', quality: 4, desc: '专破境界壁障的散剂，修为将满时服之，可省去闭关磨剑之苦。', effect: { type: 'xiu', value: 20000 }, price: 16000, craft: { materials: { m_herb: 40, m_beast: 12, m_pearl: 4, m_qi_essence: 2, m_chaos: 1 }, cost: 6400 } },
        { id: 'p_kuangzhan', name: '狂战丹', icon: '丹', quality: 1, desc: '激发凶性的战丹，三回合内攻伐暴涨，以命换命的拼命之选。', effect: { type: 'buff_atk', value: 25, turns: 3 }, price: 320, craft: { materials: { m_herb: 6, m_ore: 2 }, cost: 128 } },
        { id: 'p_lietian', name: '裂天丹', icon: '丹', quality: 3, desc: '裂天之威凝于丹，三回合攻伐如雷霆裂空，越阶搏杀的奇兵。', effect: { type: 'buff_atk', value: 60, turns: 3 }, price: 2600, craft: { materials: { m_herb: 20, m_beast: 5, m_pearl: 2, m_qi_essence: 1 }, cost: 1040 } },
        { id: 'p_xuangui', name: '玄龟丹', icon: '丹', quality: 1, desc: '借玄龟之壳的守丹，三回合内防御坚若磐石，硬抗强敌必备。', effect: { type: 'buff_def', value: 20, turns: 3 }, price: 320, craft: { materials: { m_herb: 6, m_ore: 2 }, cost: 128 } },
        { id: 'p_zhenyue', name: '镇岳丹', icon: '丹', quality: 3, desc: '镇岳之力凝丹，三回合如负山岳，任敌万击而不摇。', effect: { type: 'buff_def', value: 50, turns: 3 }, price: 2600, craft: { materials: { m_herb: 20, m_beast: 5, m_pearl: 2, m_qi_essence: 1 }, cost: 1040 } },
        { id: 'p_tongxuan', name: '通玄丹', icon: '丹', quality: 2, desc: '通玄之丹开慧眼，下次突破时壁障自松，成功率小增。', effect: { type: 'breakBonus', value: 0.15 }, price: 600, craft: { materials: { m_herb: 10, m_beast: 2, m_pearl: 1 }, cost: 240 } },
        { id: 'p_pozhang', name: '破障灵丹', icon: '丹', quality: 3, desc: '比破障丹更进一步的灵丹，几乎洞穿境界之膜，破境十拿九稳。', effect: { type: 'breakBonus', value: 0.3 }, price: 2400, craft: { materials: { m_herb: 20, m_beast: 5, m_pearl: 2, m_qi_essence: 1 }, cost: 960 } },
        { id: 'p_yuji', name: '玉肌丹', icon: '丹', quality: 1, desc: '温玉之精炼的培元丹，常服可令肌骨如玉，气血永久小增。', effect: { type: 'perm_hp', value: 120 }, price: 800, craft: { materials: { m_herb: 6, m_ore: 2 }, cost: 320 } },
        { id: 'p_busi', name: '不死丹', icon: '丹', quality: 3, desc: '嗅之生机盎然的不死奇丹，根骨重塑，气血永久大涨。', effect: { type: 'perm_hp', value: 400 }, price: 5200, craft: { materials: { m_herb: 20, m_beast: 5, m_pearl: 2, m_qi_essence: 1 }, cost: 2080 } },
        { id: 'p_lieshi', name: '裂石丹', icon: '丹', quality: 1, desc: '裂石之劲凝丹，筋骨生力，攻击永久小增，夯实根基。', effect: { type: 'perm_atk', value: 20 }, price: 900, craft: { materials: { m_herb: 6, m_ore: 2 }, cost: 360 } },
        { id: 'p_bawang', name: '霸王丹', icon: '丹', quality: 3, desc: '霸王扛鼎之力的丹丸，服之如披甲胄，攻击永久猛进。', effect: { type: 'perm_atk', value: 60 }, price: 6000, craft: { materials: { m_herb: 20, m_beast: 5, m_pearl: 2, m_qi_essence: 1 }, cost: 2400 } },
        { id: 'p_lutian', name: '戮天丹', icon: '丹', quality: 4, desc: '戮天凶威炼成的丹，杀伐之气刻入道躯，攻击永久剧增。', effect: { type: 'perm_atk', value: 180 }, price: 40000, craft: { materials: { m_herb: 40, m_beast: 12, m_pearl: 4, m_qi_essence: 2, m_chaos: 1 }, cost: 16000 } },
        { id: 'p_linghai', name: '灵海丹', icon: '丹', quality: 2, desc: '拓灵海如拓湖泊的丹药，神识容量永久大增，术法更绵长。', effect: { type: 'perm_ling', value: 300 }, price: 3200, craft: { materials: { m_herb: 10, m_beast: 2, m_pearl: 1 }, cost: 1280 } },
        { id: 'p_shenshi', name: '神识丹', icon: '丹', quality: 4, desc: '炼神识如炼金丹的奇药，灵台永阔，是高阶术修的基石。', effect: { type: 'perm_ling', value: 800 }, price: 26000, craft: { materials: { m_herb: 40, m_beast: 12, m_pearl: 4, m_qi_essence: 2, m_chaos: 1 }, cost: 10400 } },
        { id: 'p_xuanjia', name: '玄甲丹', icon: '丹', quality: 1, desc: '玄龟甲气凝丹，皮膜生甲，防御永久小增，立于不败。', effect: { type: 'perm_def', value: 30 }, price: 900, craft: { materials: { m_herb: 6, m_ore: 2 }, cost: 360 } },
        { id: 'p_shanyue', name: '山岳丹', icon: '丹', quality: 3, desc: '山岳之重入体的丹，筋骨如铸，防御永久猛进。', effect: { type: 'perm_def', value: 100 }, price: 6000, craft: { materials: { m_herb: 20, m_beast: 5, m_pearl: 2, m_qi_essence: 1 }, cost: 2400 } },
        { id: 'p_pojun', name: '破军丹', icon: '丹', quality: 2, desc: '破军星力凝丹，出手必中要害，暴击率永久小增。', effect: { type: 'perm_crit', value: 0.05 }, price: 3600, craft: { materials: { m_herb: 10, m_beast: 2, m_pearl: 1 }, cost: 1440 } },
        { id: 'p_ruifeng', name: '锐锋丹', icon: '丹', quality: 4, desc: '锐锋之意刻入神魂，剑出必见血，暴击率永久大涨。', effect: { type: 'perm_crit', value: 0.12 }, price: 28000, craft: { materials: { m_herb: 40, m_beast: 12, m_pearl: 4, m_qi_essence: 2, m_chaos: 1 }, cost: 11200 } },
        { id: 'p_jifeng', name: '疾风丹', icon: '丹', quality: 1, desc: '疾风之意凝丹，身法如电，速度永久小增，先发制人。', effect: { type: 'perm_spd', value: 5 }, price: 900, craft: { materials: { m_herb: 6, m_ore: 2 }, cost: 360 } },
        { id: 'p_liuguang', name: '流光丹', icon: '丹', quality: 3, desc: '流光绕身之丹，动静皆先人一步，速度永久猛进。', effect: { type: 'perm_spd', value: 15 }, price: 6000, craft: { materials: { m_herb: 20, m_beast: 5, m_pearl: 2, m_qi_essence: 1 }, cost: 2400 } },
        { id: 'p_hunyuan', name: '混元金丹', icon: '丹', quality: 4, desc: '混元一气炼成的金丹，攻防气血灵力同铸，根基永久全方大涨。', effect: { type: 'perm_all', value: 20 }, price: 45000, craft: { materials: { m_herb: 40, m_beast: 12, m_pearl: 4, m_qi_essence: 2, m_chaos: 1 }, cost: 18000 } },
        { id: 'p_zhaocai', name: '招财丹', icon: '丹', quality: 2, desc: '聚宝气于丹的奇物，服之财源广进——立得一笔灵石傍身。', effect: { type: 'stone', value: 5000 }, price: 6000, craft: { materials: { m_herb: 10, m_beast: 2, m_pearl: 1 }, cost: 2400 } }
    ];
    newPills.forEach(p => { C.pills.push(p); C.shopItems.pill.push(p.id); });

    // 装备（武器/护甲/饰品 24）+ 法宝（8）
    const newEquip = [
        { id: 'w_qingfeng', type: 'weapon', name: '青锋剑', icon: '剑', quality: 0, atk: 8, def: 0, hp: 0, ling: 0, crit: 0.02, price: 80, desc: '剑身青芒流转，寻常铁匠亦可锻出的入门飞剑，轻灵顺手。', craft: { materials: { m_ore: 3 }, cost: 28 } },
        { id: 'w_liuyun', type: 'weapon', name: '流云剑', icon: '剑', quality: 1, atk: 22, def: 0, hp: 0, ling: 6, crit: 0.04, price: 360, desc: '剑势如流云舒卷，轻柔中藏杀机，初入筑基者爱用。', craft: { materials: { m_ore: 6 }, cost: 126 } },
        { id: 'w_zhanyue', type: 'weapon', name: '斩月刀', icon: '刀', quality: 2, atk: 48, def: 4, hp: 60, ling: 14, crit: 0.06, price: 1900, desc: '刀光如月轮斩落，重劈之威惊蛮，金丹修士的趁手兵刃。', craft: { materials: { m_ore: 9, m_spirit_wood: 4 }, cost: 665 } },
        { id: 'w_liekong', type: 'weapon', name: '裂空枪', icon: '枪', quality: 2, atk: 44, def: 6, hp: 70, ling: 18, crit: 0.08, price: 2100, desc: '枪出裂虚空，洞穿之劲无匹，挑刺之间敌胆已寒。', craft: { materials: { m_ore: 9, m_spirit_wood: 4 }, cost: 735 } },
        { id: 'w_fentian', type: 'weapon', name: '焚天戟', icon: '戟', quality: 3, atk: 120, def: 12, hp: 180, ling: 40, crit: 0.12, price: 12000, desc: '戟尖焚天烈焰缠绕，一挥如燎原，元婴修士的凶兵。', craft: { materials: { m_ore: 12, m_spirit_wood: 5, m_geng_gold: 5, m_pearl: 1 }, cost: 4200 } },
        { id: 'w_jinglei', type: 'weapon', name: '惊雷锤', icon: '锤', quality: 3, atk: 108, def: 20, hp: 200, ling: 30, crit: 0.14, price: 13000, desc: '锤落惊雷炸响，重击碎骨裂金，硬碰硬的霸道之器。', craft: { materials: { m_ore: 12, m_spirit_wood: 5, m_geng_gold: 5, m_pearl: 1 }, cost: 4550 } },
        { id: 'w_taixu', type: 'weapon', name: '太虚环', icon: '环', quality: 4, atk: 360, def: 30, hp: 500, ling: 160, crit: 0.2, price: 88000, desc: '太虚之气凝成的飞环，环转间空间扭曲，大能方驭之。', craft: { materials: { m_ore: 15, m_spirit_wood: 6, m_geng_gold: 6, m_pearl: 1, m_chaos: 2, m_qi_essence: 1 }, cost: 30800 } },
        { id: 'w_zhushen', type: 'weapon', name: '诛神枪', icon: '枪', quality: 4, atk: 420, def: 40, hp: 560, ling: 180, crit: 0.22, price: 96000, desc: '专诛神魂的凶枪，一刺直没灵台，乃诛神灭仙之兵。', craft: { materials: { m_ore: 15, m_spirit_wood: 6, m_geng_gold: 6, m_pearl: 1, m_chaos: 2, m_qi_essence: 1 }, cost: 33600 } },
        { id: 'a_xuangui', type: 'armor', name: '玄龟甲', icon: '甲', quality: 0, atk: 0, def: 8, hp: 40, ling: 0, crit: 0, price: 70, desc: '取玄龟甲片缀成的护甲，笨重却耐打，新手的第一层壳。', craft: { materials: { m_ore: 2, m_herb: 2 }, cost: 24 } },
        { id: 'a_liuyun', type: 'armor', name: '流云袍', icon: '袍', quality: 1, atk: 0, def: 16, hp: 100, ling: 10, crit: 0, price: 340, desc: '轻若流云的道袍，御风而行不滞，兼守与逸。', craft: { materials: { m_ore: 5, m_herb: 4 }, cost: 119 } },
        { id: 'a_zhenhun', type: 'armor', name: '镇魂铠', icon: '铠', quality: 2, atk: 5, def: 34, hp: 280, ling: 16, crit: 0, price: 1900, desc: '铠上刻镇魂纹，近身邪祟自退，金丹护身的铁壁。', craft: { materials: { m_ore: 8, m_herb: 6, m_spirit_wood: 4 }, cost: 665 } },
        { id: 'a_xingyun', type: 'armor', name: '星陨甲', icon: '甲', quality: 3, atk: 15, def: 80, hp: 760, ling: 50, crit: 0.03, price: 12000, desc: '以陨星铁铸的战甲，星力流转护体，元婴不破之屏障。', craft: { materials: { m_ore: 11, m_herb: 8, m_spirit_wood: 5, m_geng_gold: 5, m_pearl: 1 }, cost: 4200 } },
        { id: 'a_taiyi', type: 'armor', name: '太乙道衣', icon: '衣', quality: 3, atk: 8, def: 88, hp: 820, ling: 70, crit: 0.04, price: 14000, desc: '太乙道纹织就的道衣，法术加身更利，术修至爱。', craft: { materials: { m_ore: 11, m_herb: 8, m_spirit_wood: 5, m_geng_gold: 5, m_pearl: 1 }, cost: 4900 } },
        { id: 'a_hunyuan', type: 'armor', name: '混元甲', icon: '甲', quality: 4, atk: 60, def: 300, hp: 2800, ling: 200, crit: 0.05, price: 88000, desc: '混元一气裹身的神甲，万法难侵，大能亦是法宝。', craft: { materials: { m_ore: 14, m_herb: 10, m_spirit_wood: 6, m_geng_gold: 6, m_pearl: 1, m_chaos: 2, m_qi_essence: 1 }, cost: 30800 } },
        { id: 'a_budong', type: 'armor', name: '不动明王甲', icon: '甲', quality: 4, atk: 40, def: 340, hp: 3000, ling: 220, crit: 0.06, price: 96000, desc: '明王法相镇于甲，岿然不动，受万击而身不摇。', craft: { materials: { m_ore: 14, m_herb: 10, m_spirit_wood: 6, m_geng_gold: 6, m_pearl: 1, m_chaos: 2, m_qi_essence: 1 }, cost: 33600 } },
        { id: 'a_zhoutian', type: 'armor', name: '周天锁子甲', icon: '甲', quality: 2, atk: 0, def: 30, hp: 240, ling: 14, crit: 0, price: 1700, desc: '千环相扣的锁子甲，周天灵气自循，守得密不透风。', craft: { materials: { m_ore: 8, m_herb: 6, m_spirit_wood: 4 }, cost: 595 } },
        { id: 'ac_cuiyu', type: 'accessory', name: '翠玉环', icon: '环', quality: 0, atk: 4, def: 4, hp: 16, ling: 10, crit: 0.02, price: 90, desc: '翠玉琢成的腰环，温润养神，初修道人的小饰。', craft: { materials: { m_herb: 2, m_ore: 1 }, cost: 31 } },
        { id: 'ac_jifeng', type: 'accessory', name: '疾风铃', icon: '铃', quality: 1, atk: 10, def: 5, hp: 40, ling: 22, crit: 0.05, price: 360, desc: '铃响引疾风绕身，身法陡快，先发制人。', craft: { materials: { m_herb: 4, m_ore: 3 }, cost: 126 } },
        { id: 'ac_zhenhuny', type: 'accessory', name: '镇魂玉', icon: '玉', quality: 2, atk: 22, def: 12, hp: 120, ling: 46, crit: 0.08, price: 2000, desc: '玉中封镇魂符，邪念难侵、灵台长清，金丹修士的护身符。', craft: { materials: { m_herb: 6, m_ore: 5, m_spirit_wood: 4 }, cost: 700 } },
        { id: 'ac_xingchen', type: 'accessory', name: '星辰链', icon: '链', quality: 3, atk: 40, def: 26, hp: 320, ling: 140, crit: 0.14, price: 12000, desc: '链缀星辰碎屑，运势加身、出手更利，元婴之饰。', craft: { materials: { m_herb: 8, m_ore: 7, m_spirit_wood: 5, m_geng_gold: 5, m_pearl: 1 }, cost: 4200 } },
        { id: 'ac_taixu', type: 'accessory', name: '太虚戒', icon: '戒', quality: 4, atk: 170, def: 100, hp: 1300, ling: 560, crit: 0.26, price: 90000, desc: '太虚之气凝于戒，戴之如纳一方小乾坤，大能标配。', craft: { materials: { m_herb: 10, m_ore: 9, m_spirit_wood: 6, m_geng_gold: 6, m_pearl: 1, m_chaos: 2, m_qi_essence: 1 }, cost: 31500 } },
        { id: 'ac_yinguo', type: 'accessory', name: '因果环', icon: '环', quality: 4, atk: 190, def: 110, hp: 1400, ling: 600, crit: 0.28, price: 98000, desc: '环中藏因果线，牵敌命脉，出手必中要害。', craft: { materials: { m_herb: 10, m_ore: 9, m_spirit_wood: 6, m_geng_gold: 6, m_pearl: 1, m_chaos: 2, m_qi_essence: 1 }, cost: 34300 } },
        { id: 'ac_hundun', type: 'accessory', name: '混沌铃', icon: '铃', quality: 2, atk: 18, def: 10, hp: 110, ling: 52, crit: 0.1, price: 2200, desc: '铃音含混沌意，闻之识海翻腾，扰敌心神。', craft: { materials: { m_herb: 6, m_ore: 5, m_spirit_wood: 4 }, cost: 770 } },
        { id: 'ac_tianming', type: 'accessory', name: '天命珠', icon: '珠', quality: 3, atk: 46, def: 30, hp: 360, ling: 160, crit: 0.16, price: 14000, desc: '珠映天命轨迹，趋吉避凶、运势长隆，元婴至宝。', craft: { materials: { m_herb: 8, m_ore: 7, m_spirit_wood: 5, m_geng_gold: 5, m_pearl: 1 }, cost: 4900 } },
        { id: 'f_zhenhunta', type: 'fabao', name: '镇魂塔', icon: '塔', quality: 4, atk: 250, def: 180, hp: 2400, ling: 600, crit: 0.18, skill: 'f_pagoda_skill', price: 95000, desc: '七层塔影镇压万物，邪祟入内即被磨灭，万法归一的镇派之宝。' },
        { id: 'f_qiankun', type: 'fabao', name: '乾坤镜', icon: '镜', quality: 3, atk: 60, def: 40, hp: 600, ling: 150, crit: 0.1, skill: 'f_mirror_skill', price: 11000, desc: '镜分阴阳，照敌则反照其伤，以彼之矛攻彼之盾。' },
        { id: 'f_wanjun', type: 'fabao', name: '万钧锤', icon: '锤', quality: 2, atk: 20, def: 50, hp: 400, ling: 80, crit: 0.05, skill: 'f_mountain_skill', price: 2200, desc: '锤重如山岳倾压，一击镇敌于地，擅以力破巧。' },
        { id: 'f_huxin', type: 'fabao', name: '护心灯', icon: '灯', quality: 1, atk: 8, def: 15, hp: 100, ling: 30, crit: 0, skill: 'f_bell_skill', price: 500, desc: '灯火护心，危时替主挡下一击，入门修士的保命灯。' },
        { id: 'f_shanhe', type: 'fabao', name: '山河社稷图', icon: '图', quality: 4, atk: 280, def: 200, hp: 2600, ling: 650, crit: 0.2, skill: 'f_pagoda_skill', price: 98000, desc: '图卷展开便纳山河，困敌于一方天地，演绎造化之威。' },
        { id: 'f_liangyi', type: 'fabao', name: '两仪轮', icon: '轮', quality: 3, atk: 60, def: 40, hp: 600, ling: 150, crit: 0.1, skill: 'f_mirror_skill', price: 11500, desc: '轮转两仪生四象，反弹伤害、化守为攻，玄妙非常。' },
        { id: 'f_dinghai', type: 'fabao', name: '定海神针', icon: '针', quality: 2, atk: 20, def: 50, hp: 420, ling: 90, crit: 0.05, skill: 'f_mountain_skill', price: 2400, desc: '针落如定沧海，镇压一切波澜，守势无双。' },
        { id: 'f_jiuxiao', type: 'fabao', name: '九霄环', icon: '环', quality: 1, atk: 8, def: 15, hp: 110, ling: 35, crit: 0, skill: 'f_bell_skill', price: 600, desc: '环鸣九霄，危急时护主挡击，轻盈易驭的护身环。' },
        // —— 大成期(大乘)以上方可请回的仙界重宝，属性碾压凡间法宝，是后期最直接的战力引擎 ——
        { id: 'f_taiqing_ta', type: 'fabao', name: '太清宝塔', icon: '塔', quality: 4, atk: 800, def: 600, hp: 8000, ling: 2000, crit: 0.3, skill: 'f_pagoda_skill', realmReq: 7, price: 5000000, desc: '太清仙宗镇派之宝塔，塔影垂落便镇万法，大乘以上方能请回。' },
        { id: 'f_zhutian_ding', type: 'fabao', name: '诸天鼎', icon: '鼎', quality: 4, atk: 1200, def: 900, hp: 12000, ling: 3000, crit: 0.35, skill: 'f_mountain_skill', realmReq: 8, price: 30000000, desc: '古战场夺来的诸天炼器鼎，鼎气压塌虚空，真仙以上方可驭使。' },
        { id: 'f_wuheng_jing', type: 'fabao', name: '无衡镜', icon: '镜', quality: 4, atk: 1800, def: 1400, hp: 18000, ling: 4500, crit: 0.4, skill: 'f_mirror_skill', realmReq: 9, price: 150000000, desc: '映照诸天平衡的无衡古镜，照敌则反照其伤，金仙以上方承其力。' }
    ];
    newEquip.forEach(e => {
        C.equipmentTemplates.push(e);
        if (e.type === 'fabao') C.shopItems.fabao.push(e.id);
        else C.shopItems.equipment.push(e.id);
    });

    // 功法（6）
    const newGongfa = [
        { id: 'g_jiuzhuan', name: '九转玄功', icon: '功', xiuBonus: 0.15, realmReq: 0, price: 300, desc: '九转周天的基础功法，气脉流转略快，新晋修士可习。' },
        { id: 'g_taiyin', name: '太阴虚冥诀', icon: '功', xiuBonus: 0.35, realmReq: 1, price: 2000, desc: '纳太阴虚冥之气，修炼时如临幽潭，效率大进。' },
        { id: 'g_liangyi', name: '两仪微尘诀', icon: '功', xiuBonus: 0.75, realmReq: 2, price: 12000, desc: '演两仪生灭之机，吐纳间微尘化乾坤，金丹以上方窥门径。' },
        { id: 'g_zhoutian', name: '周天星辰诀', icon: '功', xiuBonus: 1.2, realmReq: 3, price: 80000, desc: '引周天星辰之力入体，修炼如沐星河，元婴大修方成。' },
        { id: 'g_hongmeng', name: '鸿蒙紫气诀', icon: '功', xiuBonus: 1.8, realmReq: 4, price: 500000, desc: '采鸿蒙未判之紫气，道韵自生，化神以上方可承之。' },
        { id: 'g_hunyuanwuji', name: '混元无极功', icon: '功', xiuBonus: 2.5, realmReq: 4, price: 1200000, desc: '混元无极、周流不息，乃近乎大道的吐纳至法，非大能不可驭。' },
        // —— 大成期(大乘)以上方可习练的顶级功法，修炼速率呈指数暴涨，是后期战力的根本引擎 ——
        { id: 'g_taiqing',   name: '太清紫极功', icon: '功', xiuBonus: 4.0,  realmReq: 7,  price: 5000000,   desc: '太清仙宗根本功法，紫极之气周转，修炼速率暴涨，大乘以上方窥门径。' },
        { id: 'g_ziixiao',   name: '紫霄混元功', icon: '功', xiuBonus: 8.0,  realmReq: 8,  price: 30000000,  desc: '引紫霄神雷入丹田，吐纳间道韵自生，真仙大修方能承之。' },
        { id: 'g_lihuo',    name: '离火焚天功', icon: '功', xiuBonus: 16.0, realmReq: 9,  price: 150000000, desc: '离火真炎炼形神，修炼如浴火重生，金仙以上方可驭使。' },
        { id: 'g_xuantian', name: '玄天镇魔功', icon: '功', xiuBonus: 32.0, realmReq: 10, price: 800000000, desc: '玄天之力镇万魔，一呼一吸皆是大神通，太乙天尊之传承。' },
        { id: 'g_ruzun',    name: '儒尊浩然功', icon: '功', xiuBonus: 64.0, realmReq: 11, price: 4000000000, desc: '浩然正气贯长虹，修炼速率近乎夺天地造化，大罗金仙方成大器。' },
        { id: 'g_daodao',   name: '无上道经',   icon: '功', xiuBonus: 128.0, realmReq: 12, price: 20000000000, desc: '大道无上之总纲，吐纳即与道同频，道祖方窥其万一。' }
    ];
    newGongfa.forEach(g => { C.gongfas.push(g); C.shopItems.gongfa.push(g.id); });

    // 灵宠（9）
    const newPets = [
        { id: 'pet_huoyun', name: '火云犬', icon: '犬', elem: 'fire', realmReq: 0, atk: 12, def: 4, hp: 60, skill: 'pet_bite', price: 2500, desc: '通体燃火云的小犬，性烈忠诚，扑咬间带三分炎威。' },
        { id: 'pet_yutu', name: '玉兔', icon: '兔', elem: 'wood', realmReq: 1, atk: 4, def: 18, hp: 180, skill: 'pet_shield', price: 7000, desc: '月宫玉兔，温顺而善护主，危时化盾挡灾。' },
        { id: 'pet_jinchi', name: '金翅雕', icon: '雕', elem: 'metal', realmReq: 2, atk: 40, def: 12, hp: 240, skill: 'pet_flame', price: 22000, desc: '金翅大雕，凌空喷吐烈焰，俯冲如雷，群攻好手。' },
        { id: 'pet_xuanwu_g', name: '玄武龟', icon: '龟', elem: 'water', realmReq: 2, atk: 6, def: 40, hp: 400, skill: 'pet_shield', price: 24000, desc: '背负山河的玄龟，防御无双，护主如山不动。' },
        { id: 'pet_chiyan', name: '赤焰马', icon: '马', elem: 'fire', realmReq: 1, atk: 20, def: 10, hp: 150, skill: 'pet_flame', price: 9000, desc: '四蹄踏火的灵马，冲撞带焰，疾如风、猛如虎。' },
        { id: 'pet_moqilin', name: '墨麒麟', icon: '麒', elem: 'earth', realmReq: 3, atk: 90, def: 50, hp: 700, skill: 'pet_roar', price: 85000, desc: '通体墨玉的麒麟，一声长吟震散敌防，瑞兽之威。' },
        { id: 'pet_baize', name: '白泽', icon: '泽', elem: 'wood', realmReq: 3, atk: 30, def: 60, hp: 600, skill: 'pet_shield', price: 90000, desc: '通万物之白的白泽，悬角辟邪，护主万邪难近。' },
        { id: 'pet_zhuque', name: '朱雀', icon: '雀', elem: 'fire', realmReq: 3, atk: 100, def: 45, hp: 680, skill: 'pet_flame', price: 95000, desc: '浴火重生的朱雀，火羽焚天，群攻之极致。' },
        { id: 'pet_zulong', name: '祖龙', icon: '龙', elem: 'water', realmReq: 4, atk: 200, def: 120, hp: 1600, skill: 'pet_roar', price: 300000, desc: '传说中龙族始祖的一缕血脉，龙吟镇万灵，至强灵宠。' },
        // —— 大成期(大乘)以上方可收服/购买的洪荒灵宠，属性碾压寻常灵兽，出战即定乾坤 ——
        { id: 'pet_qilinwang', name: '麒麟王', icon: '麒', elem: 'earth', realmReq: 7, atk: 600, def: 400, hp: 5000, skill: 'pet_roar', price: 2000000, desc: '统御瑞兽一脉的麒麟王，一声长吟震碎敌防，大乘修士的护道至尊。' },
        { id: 'pet_baizewang', name: '白泽王', icon: '泽', elem: 'wood', realmReq: 8, atk: 300, def: 600, hp: 4800, skill: 'pet_shield', price: 3000000, desc: '通晓万物之白的白泽之王，悬角辟尽诸邪，真仙方可收为护法。' },
        { id: 'pet_zhuquehuang', name: '朱雀皇', icon: '雀', elem: 'fire', realmReq: 9, atk: 700, def: 300, hp: 5200, skill: 'pet_flame', price: 4000000, desc: '焚天重生的朱雀女皇，火羽燎原、群攻无双，金仙座下圣禽。' },
        { id: 'pet_zulong_tc', name: '祖龙·太初', icon: '龙', elem: 'water', realmReq: 10, atk: 1500, def: 900, hp: 12000, skill: 'pet_roar', price: 12000000, desc: '龙族太初始祖的本源血脉，龙吟镇万灵、吐息溺星河，太乙天尊方能驭使。' }
    ];
    newPets.forEach(p => { C.pets.push(p); C.shopItems.pet.push(p.id); });

    if (typeof UI !== 'undefined' && UI.log) {
        // 静默，不喧宾夺主
    }
})();
