/* ============================================
   仙途·轮回诀 — 存档系统
   localStorage 持久化 · 自动存档 · 离线收益 · 导入导出
   ============================================ */

const SAVE_KEY = 'xiuxian_save_v1';              // 旧版单槽键（兼容迁移）
const SAVE_INDEX_KEY = 'xiuxian_slot_index_v1';    // 多槽索引键
const SLOT_COUNT = 4;                             // 存档槽数量
const slotKey = (id) => 'xiuxian_slot_v1_' + id;
const SAVE_CODE_MAGIC = 'XIUXIAN';              // 新存档码根标识：XIUXIAN:v1:P:... / XIUXIAN:v1:E:...
const SAVE_CODE_LEGACY_PREFIX = 'XIUXIAN1:';  // ff56566 导出的旧格式（视为明文 v1，兼容导入）
// 存档码格式版本：取自 GameConfig.saveVersion；跨大版本变更时旧码导入会被拒绝（需重新导出）
function _saveCodeVersion() {
    return (typeof GameConfig !== 'undefined' && GameConfig.saveVersion) ? GameConfig.saveVersion : 'v1';
}

const SaveSystem = {
    game: null,  // 当前游戏状态引用
    _mem: {},  // 内存兜底（localStorage 不可用时的最后防线）
    _lastMode: null,  // 上次写入使用的存储通道
    _lastError: null,  // 上次写入错误信息
    lastSaveStatus: { ok: false, mode: null, error: null },  // 供 UI 读取的最终状态

    /* ---------- 存储可用性检测与降级 ---------- */
    // 探测当前环境允许的存储通道：'local' > 'session' > 'none'
    storageMode() {
        try {
            const k = '__xiu_probe__';
            localStorage.setItem(k, '1'); localStorage.removeItem(k);
            return 'local';
        } catch (e) {
            try {
                const k = '__xiu_probe__';
                sessionStorage.setItem(k, '1'); sessionStorage.removeItem(k);
                return 'session';
            } catch (e2) {
                return 'none';
            }
        }
    },

    // 防循环引用序列化：避免 player 误含引用导致整局静默失败
    _safeStringify(obj) {
        try {
            const seen = new WeakSet();
            return JSON.stringify(obj, (k, v) => {
                if (typeof v === 'function') return undefined;
                if (typeof v === 'object' && v !== null) {
                    if (seen.has(v)) return undefined;
                    seen.add(v);
                }
                return v;
            });
        } catch (e) {
            // 兜底：丢弃函数与循环引用，尽力保留其余数据
            try {
                const seen = new WeakSet();
                return JSON.stringify(obj, (k, v) => {
                    if (typeof v === 'function' || typeof v === 'undefined') return undefined;
                    if (typeof v === 'object' && v !== null) {
                        if (seen.has(v)) return null;
                        seen.add(v);
                    }
                    return v;
                });
            } catch (e2) {
                console.error('序列化彻底失败:', e2);
                return null;
            }
        }
    },

    // 写入：localStorage → sessionStorage → 内存兜底
    _write(key, data) {
        try { localStorage.setItem(key, data); return 'local'; }
        catch (e) {
            try { sessionStorage.setItem(key, data); return 'session'; }
            catch (e2) { this._mem[key] = data; return 'memory'; }
        }
    },

    // 读取：localStorage → sessionStorage → 内存兜底
    _read(key) {
        try { const d = localStorage.getItem(key); if (d) return d; } catch (e) {}
        try { const d = sessionStorage.getItem(key); if (d) return d; } catch (e) {}
        if (this._mem[key] !== undefined) return this._mem[key];
        return null;
    },

    // 删除：所有通道一并清理
    _remove(key) {
        try { localStorage.removeItem(key); } catch (e) {}
        try { sessionStorage.removeItem(key); } catch (e) {}
        delete this._mem[key];
    },

    /* ---------- 创建新存档 ---------- */
    createNew(custom) {
        const player = JSON.parse(JSON.stringify(GameConfig.defaultPlayer));
        if (custom) {
            player.name = custom.name || player.name;
            player.avatar = custom.avatar !== undefined ? custom.avatar : player.avatar;
            player.element = custom.element || player.element;
        }
        // 初始任务进度
        GameConfig.quests.forEach(q => {
            player.quests[q.id] = { progress: 0, claimed: false };
        });
        player.lastSave = Date.now();
        player.lastOffline = Date.now();
        return player;
    },

    /* ---------- 保存到存储（按槽写入 + 更新索引） ---------- */
    save(player, slotId) {
        // 未指定槽位时，默认写入「当前槽」
        if (slotId === undefined || slotId === null) slotId = this._currentSlotId();
        if (!slotId) {
            this.lastSaveStatus = { ok: false, mode: null, error: 'no_slot' };
            console.error('存档失败：未指定存档槽');
            return false;
        }
        try {
            player.lastSave = Date.now();
            // 防溢出：落盘前把战力/累计战力钳制到 ZHANLI_CAP（远低于 Infinity），
            // 既杜绝历史膨胀值写回，又允许 9e15 之上的终局战力持续保留、不被压回。
            if (player.zhanli != null && (player.zhanli > ZHANLI_CAP || !isFinite(player.zhanli))) {
                player.zhanli = ZHANLI_CAP;
            }
            if (player.stats && player.stats.totalZhanli != null && (player.stats.totalZhanli > ZHANLI_CAP || !isFinite(player.stats.totalZhanli))) {
                player.stats.totalZhanli = ZHANLI_CAP;
            }
            const data = this._safeStringify(player);
            // 序列化失败：绝不写 "null" 覆盖旧档（否则下次读档会清零全部进度）
            if (!data) {
                this._lastMode = 'error';
                this._lastError = 'serialization_failed';
                this.lastSaveStatus = { ok: false, mode: null, error: 'serialization_failed' };
                console.error('存档跳过：序列化失败，保留旧档');
                return false;
            }
            const mode = this._write(slotKey(slotId), data);
            this._updateIndex(slotId, player);
            this._lastMode = mode;
            this._lastError = null;
            this.lastSaveStatus = { ok: true, mode: mode, error: null };
            return true;
        } catch (e) {
            this._lastMode = 'error';
            this._lastError = (e && e.message) || String(e);
            this.lastSaveStatus = { ok: false, mode: null, error: this._lastError };
            console.error('存档失败:', e);
            return false;
        }
    },

    /* ---------- 从存储读取（按槽读取） ---------- */
    load(slotId) {
        if (slotId === undefined || slotId === null) slotId = this._currentSlotId();
        if (!slotId) return null;
        try {
            const data = this._read(slotKey(slotId));
            if (!data) return null;
            const player = JSON.parse(data);
            // 数据兼容性补全
            this._setCurrentSlot(slotId);
            return this.migrate(player);
        } catch (e) {
            console.error('读档失败:', e);
            return null;
        }
    },

    /* ---------- 数据迁移与字段补全 ---------- */
    migrate(player) {
        const def = GameConfig.defaultPlayer;
        // 兼容性迁移：旧档用「修为(xiu)」作为成长资源，现统一为「战力(zhanli)」
        if (player.zhanli === undefined && player.xiu !== undefined) {
            player.zhanli = player.xiu;
            delete player.xiu;
        }
        if (player.stats && player.stats.totalZhanli === undefined && player.stats.totalXiu !== undefined) {
            player.stats.totalZhanli = player.stats.totalXiu;
            delete player.stats.totalXiu;
        }
        // 浅合并缺失字段
        for (const k in def) {
            if (player[k] === undefined) {
                player[k] = JSON.parse(JSON.stringify(def[k]));
            }
        }
        // 嵌套对象补全
        if (!player.permBonus) player.permBonus = { atk: 0, def: 0, hp: 0, ling: 0 };
        if (!player.equipped) player.equipped = { weapon: null, armor: null, accessory: null, fabao: null };
        if (!player.inventory) player.inventory = { equipment: [], pill: {}, material: {}, gongfa: [], fabao: [] };
        if (!player.inventory.equipment) player.inventory.equipment = [];
        if (!player.inventory.pill) player.inventory.pill = {};
        if (!player.inventory.material) player.inventory.material = {};
        if (!player.inventory.gongfa) player.inventory.gongfa = [];
        if (!player.inventory.fabao) player.inventory.fabao = [];
        if (!player.skills) player.skills = { s_basic_strike: 1 };
        if (!player.quests) player.quests = {};
        if (!player.stats) player.stats = { combatWins: 0, exploreCount: 0, totalZhanli: 0, breakthroughs: 0 };
        if (!player.settings) player.settings = { autoSave: true, anim: true, sound: true };
        // 音效开关迁移：旧档（无 sfxMigrated 标记）的 sound:false 是默认值残留
        // （此前音效为空开关、无任何实际播放），统一开启；用户此后主动关闭并存档（已带标记）则尊重。
        if (!player.sfxMigrated) {
            if (player.settings.sound === false) player.settings.sound = true;
            player.sfxMigrated = true;
        }
        // 灵宠培养 + 天赋系统 字段补全 / 旧档迁移
        if (!player.pets) player.pets = [];
        if (!player.talents) player.talents = { pts: 0, learned: {} };
        // 旧档：仅有单一 player.pet，迁移进 pets 列表
        if (player.pet && !player.pets.find(x => x.id === player.pet)) {
            player.pets.push({ id: player.pet, lv: 1, exp: 0, aff: 0, evo: 0 });
        }
        // 补全新任务
        GameConfig.quests.forEach(q => {
            if (!player.quests[q.id]) player.quests[q.id] = { progress: 0, claimed: false };
        });
        // 仙途主线字段补全 + 旧档静默补齐已达成章节（不弹窗）
        if (!player.mainStory) player.mainStory = { currentIdx: 0, seen: {}, claimed: {} };
        if (typeof MainStory !== 'undefined') MainStory.checkInitial(player);
        return player;
    },

    /* ---------- 删除存档（所有通道） ---------- */
    reset() {
        try {
            this._remove(SAVE_KEY);
            return true;
        } catch (e) {
            console.error('重置失败:', e);
            return false;
        }
    },

    /* ---------- 计算离线收益 ---------- */
    calcOfflineReward(player) {
        const now = Date.now();
        const last = player.lastSave || now;
        const elapsedSec = Math.min((now - last) / 1000, GameConfig.offlineMaxHours * 3600);
        if (elapsedSec < 60) return { zhanli: 0, time: 0 };

        // 调用 Cultivate 模块计算效率（避免循环依赖，直接计算）
        const rate = this.calcCultivateRate(player);
        const xiu = Math.floor(rate * elapsedSec * GameConfig.offlineRatio);
        return { xiu, time: elapsedSec };
    },

    /* ---------- 计算修炼效率（独立实现，避免循环依赖） ---------- */
    calcCultivateRate(player) {
        const realm = getRealm(player.realmIdx);
        let base = 1.0; // 基础每秒1战力
        // 境界加成：让修炼速率随「下一层突破所需战力」同步指数增长，
        // 否则高境界(大乘+)战力需求爆炸、速率却线性增长，会彻底卡死。
        // base ∝ baseXiu * xiuMult^(layer-1)（即下一层突破成本），使每层所需闭关时长与境界无关。
        const layerExp = Math.pow(realm.xiuMult, player.realmLayer - 1);
        const realmMult = Math.max(1, (realm.baseXiu * layerExp) / 5e6);
        base *= realmMult;
        // 功法加成
        const gf = getGongfa(player.gongfa);
        if (gf) base *= (1 + gf.xiuBonus);
        // 装备加成（所有装备灵力总和的0.15%）
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
        base *= (1 + equipLing * 0.0015);
        // 悟性加成（顿悟系统；运行时 Cultivate 已定义）
        if (typeof Cultivate !== 'undefined' && Cultivate.wuxingRateMult) {
            base *= Cultivate.wuxingRateMult(player);
        }
        // 渡劫加成（劫后余韵永久提升修炼速率）
        if (player.tribulus && player.tribulus.xiuMult) {
            base *= (1 + player.tribulus.xiuMult);
        }
        // 轮回加成：每世 +100% 修炼收益（永久），与气血/攻击加成叠加
        if (GameConfig.rebirth && GameConfig.rebirth.xiuBonusPerRebirth) {
            base *= (1 + (player.rebirth || 0) * GameConfig.rebirth.xiuBonusPerRebirth);
        }
        // 天赋加成（悟道系·明悟）
        if (typeof Talent !== 'undefined') base *= Talent.xiuRateMult(player);
        // 难度系数：修炼速率 ×rateMult（与 getRateDetail 同步，避免运行时与显示不一致）
        base *= (typeof DIFF !== 'undefined') ? DIFF.rateMult : 1;
        // 硬顶：最终速率不得超过 JS 安全整数，防止 UI/离线收益出现无法阅读的超大数字
        return Math.min(base, Number.MAX_SAFE_INTEGER);
    },

    /* ---------- 应用离线收益 ---------- */
    applyOfflineReward(player) {
        const reward = this.calcOfflineReward(player);
        const SAFE = ZHANLI_CAP;
        if (reward.zhanli > 0) {
            player.zhanli = Math.min((player.zhanli || 0) + Math.min(reward.zhanli, SAFE), SAFE);
            player.stats.totalZhanli = Math.min((player.stats.totalZhanli || 0) + Math.min(reward.zhanli, SAFE), SAFE);
        }
        player.lastOffline = Date.now();
        player.lastSave = Date.now(); // 防止下次用旧lastSave重复结算离线收益
        return reward;
    },

    /* ---------- 解析存档码（同步，仅识别格式，不解密） ----------
       返回：{ status:'plaintext'|'encrypted'|'legacy'|'version-mismatch'|'invalid', version?, payload? }
       - plaintext : XIUXIAN:v1:P:<b64>        本版本明文码
       - encrypted : XIUXIAN:v1:E:<envelope>    本版本加密码（需密码）
       - legacy    : XIUXIAN1:<b64> 或 更早裸码  旧版，按明文处理
       - version-mismatch : 版本号与当前不一致，拒绝导入
       - invalid   : 无法识别
    */
    parseCode(code) {
        code = (code || '').trim();
        if (!code) return { status: 'invalid' };
        // 新格式：XIUXIAN:v1:P:... / XIUXIAN:v1:E:...
        if (code.startsWith(SAVE_CODE_MAGIC + ':')) {
            const parts = code.split(':');
            if (parts.length < 4) return { status: 'invalid' };
            const version = parts[1];
            const flag = parts[2];
            const payload = parts.slice(3).join(':'); // 负载为 base64 或 "salt.iv.ct"，不含冒号
            if (version !== _saveCodeVersion()) return { status: 'version-mismatch', version };
            if (flag === 'P') return { status: 'plaintext', payload };
            if (flag === 'E') return { status: 'encrypted', payload };
            return { status: 'invalid' };
        }
        // 旧格式 XIUXIAN1:（ff56566 导出）→ 视为明文 v1
        if (code.startsWith(SAVE_CODE_LEGACY_PREFIX)) {
            return { status: 'legacy', payload: code.slice(SAVE_CODE_LEGACY_PREFIX.length) };
        }
        // 更早的无前缀裸码 → 视为 legacy 明文
        return { status: 'legacy', payload: code };
    },

    /* ---------- 明文负载解码（base64 → player，含 migrate 兼容） ---------- */
    _decodePlain(b64) {
        try {
            const data = decodeURIComponent(escape(atob(b64)));
            return this.migrate(JSON.parse(data));
        } catch (e) {
            return null;
        }
    },

    /* ---------- 导出存档码（异步；可选 password 加密） ----------
       无密码 → XIUXIAN:v1:P:<b64>
       有密码 → XIUXIAN:v1:E:<envelope>（AES-256-GCM，密码不存储、无法找回）
    */
    async exportSave(player, password) {
        try {
            const data = JSON.stringify(player); // 原始 JSON 串（加密也是对这串加密）
            const ver = _saveCodeVersion();
            if (password) {
                const env = await Auth.encryptToString(data, password);
                return `${SAVE_CODE_MAGIC}:${ver}:E:${env}`;
            }
            const b64 = btoa(unescape(encodeURIComponent(data)));
            return `${SAVE_CODE_MAGIC}:${ver}:P:${b64}`;
        } catch (e) {
            console.error('导出失败:', e);
            return '';
        }
    },

    /* ---------- 导入存档码 ----------
       返回结构：{ ok:true, player } | { ok:false, error:'INVALID'|'VERSION'|'BAD_PASSWORD', needPassword?, version? }
       - encrypted 且未给 password → { ok:false, needPassword:true }
       - 跨版本 → error:'VERSION'（清晰报错，而非神秘 JSON 失败）
    */
    async importSave(code, password) {
        const parsed = this.parseCode(code);
        if (parsed.status === 'plaintext' || parsed.status === 'legacy') {
            const player = this._decodePlain(parsed.payload);
            return player ? { ok: true, player } : { ok: false, error: 'INVALID' };
        }
        if (parsed.status === 'encrypted') {
            if (!password) return { ok: false, needPassword: true };
            try {
                const json = await Auth.decryptFromString(parsed.payload, password);
                const player = this.migrate(JSON.parse(json));
                return { ok: true, player };
            } catch (e) {
                if (e && e.code === 'BAD_PASSWORD') return { ok: false, error: 'BAD_PASSWORD' };
                return { ok: false, error: 'INVALID' };
            }
        }
        if (parsed.status === 'version-mismatch') return { ok: false, error: 'VERSION', version: parsed.version };
        return { ok: false, error: 'INVALID' };
    },

    /* ---------- 是否存在存档（任一槽有数据即算） ---------- */
    hasSave() {
        const idx = this._readIndex();
        return Object.keys(idx.slots).some(k => idx.slots[k]);
    },

    /* ---------- 多槽索引读写 ---------- */
    _readIndex() {
        try {
            const d = this._read(SAVE_INDEX_KEY);
            if (d) {
                const idx = JSON.parse(d);
                if (!idx.slots) idx.slots = {};
                return idx;
            }
        } catch (e) {}
        return { slots: {}, current: null };
    },
    _writeIndex(idx) {
        this._write(SAVE_INDEX_KEY, JSON.stringify(idx));
    },
    _currentSlotId() {
        const idx = this._readIndex();
        return idx.current || null;
    },
    _setCurrentSlot(id) {
        const idx = this._readIndex();
        idx.current = id;
        this._writeIndex(idx);
    },
    _updateIndex(slotId, player) {
        const idx = this._readIndex();
        const meta = this.metaFromPlayer(player);
        idx.slots['' + slotId] = meta;
        idx.current = slotId;
        this._writeIndex(idx);
    },

    /* ---------- 由 player 生成轻量存档卡信息（用于槽位预览） ---------- */
    metaFromPlayer(p) {
        return {
            name: p.name || '无名修士',
            avatar: p.avatar || 0,
            element: p.element || 'metal',
            realmIdx: p.realmIdx || 0,
            realmLayer: p.realmLayer || 1,
            zhanli: Math.floor(p.zhanli || 0),
            lifespan: (p.lifespan || 100),
            lastSave: p.lastSave || Date.now()
        };
    },

    /* ---------- 列出所有槽位 ---------- */
    listSlots() {
        const idx = this._readIndex();
        const arr = [];
        for (let i = 1; i <= SLOT_COUNT; i++) {
            const meta = idx.slots['' + i] || null;
            arr.push({ id: i, meta: meta, current: idx.current === i });
        }
        return arr;
    },

    /* ---------- 删除指定槽位 ---------- */
    deleteSlot(id) {
        this._remove(slotKey(id));
        const idx = this._readIndex();
        idx.slots['' + id] = null;
        if (idx.current === id) idx.current = null;
        this._writeIndex(idx);
    },

    /* ---------- 旧版单槽存档迁移（首次运行时执行一次） ---------- */
    migrateOld() {
        try {
            const old = this._read(SAVE_KEY);
            if (!old) return;
            const idx = this._readIndex();
            if (!idx.slots['1']) {
                let p = null;
                try { p = JSON.parse(old); } catch (e) { p = null; }
                idx.slots['1'] = p
                    ? this.metaFromPlayer(p)
                    : { name: '无名修士', avatar: 0, element: 'metal', realmIdx: 0, realmLayer: 1, zhanli: 0, lifespan: 100, lastSave: Date.now() };
                idx.current = 1;
                this._writeIndex(idx);
                this._write(slotKey(1), old);
            }
            // 旧键已并入槽位体系，移除避免混淆
            this._remove(SAVE_KEY);
        } catch (e) {
            console.error('旧档迁移失败:', e);
        }
    }
};

