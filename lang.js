/* ============================================
   仙途·轮回诀 — 多语言（中文 / English 切换）
   设计原则：
   - 所有 UI 文案与【数据译名】集中在本文件，游戏逻辑文件（config/ui/main/...）不改动数据。
   - 数据译名按「中文原串」查表（I18N.DATA），故无需改动 config.js 等数据文件，零回归风险。
   - 切换语言后派发 'langchange' 事件 + 调用 UI.refreshAll()（若存在）重渲染当前面板。
   ============================================ */
const I18N = {
    /* UI 文案：T(key, fallback) 查表；英文缺失时回退 fallback（默认即中文原串） */
    en: {
        // —— 设置面板 ——
        'settings': 'Settings',
        'autoSave': 'Auto Save',
        'anim': 'Battle Animation',
        'sound': 'Sound Effects',
        'manualSave': 'Save Now',
        'slotSelect': 'Ascend · Switch Save',
        'reset': 'Reset Game',
        'close': 'Close',
        'language': 'Language',
        // —— 顶部资源栏 tooltips ——
        'res.zhanli': 'Power',
        'res.stone': 'Spirit Stones',
        'res.ling': 'Spirit Energy',
        'res.life': 'Lifespan (Seclusion cap)',
        // —— 侧边导航 ——
        'panel.cultivate': 'Cultivation',
        'panel.combat': 'Combat',
        'panel.explore': 'Exploration',
        'panel.inventory': 'Inventory',
        'panel.skill': 'Divine Arts',
        'panel.shop': 'Market',
        'panel.quest': 'Quests',
        'panel.mainstory': 'Story',
        'panel.friends': 'Companions',
        'panel.reincarnate': 'Reincarnation',
        'panel.xianlu': 'Immortal Path',
        'panel.realm': 'Realms',
        // —— 修炼区 ——
        'breakthrough': 'Breakthrough',
        'seclude': 'Seclude',
        'enlighten': 'Enlighten',
        'layer': 'Layer',
        'duanLabel': 'Layer',
        // —— 境界图鉴表头 ——
        'realmHeader': 'Realm',
        'baseHeader': 'Base Power',
        'costHeader': 'Full-Layer Breakthrough Cost',
        'needRealmReq': 'Requires {x} Realm',
        'notReached': 'Not Reached',
        'unlockAfter': 'Unlock after reaching {x} Realm.',
        'currentRealm': 'Current Realm:',
        'chaptersUnlocked': 'chapters unlocked',
        'prologue': 'Prologue',
        'final': 'Final',
        'reqRealmMax': 'Required Realm (Max Layer)',
        'capHeader': 'Power Cap',
        // —— 通用 toast ——
        'toast.noLing': 'Insufficient Spirit Energy',
        'toast.noRealm': 'Realm too low to challenge this enemy',
        'toast.skillCd': 'Skill on cooldown',
        'toast.treasureCd': 'Treasure on cooldown',
        'toast.saved': 'Saved',
        'toast.reset': 'Game reset'
    },

    /* 数据译名：按中文原串查表（境界 103 + 五行 5 + 品质 5） */
    DATA: {
        // ===== 103 大境界 =====
        '练气': 'Qi Refining', '筑基': 'Foundation', '金丹': 'Golden Core', '元婴': 'Nascent Soul',
        '化神': 'Spirit Transformation', '炼虚': 'Void Refinement', '合体': 'Integration', '大乘': 'Mahayana',
        '真仙': 'True Immortal', '金仙': 'Golden Immortal', '太乙': 'Taiyi', '大罗': 'Daluo',
        '道祖': 'Dao Ancestor', '道君': 'Dao Sovereign', '道尊': 'Dao Venerable', '道圣': 'Dao Sage',
        '混元': 'Primordial Unity', '太上': 'Supreme', '无量': 'Boundless', '鸿钧': 'Hongjun',
        '天道': 'Heavenly Dao', '天尊': 'Heavenly Venerable', '圣人': 'Sage', '太初': 'Primordial Beginning',
        '太易': 'Primordial Ease', '太极': 'Supreme Polarity', '先天': 'Innate', '混沌': 'Chaos',
        '鸿蒙': 'Hongmeng', '无极': 'Wuji', '永恒': 'Eternal', '虚无': 'Voidness',
        '大道': 'Great Dao', '玄元': 'Mysterious Origin', '太虚': 'Great Void', '太昊': 'Taihao',
        '太清': 'Taiqing', '玉清': 'Yuqing', '上清': 'Shangqing', '紫府': 'Purple Mansion',
        '灵霄': 'Spirit Firmament', '九霄': 'Nine Firmaments', '神霄': 'Divine Firmament', '太微': 'Taiwei',
        '太玄': 'Taixuan', '元始': 'Yuanshi', '虚空': 'Emptiness', '太素': 'Taisu',
        '太始': 'Taishi', '无上': 'Unfathomable', '无涯': 'Endless', '无相': 'Formless',
        '无垢': 'Stainless', '圆明': 'Perfect Radiance', '圆觉': 'Perfect Enlightenment', '真如': 'Suchness',
        '自在': 'Freedom', '逍遥': 'Wandering Free', '大觉': 'Great Awakening', '大衍': 'Dayan',
        '渺渺': 'Misty', '冥冥': 'Obscure', '浩渺': 'Vast', '苍穹': 'Firmament',
        '寰宇': 'Cosmos', '乾坤': 'Qiankun', '玄黄': 'Xuanhuang', '寂灭': 'Cessation',
        '涅槃': 'Nirvana', '归真': 'Return to Truth', '返璞': 'Return to Simplicity', '合一': 'Unity',
        '同尘': 'One with Dust', '玄同': 'Mysterious Unity', '守一': 'Guard the One', '抱朴': 'Embrace Simplicity',
        '至善': 'Supreme Good', '至诚': 'Ultimate Sincerity', '至道': 'Ultimate Dao', '究竟': 'Ultimate',
        '无碍': 'Unobstructed', '无为': 'Non-Action', '太一': 'The One', '太苍': 'Taicang',
        '太渊': 'Taiyuan', '太真': 'Taizhen', '太元': 'Taiyuan Prime', '太明': 'Taiming',
        '太光': 'Taiguang', '太宁': 'Taining', '太安': 'Taian', '太恒': 'Taiheng',
        '太润': 'Tairun', '太白': 'Taibai', '太阿': 'Tai\'e', '太皇': 'Taihuang',
        '太衍': 'Taiyan', '太昭': 'Taizhao', '太曦': 'Taixi', '太华': 'Taihua',
        '太岳': 'Taiyue', '太溟': 'Tai Ming (Sea)', '太寥': 'Tailiao',
        // ===== 五行 =====
        '金': 'Metal', '木': 'Wood', '水': 'Water', '火': 'Fire', '土': 'Earth',
        // ===== 品质 =====
        '凡品': 'Mortal', '灵品': 'Spiritual', '宝品': 'Treasure', '仙品': 'Immortal', '神品': 'Divine'
    }
};

