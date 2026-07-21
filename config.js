/* ============================================
   仙途·轮回诀 — 游戏配置数据
   境界 / 五行 / 技能 / 物品 / 地图 / 敌人 / 商店 / 任务
   ============================================ */

const GameConfig = {
    /* ---------- 五行配置（相克：金克木 木克土 土克水 水克火 火克金） ---------- */
    elements: {
        metal: { name: '金', color: '#d4af37', counter: 'wood', desc: '攻伐凌厉' },
        wood:  { name: '木', color: '#6dbe6d', counter: 'earth', desc: '生生不息' },
        water: { name: '水', color: '#5dade2', counter: 'fire', desc: '灵动善变' },
        fire:  { name: '火', color: '#e74c3c', counter: 'metal', desc: '焚天烈焰' },
        earth: { name: '土', color: '#c4955a', counter: 'water', desc: '厚重如山' }
    },

    /* ---------- 境界配置（13大境界 × 15层小境界 = 195段） ---------- */
    realms: [
        { name: '练气', layers: 15, baseXiu: 100,    xiuMult: 1.25, atkBonus: 2,      defBonus: 1,      hpBonus: 20,      lingBonus: 10,       breakthroughRate: 0.95 },
        { name: '筑基', layers: 15, baseXiu: 1200,   xiuMult: 1.30, atkBonus: 8,      defBonus: 5,      hpBonus: 80,      lingBonus: 30,       breakthroughRate: 0.80 },
        { name: '金丹', layers: 15, baseXiu: 15000,  xiuMult: 1.35, atkBonus: 30,     defBonus: 20,     hpBonus: 300,     lingBonus: 100,      breakthroughRate: 0.65 },
        { name: '元婴', layers: 15, baseXiu: 2e5,    xiuMult: 1.40, atkBonus: 120,    defBonus: 80,     hpBonus: 1200,    lingBonus: 400,      breakthroughRate: 0.50 },
        { name: '化神', layers: 15, baseXiu: 6e7,    xiuMult: 1.80, atkBonus: 500,    defBonus: 320,    hpBonus: 5000,    lingBonus: 1500,     breakthroughRate: 0.35 },
        { name: '炼虚', layers: 15, baseXiu: 2e9,    xiuMult: 1.90, atkBonus: 1200,   defBonus: 800,    hpBonus: 12000,   lingBonus: 4000,     breakthroughRate: 0.30 },
        { name: '合体', layers: 15, baseXiu: 1e11,   xiuMult: 1.95, atkBonus: 2800,   defBonus: 1800,   hpBonus: 28000,   lingBonus: 10000,    breakthroughRate: 0.25 },
        // 注：高境界(大乘+)的 baseXiu 已重缩放，使「满层突破成本 = baseXiu × xiuMult^14」恒 < 9e15(JS 安全整数)，
        // 否则原数值(5e12×2^14≈8e16 起)会溢出安全整数，导致大乘满层后永远卡死、无法突破。
        { name: '大乘', layers: 15, baseXiu: 2.0e11,  xiuMult: 2.00, atkBonus: 6500,   defBonus: 4200,   hpBonus: 65000,   lingBonus: 24000,     breakthroughRate: 0.20 },
        { name: '真仙', layers: 15, baseXiu: 2.15e11, xiuMult: 2.00, atkBonus: 15000,  defBonus: 10000,  hpBonus: 150000,  lingBonus: 60000,     breakthroughRate: 0.15 },
        { name: '金仙', layers: 15, baseXiu: 2.3e11,  xiuMult: 2.00, atkBonus: 35000,  defBonus: 23000,  hpBonus: 350000,  lingBonus: 150000,    breakthroughRate: 0.12 },
        { name: '太乙', layers: 15, baseXiu: 2.4e11,  xiuMult: 2.00, atkBonus: 80000,  defBonus: 55000,  hpBonus: 800000,  lingBonus: 400000,    breakthroughRate: 0.10 },
        { name: '大罗', layers: 15, baseXiu: 2.45e11, xiuMult: 2.00, atkBonus: 180000, defBonus: 120000, hpBonus: 1800000, lingBonus: 1000000,   breakthroughRate: 0.08 },
        { name: '道祖', layers: 15, baseXiu: 2.5e11,  xiuMult: 2.00, atkBonus: 400000, defBonus: 280000, hpBonus: 4000000, lingBonus: 2500000,   breakthroughRate: 0.05 }
    ],

    /* ---------- 品质配置 ---------- */
    qualities: [
        { key: 'fan',  name: '凡品', color: '#9ca3af', mult: 1.0,  sellMult: 1  },
        { key: 'ling', name: '灵品', color: '#4ade80', mult: 1.5,  sellMult: 3  },
        { key: 'bao',  name: '宝品', color: '#3b82f6', mult: 2.4,  sellMult: 10 },
        { key: 'xian', name: '仙品', color: '#a855f7', mult: 4.0,  sellMult: 35 },
        { key: 'shen', name: '神品', color: '#f43f5e', mult: 7.0,  sellMult: 120}
    ],

    /* ---------- 渡劫天劫配置 ---------- */
    tribulations: [
        { id: 'lei',    name: '九天雷劫', icon: '⚡', elem: 'metal',
          desc: '天穹裂开，紫霄神雷劈落，淬炼道躯。以攻伐之威硬抗，方显道心。',
          baseChance: 0.60, successBonus: { xiuMult: 0.06, stoneMult: 0.04 },
          protectCostBase: 300, protectBonus: { xiuMult: 0.02, stoneMult: 0.015 },
          failPenalty: { layerDown: 2, xiuLossPct: 0.30, lifeLoss: 5 } },
        { id: 'xinmo', name: '心魔大劫', icon: '🌀', elem: 'wood',
          desc: '心中妄念化形，幻境叠生。需灵台清明、悟性通明方能勘破。',
          baseChance: 0.58, successBonus: { xiuMult: 0.07, stoneMult: 0.05 },
          protectCostBase: 500, protectBonus: { xiuMult: 0.02, stoneMult: 0.02 },
          failPenalty: { layerDown: 1, xiuLossPct: 0.40, lifeLoss: 8 } },
        { id: 'yehuo', name: '无量业火', icon: '🔥', elem: 'fire',
          desc: '红莲业火自足底燃起，焚尽业障亦焚道基。须气血雄浑方可熬过。',
          baseChance: 0.56, successBonus: { xiuMult: 0.08, stoneMult: 0.06 },
          protectCostBase: 800, protectBonus: { xiuMult: 0.025, stoneMult: 0.025 },
          failPenalty: { layerDown: 3, xiuLossPct: 0.50, lifeLoss: 10 } }
    ],

    /* ---------- 装备模板 ---------- */
    equipmentTemplates: [
        // 武器
        { id: 'w_short_sword',  type: 'weapon', name: '寒铁短剑',   icon: '剑', quality: 0, atk: 5,   def: 0,  hp: 0,   ling: 0,  crit: 0,    desc: '寒铁所铸，锋利无匹', price: 50 },
        { id: 'w_flame_blade',  type: 'weapon', name: '烈焰刀',     icon: '刀', quality: 1, atk: 14,  def: 0,  hp: 0,   ling: 5,  crit: 0.03, desc: '附火灵之力，斩敌如焚', price: 280 },
        { id: 'w_zither',       type: 'weapon', name: '七弦灵琴',   icon: '琴', quality: 2, atk: 32,  def: 5,  hp: 60,  ling: 20, crit: 0.05, desc: '以音杀人，余音绕梁', price: 1500 },
        { id: 'w_thunder_sword',type: 'weapon', name: '紫电雷剑',   icon: '剑', quality: 3, atk: 90,  def: 10, hp: 150, ling: 50, crit: 0.12, desc: '雷霆之力凝聚，斩魂灭魄', price: 9800 },
        { id: 'w_chaos_sword',  type: 'weapon', name: '混沌剑',     icon: '剑', quality: 4, atk: 380, def: 40, hp: 600, ling: 200,crit: 0.20, desc: '混沌之力所化，斩断因果', price: 88000 },
        { id: 'w_azure_spear', type: 'weapon', name: '青锋枪',   icon: '枪', quality: 2, atk: 28,  def: 4,  hp: 50,  ling: 20, crit: 0.06, desc: '青锋凛冽，挑刺如龙', price: 1800 },
        { id: 'w_sun_moon',    type: 'weapon', name: '日月轮',   icon: '轮', quality: 3, atk: 72,  def: 8,  hp: 130, ling: 48, crit: 0.11, desc: '日月交辉，轮转破敌', price: 8800 },
        { id: 'w_pangu_axe',   type: 'weapon', name: '盘古斧',   icon: '斧', quality: 4, atk: 430, def: 25, hp: 520, ling: 120,crit: 0.22, desc: '开天辟地之威，重若山岳', price: 92000 },
        // 护甲
        { id: 'a_cloth_robe',   type: 'armor',  name: '麻布道袍',   icon: '袍', quality: 0, atk: 0,   def: 4,  hp: 20,  ling: 0,  crit: 0,    desc: '寻常布衣，聊胜于无', price: 40 },
        { id: 'a_silk_robe',    type: 'armor',  name: '云纹锦袍',   icon: '袍', quality: 1, atk: 0,   def: 12, hp: 80,  ling: 8,  crit: 0,    desc: '云纹加持，灵气流转', price: 260 },
        { id: 'a_spirit_armor', type: 'armor',  name: '灵纹战甲',   icon: '甲', quality: 2, atk: 5,   def: 28, hp: 240, ling: 15, crit: 0,    desc: '灵纹铭刻，刀枪不入', price: 1400 },
        { id: 'a_starlight',    type: 'armor',  name: '星辉仙衣',   icon: '衣', quality: 3, atk: 15,  def: 75, hp: 700, ling: 60, crit: 0.03, desc: '星辉织就，免疫百邪', price: 9200 },
        { id: 'a_chaos_robe',   type: 'armor',  name: '混沌道袍',   icon: '袍', quality: 4, atk: 60,  def: 300,hp: 2800,ling: 240,crit: 0.05, desc: '混沌之力护体，万法不侵', price: 82000 },
        { id: 'a_bronze_mirror',type: 'armor',  name: '青铜镜',     icon: '镜', quality: 1, atk: 0,   def: 14, hp: 95,  ling: 10, crit: 0,    desc: '青铜照影，邪祟难近', price: 300 },
        { id: 'a_azure_robe',   type: 'armor',  name: '青云袍',     icon: '袍', quality: 2, atk: 0,   def: 34, hp: 310, ling: 26, crit: 0.02, desc: '青云加护，灵气绵长', price: 1750 },
        { id: 'a_celestial',    type: 'armor',  name: '天蚕衣',     icon: '衣', quality: 3, atk: 8,   def: 88, hp: 840, ling: 78, crit: 0.04, desc: '天蚕丝织，刀剑难伤', price: 11200 },
        // 饰品
        { id: 'ac_jade_pendant',type: 'accessory', name: '灵玉佩',   icon: '玉', quality: 0, atk: 2,  def: 2,  hp: 10,  ling: 8,  crit: 0.02, desc: '灵玉所制，安神定志', price: 60 },
        { id: 'ac_fire_ring',   type: 'accessory', name: '炎火戒',   icon: '戒', quality: 1, atk: 6,  def: 3,  hp: 30,  ling: 20, crit: 0.05, desc: '炎火凝聚，催动法术', price: 300 },
        { id: 'ac_spirit_band', type: 'accessory', name: '灵纹束带', icon: '带', quality: 2, atk: 12, def: 8,  hp: 100, ling: 45, crit: 0.08, desc: '灵纹铭刻，催发灵力', price: 1600 },
        { id: 'ac_star_pendant',type: 'accessory', name: '星辰坠',   icon: '坠', quality: 3, atk: 35, def: 22, hp: 300, ling: 130,crit: 0.15, desc: '星辰之力凝聚，运势加身', price: 10000 },
        { id: 'ac_chaos_pearl', type: 'accessory', name: '混沌珠',   icon: '珠', quality: 4, atk: 150,def: 90, hp: 1200,ling: 520,crit: 0.25, desc: '混沌所凝，道韵流转', price: 85000 },
        { id: 'ac_wind_charm',  type: 'accessory', name: '风灵符',   icon: '符', quality: 1, atk: 8,   def: 4,  hp: 42,  ling: 26, crit: 0.06, desc: '风灵萦绕，身法轻盈', price: 360 },
        { id: 'ac_dragon_jade', type: 'accessory', name: '龙玉珏',   icon: '珏', quality: 2, atk: 18,  def: 11, hp: 140, ling: 58, crit: 0.10, desc: '龙玉温养，灵机盎然', price: 2000 },
        { id: 'ac_void_orb',    type: 'accessory', name: '太虚珠',   icon: '珠', quality: 4, atk: 180, def: 100,hp: 1400,ling: 580,crit: 0.28, desc: '太虚之气所凝，运势加身', price: 90000 },
        // 法宝（独有栏位）
        { id: 'f_bell',         type: 'fabao',  name: '小金钟',     icon: '钟', quality: 1, atk: 8,   def: 15, hp: 100, ling: 30, crit: 0,    desc: '护身法宝，可挡一击', price: 500, skill: 'f_bell_skill' },
        { id: 'f_mountain',     type: 'fabao',  name: '须弥小山',   icon: '山', quality: 2, atk: 20,  def: 50, hp: 400, ling: 80, crit: 0.05, desc: '镇压万物，重如泰山', price: 2200, skill: 'f_mountain_skill' },
        { id: 'f_mirror',       type: 'fabao',  name: '阴阳镜',     icon: '镜', quality: 3, atk: 60,  def: 40, hp: 600, ling: 150,crit: 0.10, desc: '阴阳流转，反弹伤害', price: 11000, skill: 'f_mirror_skill' },
        { id: 'f_pagoda',       type: 'fabao',  name: '七宝玲珑塔', icon: '塔', quality: 4, atk: 250, def: 180,hp: 2400,ling: 600,crit: 0.18, desc: '镇压一切邪祟，万法归一', price: 95000, skill: 'f_pagoda_skill' },
        { id: 'f_jade_ruyi',    type: 'fabao',  name: '玉如意',     icon: '如意', quality: 0, atk: 3,  def: 6,  hp: 50,  ling: 15, crit: 0,    desc: '寻常护身法宝，可挡一击', price: 180, skill: 'f_bell_skill' },
        { id: 'f_void_banner',  type: 'fabao',  name: '招魂幡',     icon: '幡', quality: 4, atk: 280, def: 200,hp: 2600,ling: 650,crit: 0.20, desc: '招魂摄魄，万灵听令', price: 98000, skill: 'f_pagoda_skill' }
    ],

    /* ---------- 丹药配置 ---------- */
    pills: [
        { id: 'p_qi_pill',     name: '聚气丹',   icon: '丹', quality: 0, desc: '恢复50灵力',          effect: { type: 'ling', value: 50 },        price: 30,  craft: { materials: {m_herb:2}, cost: 20 } },
        { id: 'p_hp_pill',     name: '回春丹',   icon: '丹', quality: 0, desc: '恢复100气血',         effect: { type: 'hp', value: 100 },        price: 30,  craft: { materials: {m_herb:2}, cost: 20 } },
        { id: 'p_xiu_pill',    name: '筑基丹',   icon: '丹', quality: 1, desc: '立即获得200修为',     effect: { type: 'xiu', value: 200 },       price: 150, craft: { materials: {m_herb:5, m_ore:2}, cost: 100 } },
        { id: 'p_atk_pill',    name: '虎力丹',   icon: '丹', quality: 1, desc: '战斗中攻击+15（3回合）', effect: { type: 'buff_atk', value: 15, turns: 3 }, price: 200, craft: { materials: {m_beast:3}, cost: 120 } },
        { id: 'p_def_pill',    name: '金刚丹',   icon: '丹', quality: 1, desc: '战斗中防御+10（3回合）', effect: { type: 'buff_def', value: 10, turns: 3 }, price: 200, craft: { materials: {m_ore:3}, cost: 120 } },
        { id: 'p_breakthrough',name: '破障丹',   icon: '丹', quality: 2, desc: '突破成功率+20%',      effect: { type: 'breakBonus', value: 0.2 }, price: 800, craft: { materials: {m_herb:10, m_ore:5, m_beast:3}, cost: 500 } },
        { id: 'p_permanent_hp',name: '培元丹',   icon: '丹', quality: 2, desc: '永久+50气血',         effect: { type: 'perm_hp', value: 50 },    price: 900, craft: { materials: {m_herb:8, m_pearl:1}, cost: 600 } },
        { id: 'p_permanent_atk',name: '锻骨丹',  icon: '丹', quality: 3, desc: '永久+8攻击',          effect: { type: 'perm_atk', value: 8 },    price: 3000, craft: { materials: {m_ore:15, m_beast:8, m_pearl:2}, cost: 2000 } },
        { id: 'p_immortal',    name: '九转金丹', icon: '丹', quality: 4, desc: '永久+30攻击 +200气血', effect: { type: 'perm_all', value: 30 },   price: 50000, craft: { materials: {m_herb:50, m_ore:30, m_beast:20, m_pearl:10}, cost: 30000 } },
        { id: 'p_grand_hp',   name: '大还丹',   icon: '丹', quality: 3, desc: '恢复2000气血',        effect: { type: 'hp', value: 2000 },      price: 2400, craft: { materials: {m_herb:20, m_pearl:2}, cost: 1500 } },
        { id: 'p_grand_ling', name: '聚灵丹',   icon: '丹', quality: 2, desc: '恢复500灵力',         effect: { type: 'ling', value: 500 },     price: 700,  craft: { materials: {m_herb:10, m_beast:3}, cost: 400 } },
        { id: 'p_ningshen',  name: '凝神丹',   icon: '丹', quality: 3, desc: '永久+200灵力',        effect: { type: 'perm_ling', value: 200 }, price: 5000, craft: { materials: {m_herb:30, m_pearl:3, m_qi_essence:1}, cost: 3000 } }
    ],

    /* ---------- 材料配置 ---------- */
    materials: [
        { id: 'm_herb',  name: '灵草',   icon: '草', quality: 0, price: 10,  desc: '炼丹基础材料' },
        { id: 'm_ore',   name: '灵矿',   icon: '矿', quality: 0, price: 12,  desc: '炼器基础材料' },
        { id: 'm_beast', name: '妖兽内丹',icon: '丹', quality: 1, price: 40,  desc: '妖兽核心' },
        { id: 'm_pearl', name: '灵珠',   icon: '珠', quality: 2, price: 200, desc: '炼丹高级材料' },
        { id: 'm_chaos', name: '混沌石', icon: '石', quality: 4, price: 8000,desc: '蕴含混沌之力的奇石' },
        { id: 'm_spirit_wood', name: '灵木',   icon: '木', quality: 1, price: 30,  desc: '温养灵气的奇木' },
        { id: 'm_geng_gold',  name: '庚金',   icon: '金', quality: 2, price: 150, desc: '锋锐无比的庚金之精' },
        { id: 'm_qi_essence',name: '精气',   icon: '气', quality: 3, price: 800, desc: '天地精气凝炼而成' },
        { id: 'm_rebirth_herb', name: '轮回草', icon: '轮', quality: 5, price: 5000000000, desc: '转世轮回之引，根植幽冥，坊市有售' }
    ],

    /* ---------- 功法配置 ---------- */
    gongfas: [
        { id: 'g_basic',    name: '基础吐纳术', icon: '功', quality: 0, xiuBonus: 0.10, price: 0,     desc: '最基础的修炼功法', realmReq: 0 },
        { id: 'g_five_elem',name: '五行诀',     icon: '功', quality: 1, xiuBonus: 0.25, price: 800,   desc: '调和五行，修炼效率提升', realmReq: 1 },
        { id: 'g_purple',   name: '紫气东来',   icon: '功', quality: 2, xiuBonus: 0.50, price: 5000,  desc: '吸纳紫气，道韵加身', realmReq: 2 },
        { id: 'g_chaos',    name: '混沌造化功', icon: '功', quality: 3, xiuBonus: 1.00, price: 40000, desc: '混沌之力，造化万物', realmReq: 3 },
        { id: 'g_immortal', name: '太上感应篇', icon: '功', quality: 4, xiuBonus: 2.00, price: 300000,desc: '太上传承，道法自然', realmReq: 4 },
        { id: 'g_void',     name: '虚空炼神诀', icon: '功', quality: 4, xiuBonus: 1.50, price: 150000,desc: '虚空炼神，道韵自生', realmReq: 4 }
    ],

    /* ---------- 技能配置（玩家可学） ---------- */
    skills: [
        { id: 's_basic_strike', name: '一击',     elem: null,   cost: 0,  cd: 0, dmgMult: 1.0,  desc: '基础攻击',         learnCost: 0,      realmReq: 0, upCostMult: 1.15 },
        { id: 's_sword_qi',     name: '剑气斩',   elem: 'metal', cost: 15, cd: 0, dmgMult: 1.6,  desc: '金属性，凌厉剑气', learnCost: 2000,   realmReq: 0, upCostMult: 1.18 },
        { id: 's_fire_ball',    name: '火球术',   elem: 'fire',  cost: 20, cd: 0, dmgMult: 1.8,  desc: '火属性，灼烧敌人', learnCost: 3000,   realmReq: 0, upCostMult: 1.18 },
        { id: 's_water_arrow',  name: '寒冰矢',   elem: 'water', cost: 18, cd: 1, dmgMult: 1.5,  desc: '水属性，减速敌人', learnCost: 5000,   realmReq: 0, upCostMult: 1.18, debuff: { type: 'spd', value: 0.3, turns: 2 } },
        { id: 's_wood_heal',    name: '回春术',   elem: 'wood',  cost: 25, cd: 2, healMult: 1.0, desc: '木属性，恢复气血', learnCost: 8000,   realmReq: 1, upCostMult: 1.20 },
        { id: 's_earth_shield', name: '土盾术',   elem: 'earth', cost: 30, cd: 3, shield: 0.5,   desc: '土属性，护身盾甲', learnCost: 12000,  realmReq: 1, upCostMult: 1.20, buff: { type: 'def', value: 20, turns: 3 } },
        { id: 's_thunder',      name: '雷霆万钧', elem: 'metal', cost: 60, cd: 3, dmgMult: 3.0,  desc: '金属性群雷，强力一击', learnCost: 50000,  realmReq: 2, upCostMult: 1.22 },
        { id: 's_inferno',      name: '焚天烈焰', elem: 'fire',  cost: 70, cd: 3, dmgMult: 3.2,  desc: '火属性烈焰，灼烧万物', learnCost: 60000,  realmReq: 2, upCostMult: 1.22, debuff: { type: 'burn', value: 0.15, turns: 3 } },
        { id: 's_combo_chain',  name: '连珠诀',   elem: null,   cost: 50, cd: 4, dmgMult: 2.4,  desc: '连击三次，每次递增', learnCost: 80000,  realmReq: 2, upCostMult: 1.22, combo: 3 },
        { id: 's_soul_seal',    name: '封魂印',   elem: null,   cost: 80, cd: 5, dmgMult: 2.0,  desc: '封印敌人灵力',     learnCost: 150000, realmReq: 3, upCostMult: 1.25, debuff: { type: 'seal', value: 0.5, turns: 2 } },
        { id: 's_chaos_slash',  name: '混沌斩',   elem: null,   cost: 120,cd: 5, dmgMult: 5.0,  desc: '混沌之力斩击，无视防御', learnCost: 500000, realmReq: 3, upCostMult: 1.28, ignoreDef: true },
        { id: 's_immortal_art', name: '仙法·万剑归宗', elem: null, cost: 200, cd: 6, dmgMult: 8.0, desc: '万剑齐发，灭杀一切', learnCost: 2000000, realmReq: 4, upCostMult: 1.30 },
        { id: 's_xuanyuan',     name: '玄元无极功',   elem: null, cost: 30, cd: 2, dmgMult: 2.2, desc: '无极玄力，攻伐凌厉，等级越高威能越盛', learnCost: 12000, realmReq: 1, upCostMult: 1.20 },
        // —— 大成期(大乘)以上方可修习的绝学，威能远超凡术，可大幅提升斗法战力 ——
        { id: 's_taiqing',     name: '太清剑诀',   elem: 'metal', cost: 150, cd: 4, dmgMult: 15,  desc: '太清仙宗剑诀，一剑化万道清光，大乘修士的杀伐绝学', learnCost: 5000000,  realmReq: 7, upCostMult: 1.35, ignoreDef: true },
        { id: 's_zixiao',     name: '紫霄神雷',   elem: 'metal', cost: 180, cd: 5, dmgMult: 25,  desc: '引紫霄神雷灌体，雷光所至万法崩摧', learnCost: 20000000, realmReq: 8, upCostMult: 1.38, debuff: { type: 'seal', value: 0.4, turns: 3 } },
        { id: 's_lihuo',      name: '离火焚天',   elem: 'fire',  cost: 220, cd: 5, dmgMult: 40,  desc: '离火真炎焚尽八荒，触者形神俱灭', learnCost: 80000000,  realmReq: 9, upCostMult: 1.40, debuff: { type: 'burn', value: 0.25, turns: 3 } },
        { id: 's_xuantian',   name: '玄天镇魔',   elem: null,   cost: 280, cd: 6, dmgMult: 60,  desc: '玄天之力镇封亘古大魔，一击定乾坤', learnCost: 300000000, realmReq: 10, upCostMult: 1.42, ignoreDef: true },
        { id: 's_ruzun',      name: '儒尊·浩然', elem: null,   cost: 360, cd: 7, dmgMult: 100, desc: '浩然正气贯长虹，言出法随、灭度诸邪', learnCost: 1200000000, realmReq: 11, upCostMult: 1.45, combo: 2 },
        { id: 's_daodao',    name: '道·无上',  elem: null,   cost: 500, cd: 8, dmgMult: 200, desc: '大道无上，一念生灭轮回，乃诸天至高的攻伐道法', learnCost: 5000000000, realmReq: 12, upCostMult: 1.50, ignoreDef: true, combo: 3 }
    ],

    /* ---------- 法宝技能 ---------- */
    fabaoSkills: {
        f_bell_skill:        { name: '金钟护体', cost: 0, cd: 4, desc: '抵挡下一次攻击', shield: 1.0 },
        f_mountain_skill:    { name: '泰山压顶', cost: 30, cd: 3, dmgMult: 2.2, desc: '镇压敌人' },
        f_mirror_skill:      { name: '阴阳反照', cost: 40, cd: 4, reflect: 0.5, desc: '反弹50%伤害', turns: 2 },
        f_pagoda_skill:      { name: '万法镇灭', cost: 80, cd: 5, dmgMult: 4.0, ignoreDef: true, desc: '镇压一切' }
    },

    /* ---------- 灵宠配置 ---------- */
    pets: [
        { id: 'pet_wolf',    name: '玄狼',   icon: '狼', elem: 'metal', atk: 8,  def: 4,  hp: 50,  skill: 'pet_bite',    desc: '玄铁狼，攻击型灵宠', realmReq: 0, price: 2000 },
        { id: 'pet_turtle',  name: '玄龟',   icon: '龟', elem: 'water', atk: 3,  def: 15, hp: 150, skill: 'pet_shield',  desc: '玄水龟，防御型灵宠', realmReq: 1, price: 6000 },
        { id: 'pet_phoenix', name: '火凤',   icon: '凤', elem: 'fire',  atk: 25, def: 10, hp: 200, skill: 'pet_flame',   desc: '烈焰火凤，群攻灵宠', realmReq: 2, price: 20000 },
        { id: 'pet_dragon',  name: '青龙',   icon: '龙', elem: 'wood',  atk: 80, def: 40, hp: 600, skill: 'pet_roar',    desc: '上古青龙，至强灵宠', realmReq: 3, price: 80000 }
    ],
    petSkills: {
        pet_bite:   { name: '撕咬', dmgMult: 0.6, cd: 1 },
        pet_shield: { name: '护主', shield: 0.4, cd: 3 },
        pet_flame:  { name: '烈焰吐息', dmgMult: 0.9, cd: 2 },
        pet_roar:   { name: '龙吟', dmgMult: 1.5, debuff: { type: 'def', value: 0.3, turns: 2 }, cd: 3 }
    },

    /* ---------- 敌人配置 ---------- */
    enemies: [
        { id: 'e_wolf',     name: '山野妖狼',   icon: '狼', elem: 'metal', realmIdx: 0, realmLayer: 1, hp: 48,   atk: 6,    def: 2,   spd: 12,  ling: 5,   xiuReward: 60,    stoneReward: 30,   drops: [{ id: 'm_beast', rate: 0.35, count: 1 }, { id: 'p_hp_pill', rate: 0.15, count: 1 }] },
        { id: 'e_bat',      name: '吸血妖蝠',   icon: '蝠', elem: 'water', realmIdx: 0, realmLayer: 3, hp: 80,   atk: 10,   def: 4,   spd: 16,  ling: 8,   xiuReward: 120,    stoneReward: 50,   drops: [{ id: 'm_beast', rate: 0.45, count: 1 }, { id: 'p_qi_pill', rate: 0.2, count: 1 }] },
        { id: 'e_snake',    name: '青鳞蛇妖',   icon: '蛇', elem: 'wood',  realmIdx: 0, realmLayer: 5, hp: 128,  atk: 14,   def: 6,   spd: 14,  ling: 12,  xiuReward: 220,   stoneReward: 90,   drops: [{ id: 'm_herb', rate: 0.55, count: 2 }, { id: 'm_beast', rate: 0.35, count: 1 }] },
        { id: 'e_bear',     name: '玄铁熊',     icon: '熊', elem: 'earth', realmIdx: 0, realmLayer: 7, hp: 224,  atk: 20,   def: 14,  spd: 8,   ling: 18,  xiuReward: 400,   stoneReward: 160,   drops: [{ id: 'm_ore', rate: 0.55, count: 2 }, { id: 'a_silk_robe', rate: 0.1, count: 1 }] },
        { id: 'e_evil_dao', name: '邪修散人',   icon: '邪', elem: 'fire',  realmIdx: 1, realmLayer: 1, hp: 360,  atk: 32,   def: 18,  spd: 18,  ling: 30,  xiuReward: 1000,   stoneReward: 360,  drops: [{ id: 'w_flame_blade', rate: 0.13, count: 1 }, { id: 'p_xiu_pill', rate: 0.25, count: 1 }] },
        { id: 'e_tiger',    name: '赤焰虎王',   icon: '虎', elem: 'fire',  realmIdx: 1, realmLayer: 4, hp: 640,  atk: 52,   def: 30,  spd: 22,  ling: 50,  xiuReward: 2400,  stoneReward: 760,  drops: [{ id: 'm_beast', rate: 0.65, count: 3 }, { id: 'w_thunder_sword', rate: 0.1, count: 1 }] },
        { id: 'e_demon',    name: '魔修宗师',   icon: '魔', elem: 'water', realmIdx: 2, realmLayer: 1, hp: 1760, atk: 112,  def: 72,  spd: 28,  ling: 120, xiuReward: 10000,  stoneReward: 2400, drops: [{ id: 'w_zither', rate: 0.15, count: 1 }, { id: 'p_permanent_hp', rate: 0.2, count: 1 }] },
        { id: 'e_dragon_jc',name: '蛟龙',       icon: '蛟', elem: 'water', realmIdx: 2, realmLayer: 5, hp: 4000, atk: 192,  def: 128, spd: 30,  ling: 200, xiuReward: 28000, stoneReward: 6400, drops: [{ id: 'f_mountain', rate: 0.13, count: 1 }, { id: 'm_pearl', rate: 0.45, count: 2 }] },
        { id: 'e_nether',   name: '幽冥鬼王',   icon: '鬼', elem: 'earth', realmIdx: 3, realmLayer: 1, hp: 14400,atk: 480,  def: 304, spd: 35,  ling: 500, xiuReward: 120000, stoneReward: 30000,drops: [{ id: 'f_mirror', rate: 0.15, count: 1 }, { id: 'p_permanent_atk', rate: 0.2, count: 1 }] },
        { id: 'e_devil',    name: '天魔',       icon: '魔', elem: 'fire',  realmIdx: 3, realmLayer: 5, hp: 40000,atk: 1200, def: 720, spd: 45,  ling: 1000,xiuReward: 400000,stoneReward: 90000,drops: [{ id: 'f_pagoda', rate: 0.13, count: 1 }, { id: 'm_chaos', rate: 0.35, count: 1 }] },
        { id: 'e_immortal', name: '渡劫真仙',   icon: '仙', elem: 'metal', realmIdx: 4, realmLayer: 1, hp: 160000,atk:4400, def:2800,spd: 60,  ling: 3000, xiuReward: 1600000,stoneReward: 360000, drops: [{ id: 'w_chaos_sword', rate: 0.15, count: 1 }, { id: 'p_immortal', rate: 0.2, count: 1 }] },
        // 扩展：炼虚至道祖
        { id: 'e_lianxu',   name: '炼虚魔君',   icon: '虚', elem: 'fire',  realmIdx: 5, realmLayer: 1, hp: 15000, atk: 1200, def: 600, spd: 28,  ling: 4000, xiuReward: 4000000,  stoneReward: 1000000,  drops: [{ id: 'm_chaos', rate: 0.35, count: 1 }, { id: 'p_permanent_atk', rate: 0.2, count: 1 }] },
        { id: 'e_heti',     name: '合体妖尊',   icon: '合', elem: 'wood',  realmIdx: 6, realmLayer: 1, hp: 35000, atk: 2800, def: 1400, spd: 30,  ling: 8000, xiuReward: 10000000,  stoneReward: 2400000, drops: [{ id: 'm_spirit_wood', rate: 0.45, count: 2 }, { id: 'p_permanent_hp', rate: 0.2, count: 1 }] },
        { id: 'e_dacheng',  name: '大乘罗汉',   icon: '乘', elem: 'earth', realmIdx: 7, realmLayer: 1, hp: 80000, atk: 6500, def: 3200, spd: 32,  ling: 16000,xiuReward: 24000000, stoneReward: 6000000, drops: [{ id: 'm_geng_gold', rate: 0.45, count: 2 }, { id: 'p_permanent_atk', rate: 0.2, count: 1 }] },
        { id: 'e_zhenxian', name: '真仙使者',   icon: '真', elem: 'water', realmIdx: 8, realmLayer: 1, hp: 180000,atk:15000, def:7500, spd: 34,  ling: 32000,xiuReward: 60000000, stoneReward: 16000000, drops: [{ id: 'm_qi_essence', rate: 0.45, count: 2 }, { id: 'p_immortal', rate: 0.2, count: 1 }] },
        { id: 'e_jinxian',  name: '金仙老祖',   icon: '金', elem: 'metal', realmIdx: 9, realmLayer: 1, hp: 400000,atk:35000, def:17500,spd: 36,  ling: 64000,xiuReward: 160000000, stoneReward: 40000000,drops: [{ id: 'f_pagoda', rate: 0.13, count: 1 }, { id: 'p_grand_hp', rate: 0.25, count: 1 }] },
        { id: 'e_taiyi',    name: '太乙天尊',   icon: '乙', elem: 'fire',  realmIdx: 10,realmLayer: 1, hp: 900000,atk:80000, def:40000,spd: 38,  ling: 128000,xiuReward: 400000000,stoneReward: 100000000,drops: [{ id: 'f_void_banner', rate: 0.13, count: 1 }, { id: 'p_grand_ling', rate: 0.25, count: 1 }] },
        { id: 'e_daluo',    name: '大罗金仙',   icon: '罗', elem: 'water', realmIdx: 11,realmLayer: 1, hp: 2000000,atk:180000, def:90000,spd: 40,  ling: 256000,xiuReward: 1000000000,stoneReward: 240000000,drops: [{ id: 'w_chaos_sword', rate: 0.15, count: 1 }, { id: 'p_ningshen', rate: 0.25, count: 1 }] },
        { id: 'e_daozu',    name: '道祖化身',   icon: '祖', elem: 'earth', realmIdx: 12,realmLayer: 1, hp: 5000000,atk:400000, def:200000,spd: 42,  ling: 512000,xiuReward: 2400000000,stoneReward: 600000000,drops: [{ id: 'w_pangu_axe', rate: 0.13, count: 1 }, { id: 'p_ningshen', rate: 0.25, count: 1 }] }
    ],

    /* ---------- 地图场景 ---------- */
    scenes: [
        { id: 'sc_sect',     name: '本门宗',   icon: '宗', desc: '修行之所，可修炼、接任务',         realmReq: 0,  color: 'rgba(125,211,192,0.15)',  events: ['meditate', 'master_guidance', 'sect_task'] },
        { id: 'sc_market',   name: '青云坊市', icon: '市', desc: '修士云集，交易宝物',               realmReq: 0,  color: 'rgba(212,175,55,0.15)',   events: ['find_stall', 'auction', 'beggar'] },
        { id: 'sc_forest',   name: '万妖林',   icon: '林', desc: '妖兽横行，历练宝地',               realmReq: 0,  color: 'rgba(109,190,109,0.15)',  events: ['beast_attack', 'find_herb', 'lost_disciple'] },
        { id: 'sc_mine',     name: '灵矿洞',   icon: '矿', desc: '灵矿丰富，藏有奇珍',               realmReq: 1,  color: 'rgba(196,149,90,0.15)',   events: ['mine_ore', 'miner_conflict', 'cave_in'] },
        { id: 'sc_secret1',  name: '上古秘境', icon: '境', desc: '上古大能遗留，机缘无数',           realmReq: 2,  color: 'rgba(168,85,247,0.15)',   events: ['find_treasure', 'ancient_beast', 'inheritance'] },
        { id: 'sc_deep_sea', name: '东海龙宫', icon: '海', desc: '龙族居所，宝物云集',               realmReq: 3,  color: 'rgba(93,173,226,0.15)',   events: ['dragon_test', 'sea_treasure', 'dragon_pet'] },
        { id: 'sc_chaos',    name: '混沌秘境', icon: '虚', desc: '混沌之力充斥，至强机缘所在',       realmReq: 4,  color: 'rgba(244,63,94,0.15)',    events: ['chaos_inherit', 'chaos_beast', 'immortal_test'] },
        // —— 大成期(大乘)以上方能踏足的仙界绝境，产出最顶级的仙缘与重宝 ——
        { id: 'sc_taiqing',  name: '九重天',   icon: '霄', desc: '大乘以上方可飞升的仙界绝境，云海深处藏着太清传承与诸天重宝', realmReq: 7, color: 'rgba(250,204,21,0.18)', events: ['immortal_test', 'chaos_inherit', 'find_treasure', 'ancient_beast'] },
        { id: 'sc_zzxianjie', name: '诸天战场', icon: '战', desc: '诸天陨落之古战场，煞气滔天，唯真仙以上可入，夺将臣残魂与战兵', realmReq: 8, color: 'rgba(239,68,68,0.18)', events: ['ancient_beast', 'chaos_beast', 'find_treasure', 'inheritance'] }
    ],

    /* ---------- 随机事件 ---------- */
    events: {
        meditate:        { title: '静修悟道', icon: '禅', desc: '在此静坐片刻，似有所悟', choices: [{ text: '静心感悟', type: 'xiu', value: 50 }] },
        master_guidance: { title: '师尊指点', icon: '师', desc: '宗门长老路过，见你根基不错，传你一道', choices: [{ text: '拜谢请教', type: 'xiu', value: 200 }, { text: '求取功法', type: 'gongfa', value: 'g_five_elem' }] },
        sect_task:       { title: '宗门任务', icon: '卷', desc: '掌门召你前去，有一桩差事', choices: [{ text: '领命前往', type: 'quest' }] },
        find_stall:      { title: '偶遇摊位', icon: '摊', desc: '路边一老叟摆摊，似有奇货', choices: [{ text: '上前查看', type: 'shop_random' }, { text: '离开', type: 'nothing' }] },
        auction:         { title: '拍卖盛会', icon: '锤', desc: '坊市举办拍卖会，有稀有宝物', choices: [{ text: '参与竞拍', type: 'auction' }, { text: '围观', type: 'xiu', value: 20 }] },
        beggar:          { title: '乞丐乞讨', icon: '乞', desc: '一蓬头乞丐拦住去路，声称是有缘人', choices: [{ text: '施舍100灵石', type: 'beggar_pay', cost: 100 }, { text: '不予理会', type: 'nothing' }] },
        beast_attack:    { title: '妖兽袭击', icon: '兽', desc: '一头妖兽挡住去路！', choices: [{ text: '迎战', type: 'combat_random' }, { text: '绕道', type: 'nothing' }] },
        find_herb:       { title: '发现灵草', icon: '草', desc: '路边发现一丛灵草', choices: [{ text: '采摘', type: 'item', value: 'm_herb', count: 3 }] },
        lost_disciple:   { title: '迷路弟子', icon: '人', desc: '遇到一位迷路的同门弟子', choices: [{ text: '送他回去', type: 'karma_good' }, { text: '抢他灵石', type: 'karma_bad' }] },
        mine_ore:        { title: '发现矿脉', icon: '矿', desc: '岩壁上有灵矿显现', choices: [{ text: '开采', type: 'item', value: 'm_ore', count: 2 }] },
        miner_conflict:  { title: '矿工冲突', icon: '斗', desc: '有散修抢占你的矿位', choices: [{ text: '斗法', type: 'combat_random' }, { text: '让出', type: 'nothing' }] },
        cave_in:         { title: '矿洞坍塌', icon: '危', desc: '矿洞突然坍塌！', choices: [{ text: '紧急逃出', type: 'hp_loss', value: 30 }] },
        find_treasure:   { title: '宝箱奇遇', icon: '箱', desc: '秘境深处发现一个古朴宝箱', choices: [{ text: '开启', type: 'treasure' }, { text: '谨慎检查', type: 'treasure_safe' }] },
        ancient_beast:   { title: '上古凶兽', icon: '兽', desc: '一头上古凶兽苏醒！', choices: [{ text: '大战', type: 'combat_hard' }, { text: '逃遁', type: 'nothing' }] },
        inheritance:     { title: '道统传承', icon: '承', desc: '前方石台上有上古修士留下的传承', choices: [{ text: '参悟', type: 'xiu', value: 5000 }, { text: '尝试领悟功法', type: 'gongfa_random' }] },
        dragon_test:     { title: '龙族考验', icon: '龙', desc: '龙王现身，要考校你的修为', choices: [{ text: '应战', type: 'combat_hard' }, { text: '献上宝物', type: 'dragon_tribute' }] },
        sea_treasure:    { title: '海底宝库', icon: '宝', desc: '海底深处隐约有光芒', choices: [{ text: '潜入探寻', type: 'treasure_deep' }] },
        dragon_pet:      { title: '幼龙求收', icon: '龙', desc: '一条幼龙似乎认主于你', choices: [{ text: '收为灵宠', type: 'pet', value: 'pet_dragon' }, { text: '放归大海', type: 'karma_good' }] },
        chaos_inherit:   { title: '混沌传承', icon: '虚', desc: '混沌之力向你涌来', choices: [{ text: '强行吸纳', type: 'xiu', value: 100000 }, { text: '领悟混沌功法', type: 'gongfa_random' }] },
        chaos_beast:     { title: '混沌凶兽', icon: '虚', desc: '混沌中窜出一头凶兽！', choices: [{ text: '大战', type: 'combat_hard' }, { text: '遁走', type: 'nothing' }] },
        immortal_test:   { title: '仙人指路', icon: '仙', desc: '一位仙人现身，问你可愿接受考验', choices: [{ text: '接受考验', type: 'combat_hard' }, { text: '请教大道', type: 'xiu', value: 500000 }] }
    },

    /* ---------- 商店商品 ---------- */
    shopItems: {
        equipment: ['w_short_sword', 'a_cloth_robe', 'ac_jade_pendant', 'w_flame_blade', 'a_silk_robe', 'ac_fire_ring', 'w_zither', 'a_spirit_armor', 'ac_spirit_band', 'w_thunder_sword', 'a_starlight', 'ac_star_pendant', 'w_azure_spear', 'w_sun_moon', 'w_pangu_axe', 'a_bronze_mirror', 'a_azure_robe', 'a_celestial', 'ac_wind_charm', 'ac_dragon_jade', 'ac_void_orb'],
        pill: ['p_qi_pill', 'p_hp_pill', 'p_xiu_pill', 'p_atk_pill', 'p_def_pill', 'p_breakthrough', 'p_permanent_hp', 'p_permanent_atk', 'p_grand_hp', 'p_grand_ling', 'p_ningshen'],
        material: [], // 坊市不再设「材料」分类；灵兽粮/化形丹由灵宠面板购买，轮回草由转世面板购买，基础材料仅供炼制/掉落
        gongfa: ['g_five_elem', 'g_purple', 'g_chaos', 'g_immortal', 'g_void'],
        fabao: ['f_bell', 'f_mountain', 'f_mirror', 'f_pagoda', 'f_jade_ruyi', 'f_void_banner'],
        pet: ['pet_wolf', 'pet_turtle', 'pet_phoenix', 'pet_dragon']
    },

    /* ---------- 任务配置 ---------- */
    quests: [
        { id: 'q_first_cultivate', name: '初识修炼',   desc: '修炼累积100修为',     target: 100,    type: 'xiu_total',     reward: { stone: 50, xiu: 50 } },
        { id: 'q_first_combat',    name: '初战告捷',   desc: '战胜1个敌人',         target: 1,      type: 'combat_win',    reward: { stone: 80, items: [{ id: 'p_hp_pill', count: 3 }] } },
        { id: 'q_lianqi_break',    name: '突破练气',   desc: '突破至练气三层',       target: 3,      type: 'realm_layer',   reward: { stone: 200, items: [{ id: 'p_xiu_pill', count: 2 }] } },
        { id: 'q_zhuji',           name: '筑基大道',   desc: '突破至筑基境界',       target: 2,      type: 'realm_idx',     reward: { stone: 1000, items: [{ id: 'p_breakthrough', count: 1 }] } },
        { id: 'q_explore_10',      name: '历练初探',   desc: '完成10次探索',        target: 10,     type: 'explore_count', reward: { stone: 300, xiu: 500 } },
        { id: 'q_kill_20',         name: '斩妖除魔',   desc: '战胜20个敌人',        target: 20,     type: 'combat_win',    reward: { stone: 500, items: [{ id: 'ac_fire_ring', count: 1 }] } },
        { id: 'q_jindan',          name: '结丹大道',   desc: '突破至金丹境界',       target: 3,      type: 'realm_idx',     reward: { stone: 8000, items: [{ id: 'p_permanent_hp', count: 1 }] } },
        { id: 'q_kill_50',         name: '威震四方',   desc: '战胜50个敌人',        target: 50,     type: 'combat_win',    reward: { stone: 3000, items: [{ id: 'w_thunder_sword', count: 1 }] } },
        { id: 'q_yuanying',        name: '元婴大道',   desc: '突破至元婴境界',       target: 4,      type: 'realm_idx',     reward: { stone: 50000, items: [{ id: 'p_permanent_atk', count: 1 }] } },
        { id: 'q_huashen',         name: '化神飞升',   desc: '突破至化神境界',       target: 5,      type: 'realm_idx',     reward: { stone: 500000, items: [{ id: 'p_immortal', count: 1 }] } }
    ],

    /* ---------- 转世轮回 ---------- */
    rebirth: {
        herbId: 'm_rebirth_herb',   // 轮回草
        herbCost: 100,               // 轮回草轮回需耗 100 株
        maxRebirth: 100,             // 轮回上限 100 世
        // 免费轮回门槛：今生可先达的最高大境界，随轮回次数递增（第0世筑基、第1世金丹……）
        baseRealm: 1,               // 第 0 世：需达 筑基
        realmPerRebirth: 1,          // 每轮回一世，门槛 +1 大境界
        // 轮回加成：仅保留 生命(气血) 与 攻击（更聚焦、更纯粹）
        perLevel: { atk: 0.30, hp: 0.30 },
        // 每轮回一世，修炼收益永久 +100%（与气血/攻击加成叠加，构成轮回核心收益）
        xiuBonusPerRebirth: 1.0
    },

    /* ---------- 默认初始玩家 ---------- */
    defaultPlayer: {
        name: '无名修士',
        avatar: 0,
        element: 'metal',
        realmIdx: 0,
        realmLayer: 1,
        xiu: 0,
        stone: 500,
        // 基础属性（不含装备境界加成）
        baseAtk: 10,
        baseDef: 5,
        baseHp: 100,
        baseLing: 50,
        baseSpd: 10,
        baseCrit: 0.05,
        // 永久加成（丹药等）
        permBonus: { atk: 0, def: 0, hp: 0, ling: 0 },
        // 悟性等级（顿悟提升，影响每次点击修为与修炼速率）
        wuxingLevel: 0,
        // 装备栏
        equipped: { weapon: null, armor: null, accessory: null, fabao: null },
        // 背包：{ id: count } 或装备实例 { uid, baseId, enhance }
        inventory: { equipment: [], pill: {}, material: {}, gongfa: [], fabao: [] },
        // 已学技能 { id: level }
        skills: { s_basic_strike: 1 },
        // 当前所修功法id
        gongfa: 'g_basic',
        // 灵宠（player.pet = 出战灵宠id；pets = 已收服列表）
        pet: null,
        pets: [],
        // 天赋（pts = 可分配点数；learned = { 天赋id: 等级 }）
        talents: { pts: 0, learned: {} },
        // 任务进度 { id: { progress, claimed } }
        quests: {},
        // 统计
        stats: { combatWins: 0, exploreCount: 0, totalXiu: 0, breakthroughs: 0, tutorialDone: false },
        // 渡劫天劫永久加成（劫后余韵）
        tribulus: { xiuMult: 0, stoneMult: 0 },
        // 转世轮回层数（每突破一次大境界后可轮回，层数越高根基越厚）
        rebirth: 0,
        // 寿元（闭关上限）：每闭关一年折损一年，境界突破可增寿
        lifespan: 100,
        // 时间戳
        lastSave: 0,
        lastOffline: 0,
        // 设置
        settings: { autoSave: true, anim: true, sound: false }
    },

    /* ---------- 名字池（随机生成） ---------- */
    namePool: ['云', '风', '雷', '雨', '雪', '霜', '月', '星', '辰', '海', '山', '林', '泉', '烟', '霞', '岚', '霓', '霄', '澄', '澈', '玄', '青', '紫', '白', '赤', '金', '玉', '灵', '真', '道'],
    nameSuffix: ['子', '真人', '道人', '散人', '仙子', '尊者', '居士', '禅师', '上人', '客'],
    namePrefix: ['清', '玄', '紫', '青', '白', '赤', '金', '玉', '灵', '太上', '无极', '混元', '太虚', '紫虚', '玉清'],

    /* ---------- 离线收益配置 ---------- */
    offlineRatio: 0.5,        // 离线修炼效率比例
    offlineMaxHours: 12,      // 最大累积12小时

    /* ---------- 自动存档间隔（毫秒） ---------- */
    autoSaveInterval: 30000
};