/* ---------- 全局游戏状态管理（Game命名空间） ---------- */
const Game = {
    player: null,       // 玩家数据
    currentSlotId: null, // 当前所在存档槽
    currentPanel: 'cultivate',
    autoSaveTimer: null,
    cultivateTimer: null,
    cultivating: true,  // 是否正在修炼
    lastTickTime: 0,

    /* 初始化游戏（读取当前槽位并应用离线收益） */
    init() {
        const player = SaveSystem.load();
        if (player) {
            const offline = SaveSystem.applyOfflineReward(player);
            this.player = player;
            this.currentSlotId = SaveSystem._currentSlotId();
            this.offlineReward = offline;
        }
    },

    /* 新游戏（写入指定槽位） */
    newGame(custom, slotId) {
        this.player = SaveSystem.createNew(custom);
        slotId = slotId || 1;
        this.currentSlotId = slotId;
        this.offlineReward = { zhanli: 0, time: 0 };
        SaveSystem.save(this.player, slotId);
    },

    /* 切换到指定槽位（中途切换道途，不结算离线收益） */
    loadSlot(id) {
        const p = SaveSystem.load(id);
        if (p) {
            this.player = p;
            this.currentSlotId = id;
            this.offlineReward = { zhanli: 0, time: 0 };
        }
        return p;
    },

    /* 获取当前玩家 */
    get p() { return this.player; },

    /* 立即存档 */
    save() {
        if (!this.player) return false;
        return SaveSystem.save(this.player, this.currentSlotId);
    },

    /* 启动自动存档 */
    startAutoSave() {
        this.stopAutoSave();
        this.autoSaveTimer = setInterval(() => {
            if (this.player && this.player.settings.autoSave) {
                this.save();
            }
        }, GameConfig.autoSaveInterval);
    },

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    },

    /* 启动修炼循环 */
    startCultivateLoop() {
        this.stopCultivateLoop();
        this.lastTickTime = Date.now();
        this.cultivateTimer = setInterval(() => {
            if (!this.player || !this.cultivating) return;
            const now = Date.now();
            const dt = (now - this.lastTickTime) / 1000;
            this.lastTickTime = now;
            const rate = SaveSystem.calcCultivateRate(this.player);
            const gain = rate * dt;
            this.player.zhanli += gain;
            this.player.stats.totalZhanli = (this.player.stats.totalZhanli || 0) + gain;
            // 洞天产出（灵石/秒、悟性经验/秒）
            if (typeof Cave !== 'undefined' && this.player.realmIdx >= Cave.UNLOCK_IDX) {
                const prod = Cave.producePerSec(this.player);
                if (prod.stone > 0) this.player.stone = (this.player.stone || 0) + prod.stone * dt;
                if (prod.wuxingExp > 0) this.player.wuxingExp = (this.player.wuxingExp || 0) + prod.wuxingExp * dt;
            }
            // 化身注水（向 zhanli 池持续注入，不进战斗属性）
            if (typeof Avatars !== 'undefined' && this.player.realmIdx >= Avatars.UNLOCK_IDX) {
                const add = Avatars.tick(this.player);
                if (add > 0) this.player.zhanli += add;
            }
            // UI刷新（节流：每秒更新一次）
            if (typeof UI !== 'undefined' && UI.updateCultivationBar) {
                UI.updateCultivationBar();
                UI.updateResourceBar();
            }
            // 任务进度
            if (typeof Quests !== 'undefined') Quests.tickProgress('zhanli_total', this.player.stats.totalZhanli);
        }, 1000);
    },

    stopCultivateLoop() {
        if (this.cultivateTimer) {
            clearInterval(this.cultivateTimer);
            this.cultivateTimer = null;
        }
    },

    /* 启动寿命衰减（真实时间每 60 秒 -1 寿元） */
    startLifespanDecay() {
        this.stopLifespanDecay();
        const atMaxRealm = () => {
            try { return (this.player.realmIdx || 0) >= (GameConfig.realms.length - 1); }
            catch (e) { return false; }
        };
        this.lifespanTimer = setInterval(() => {
            if (!this.player) return;
            // 已达最高境界：解除被动寿元衰减（终局不再有“限时墙”），但闭关/游历消耗寿元仍照常
            if (atMaxRealm()) {
                if (typeof UI !== 'undefined' && UI.updateResourceBar) UI.updateResourceBar();
                return;
            }
            this.player.lifespan = (this.player.lifespan || 0) - 1;
            if (typeof UI !== 'undefined' && UI.updateResourceBar) UI.updateResourceBar();
            if (this.player.lifespan <= 0) {
                this.player.lifespan = 0;
                this.stopLifespanDecay();
                if (typeof Game !== 'undefined' && typeof Game.onLifespanZero === 'function') {
                    Game.onLifespanZero(this.player);
                }
            }
        }, 60000);
    },

    stopLifespanDecay() {
        if (this.lifespanTimer) {
            clearInterval(this.lifespanTimer);
            this.lifespanTimer = null;
        }
    },

    /* 重置游戏（删除当前槽位） */
    reset() {
        this.stopAutoSave();
        this.stopCultivateLoop();
        this.stopLifespanDecay();
        if (this.currentSlotId) SaveSystem.deleteSlot(this.currentSlotId);
        else SaveSystem.reset();
        this.player = null;
        this.cultivating = true;
        this.currentSlotId = null;
    },

    /* 页面卸载前保存 */
    beforeUnload() {
        if (this.player) this.save();
    }
};

// 页面卸载前自动保存
window.addEventListener('beforeunload', () => Game.beforeUnload());
// 页面隐藏（切后台/关标签页）时保存，比 beforeunload 更可靠
window.addEventListener('pagehide', () => Game.beforeUnload());
// 失焦时保存
window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') Game.beforeUnload();
});