/* 当前语言：zh / en（优先 localStorage，其次存档 settings.lang） */
let CUR_LANG = (typeof localStorage !== 'undefined' && localStorage.getItem('xiantu_lang')) || 'zh';

function getLang() { return CUR_LANG; }

/* UI 文案查表 */
function T(key, fallback) {
    if (CUR_LANG === 'en') {
        const v = I18N.en[key];
        if (v !== undefined) return v;
    }
    return (fallback !== undefined) ? fallback : key;
}

/* 数据名：传对象（含 .name）或纯字符串 */
function DN(obj) {
    let s = (obj && typeof obj === 'object') ? obj.name : obj;
    if (s == null) return '';
    if (CUR_LANG === 'en') { const v = I18N.DATA[s]; if (v !== undefined) return v; }
    return s;
}

/* 数据描述 */
function DD(obj) {
    let s = (obj && typeof obj === 'object') ? obj.desc : obj;
    if (s == null) return '';
    if (CUR_LANG === 'en') { const v = I18N.DATA_DESC && I18N.DATA_DESC[s]; if (v !== undefined) return v; }
    return s;
}

/* 仅按中文字串查译（用于已存为字符串的字段，如 ch.realmName / f.realmName） */
function TS(str) {
    if (!str) return str;
    if (CUR_LANG === 'en') { const v = I18N.DATA[str]; if (v !== undefined) return v; }
    return str;
}

/* 境界全名（含层位），随语言切换：中文「练气一层」/ 英文「Qi Refining Lv1」 */
function realmLabel(p) {
    if (!p) return '';
    const r = (typeof getRealm === 'function') ? getRealm(p.realmIdx) : null;
    if (!r) return '';
    const nm = DN(r);
    if (CUR_LANG === 'en') return nm + ' Lv' + p.realmLayer;
    const cn = (typeof cnNum === 'function') ? cnNum(p.realmLayer) : ('' + p.realmLayer);
    return nm + cn + '层';
}

/* 切换语言：写持久化 → 重渲染 UI */
function setLang(code) {
    if (code !== 'zh' && code !== 'en') code = 'zh';
    CUR_LANG = code;
    if (typeof localStorage !== 'undefined') { try { localStorage.setItem('xiantu_lang', code); } catch (e) {} }
    // 同步进存档
    try {
        if (typeof Game !== 'undefined' && Game.player && Game.player.settings) {
            Game.player.settings.lang = code;
            if (typeof Game.save === 'function') Game.save();
        }
    } catch (e) {}
    applyI18N();
    if (typeof UI !== 'undefined' && typeof UI.refreshAll === 'function') { try { UI.refreshAll(); } catch (e) {} }
    if (typeof document !== 'undefined') { try { document.dispatchEvent(new Event('langchange')); } catch (e) {} }
}

/* 把 [data-i18n]（textContent）/ [data-i18n-title]（title）/ [data-i18n-ph]（placeholder）
   按当前语言填充；首次运行缓存中文原值，切回中文时还原。 */
function applyI18N() {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        if (el.dataset.i18nZh === undefined) el.dataset.i18nZh = el.textContent;
        const key = el.dataset.i18n;
        el.textContent = (CUR_LANG === 'en') ? T(key, el.dataset.i18nZh) : el.dataset.i18nZh;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        if (el.dataset.i18nTitleZh === undefined) el.dataset.i18nTitleZh = (el.getAttribute('title') || '');
        const key = el.dataset.i18nTitle;
        el.setAttribute('title', (CUR_LANG === 'en') ? T(key, el.dataset.i18nTitleZh) : el.dataset.i18nTitleZh);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        if (el.dataset.i18nPhZh === undefined) el.dataset.i18nPhZh = (el.getAttribute('placeholder') || '');
        const key = el.dataset.i18nPh;
        el.setAttribute('placeholder', (CUR_LANG === 'en') ? T(key, el.dataset.i18nPhZh) : el.dataset.i18nPhZh);
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { I18N, getLang, setLang, T, DN, DD, TS, realmLabel, applyI18N };
}