// 五行克制伤害倍率
function getElementMultiplier(attackerElem, defenderElem) {
    if (!attackerElem || !defenderElem) return 1.0;
    const a = GameConfig.elements[attackerElem];
    if (!a) return 1.0;
    if (a.counter === defenderElem) return 1.5;   // 克制 +50%
    const d = GameConfig.elements[defenderElem];
    if (d && d.counter === attackerElem) return 0.7; // 被克 -30%
    return 1.0;
}

// 根据id获取配置项的工具函数
function getEquipTemplate(id) { return GameConfig.equipmentTemplates.find(e => e.id === id); }
function getPill(id) { return GameConfig.pills.find(p => p.id === id); }
function getMaterial(id) { return GameConfig.materials.find(m => m.id === id); }
function getGongfa(id) { return GameConfig.gongfas.find(g => g.id === id); }
function getSkill(id) { return GameConfig.skills.find(s => s.id === id); }
function getEnemy(id) { return GameConfig.enemies.find(e => e.id === id); }
function getScene(id) { return GameConfig.scenes.find(s => s.id === id); }
function getPet(id) { return GameConfig.pets.find(p => p.id === id); }
function getQuality(idx) { return GameConfig.qualities[idx]; }
function getRealm(idx) { return GameConfig.realms[idx]; }

