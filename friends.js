/* ============================================
   仙途·轮回诀 — 好友系统（跨电脑·纯前端）
   设计：无后端。玩家互相交换「分享码」互通：
     · 档案码 (type=profile)：公开战力/境界，对方导入即加为道友，用于道友榜对比
     · 馈赠码 (type=gift)：携带灵石/丹药/材料，对方导入即在己方游戏到账
   送礼跨电脑的实现：A 生成馈赠码（同时扣除己方物品）→ 发给 B → B 导入到账。
   ============================================ */

const Friends = {
    KEY: 'xiuxian_friends_v1',

    /* 战力评分（用于道友榜排序与比较）：按用户选择，直接用累积战力值 */
    power(prof) {
        return Math.floor(prof.zhanli || 0);
    },

    /* ---------- 本地好友列表 ---------- */
    list() {
        try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
        catch (e) { return []; }
    },
    _save(arr) { try { localStorage.setItem(this.KEY, JSON.stringify(arr)); } catch (e) {} },
    upsert(prof) {
        const arr = this.list();
        const i = arr.findIndex(f => f.name === prof.name);
        if (i >= 0) arr[i] = prof; else arr.push(prof);
        this._save(arr);
        return arr;
    },
    remove(name) { this._save(this.list().filter(f => f.name !== name)); },

    /* ---------- 编码 / 解码 ---------- */
    _b64(s) { return btoa(unescape(encodeURIComponent(s))); },
    _ub64(s) { return decodeURIComponent(escape(atob(s))); },
    encodeProfile(p) {
        const realm = getRealm(p.realmIdx);
        const st = Cultivate.calcFinalStats(p);
        const obj = {
            v: 1, type: 'profile',
            name: p.name,
            realmIdx: p.realmIdx, realmLayer: p.realmLayer,
            realmName: realm ? realm.name : '',
            atk: st.atk, def: st.def, hp: st.hp, ling: st.ling, crit: st.crit,
            zhanli: p.zhanli || 0,
            tXi: (p.tribulus && p.tribulus.xiuMult) || 0,
            tSt: (p.tribulus && p.tribulus.stoneMult) || 0,
            lifespan: p.lifespan || 0
        };
        return 'XIU:' + this._b64(JSON.stringify(obj));
    },
    decode(code) {
        code = (code || '').trim();
        if (!code.startsWith('XIU:')) throw new Error('不是有效的仙途分享码');
        const obj = JSON.parse(this._ub64(code.slice(4)));
        if (!obj || !obj.type) throw new Error('分享码内容有误');
        return obj;
    },

    /* ---------- 生成馈赠码（同时扣除己方物品） ---------- */
    makeGift(p, gift) {
        // gift: { stone, item:{type,id,count} }
        const payload = { stone: 0, pills: {}, materials: {} };
        if (gift.stone > 0) {
            if (p.stone < gift.stone) throw new Error('灵石不足，无法赠送');
            payload.stone = gift.stone;
        }
        if (gift.item && gift.item.count > 0) {
            const { type, id, count } = gift.item;
            const have = type === 'pill' ? (p.inventory.pill[id] || 0) : (p.inventory.material[id] || 0);
            if (have < count) throw new Error('赠品数量不足');
            if (type === 'pill') payload.pills[id] = count;
            else payload.materials[id] = count;
        }
        if (!payload.stone && !Object.keys(payload.pills).length && !Object.keys(payload.materials).length) {
            throw new Error('请先选择要赠送的灵石或物品');
        }
        // 扣除己方
        if (payload.stone) p.stone -= payload.stone;
        Object.entries(payload.pills).forEach(([id, c]) => {
            p.inventory.pill[id] -= c; if (p.inventory.pill[id] <= 0) delete p.inventory.pill[id];
        });
        Object.entries(payload.materials).forEach(([id, c]) => {
            p.inventory.material[id] -= c; if (p.inventory.material[id] <= 0) delete p.inventory.material[id];
        });
        if (typeof Game !== 'undefined' && Game.save) Game.save();
        const obj = { v: 1, type: 'gift', from: p.name, gift: payload };
        return 'XIU:' + this._b64(JSON.stringify(obj));
    },

    /* ---------- 导入（档案→加好友 / 馈赠→到账） ---------- */
    import(p, code) {
        const obj = this.decode(code);
        if (obj.type === 'profile') {
            const prof = { ...obj, power: this.power(obj), ts: Date.now() };
            this.upsert(prof);
            return { kind: 'profile', name: obj.name };
        }
        if (obj.type === 'gift') {
            const g = obj.gift || {};
            p.stone += g.stone || 0;
            Object.entries(g.pills || {}).forEach(([id, c]) => Inventory.addItem(p, id, c));
            Object.entries(g.materials || {}).forEach(([id, c]) => Inventory.addItem(p, id, c));
            if (typeof Game !== 'undefined' && Game.save) Game.save();
            return { kind: 'gift', from: obj.from, stone: g.stone || 0,
                     pills: g.pills || {}, materials: g.materials || {} };
        }
        throw new Error('未知分享码类型');
    },

    /* 描述一笔馈赠内容 */
    describeGift(g) {
        const parts = [];
        if (g.stone) parts.push(fmtNum(g.stone) + '灵石');
        Object.entries(g.pills || {}).forEach(([id, c]) => { const m = getPill(id); if (m) parts.push(m.name + '×' + c); });
        Object.entries(g.materials || {}).forEach(([id, c]) => { const m = getMaterial(id); if (m) parts.push(m.name + '×' + c); });
        return parts.join('、') || '（空）';
    }
};