// 生成唯一UID
function genUid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// 随机名字生成
function randomName() {
    const p = GameConfig.namePrefix, s = GameConfig.namePool, x = GameConfig.nameSuffix;
    const r = Math.random;
    if (r() < 0.5) return p[Math.floor(r() * p.length)] + s[Math.floor(r() * s.length)];
    return s[Math.floor(r() * s.length)] + s[Math.floor(r() * s.length)] + (r() < 0.4 ? x[Math.floor(r() * x.length)] : '');
}

// 数字格式化
function fmtNum(n) {
    if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿';
    if (n >= 1e4) return (n / 1e4).toFixed(2) + '万';
    if (n >= 1000) return (n / 1000).toFixed(1) + '千';
    return Math.floor(n).toString();
}

// ===== 自动生成「炼器」配方：非法宝装备可按 材料+灵石 锻造 =====
// 材料与灵石成本按品质分级，确保与既有丹药炼制体系一致
(function initForgeRecipes() {
    if (!GameConfig.equipmentTemplates) return;
    GameConfig.equipmentTemplates.forEach(eq => {
        if (eq.type === 'fabao' || eq.craft) return; // 法宝为天材地宝，不可锻造
        const q = eq.quality || 0;
        const materials = {};
        if (eq.type === 'weapon')       materials.m_ore = 3 + q * 3;
        else if (eq.type === 'armor')   { materials.m_ore = 2 + q * 3; materials.m_herb = 2 + q * 2; }
        else if (eq.type === 'accessory'){ materials.m_herb = 2 + q * 2; materials.m_ore = 1 + q * 2; }
        if (q >= 2) materials.m_spirit_wood = 2 + q;
        if (q >= 3) { materials.m_geng_gold = 2 + q; materials.m_pearl = 1; }
        if (q >= 4) { materials.m_chaos = 1 + (q - 3); materials.m_qi_essence = 1; }
        eq.craft = { materials, cost: Math.round(eq.price * 0.35) };
    });
})();
