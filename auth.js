/* ============================================
   仙途·轮回诀 — 轻量加解密（仅用于「存档码」加密码）
   基于浏览器原生 Web Crypto：PBKDF2(SHA-256, 12万迭代) 派生密钥 + AES-256-GCM
   零后端、零依赖；浏览器 window.crypto.subtle 与 Node globalThis.crypto.subtle 双兼容
   字符串接口：encryptToString / decryptFromString，信封格式 "b64(salt).b64(iv).b64(ct)"
   ============================================ */
const Auth = (function () {
    const PBKDF2_ITER = 120000;   // 迭代次数：安全性与单次开销的平衡（自动存档不在此路径，开销可接受）
    const SALT_LEN = 16;
    const IV_LEN = 12;             // AES-GCM 推荐 IV 长度

    /* 取可用的 Web Crypto 实现（浏览器/Node 22 均自带 subtle） */
    function getCrypto() {
        const c = (typeof globalThis !== 'undefined' && globalThis.crypto) ||
                  (typeof window !== 'undefined' && window.crypto) || null;
        return (c && c.subtle) ? c : null;
    }
    function available() { return !!getCrypto(); }

    /* base64 编解码：优先 Buffer（Node），否则回退 atob/btoa（浏览器） */
    function b64(bytes) {
        if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
        let bin = '';
        const u8 = new Uint8Array(bytes);
        for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
        return btoa(bin);
    }
    function unb64(str) {
        if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(str, 'base64'));
        const bin = atob(str);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        return u8;
    }

    async function deriveKey(password, saltBytes) {
        const c = getCrypto();
        const enc = new TextEncoder();
        const baseKey = await c.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
        return c.subtle.deriveKey(
            { name: 'PBKDF2', salt: saltBytes, iterations: PBKDF2_ITER, hash: 'SHA-256' },
            baseKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /* 加密字符串 → "b64(salt).b64(iv).b64(ct)"（salt/iv 随机生成，每次不同） */
    async function encryptToString(plainStr, password) {
        const c = getCrypto();
        const salt = c.getRandomValues(new Uint8Array(SALT_LEN));
        const iv = c.getRandomValues(new Uint8Array(IV_LEN));
        const key = await deriveKey(password, salt);
        const ct = await c.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plainStr));
        return [b64(salt), b64(iv), b64(new Uint8Array(ct))].join('.');
    }

    /* 解密信封字符串 → 原始字符串；密码错误（GCM 认证失败）抛 err.code='BAD_PASSWORD' */
    async function decryptFromString(envStr, password) {
        const c = getCrypto();
        const parts = (envStr || '').split('.');
        if (parts.length !== 3) throw new Error('bad envelope');
        const salt = unb64(parts[0]);
        const iv = unb64(parts[1]);
        const ct = unb64(parts[2]);
        const key = await deriveKey(password, salt);
        let plain;
        try {
            plain = await c.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
        } catch (e) {
            const err = new Error('decrypt failed');
            err.code = 'BAD_PASSWORD';
            throw err;
        }
        return new TextDecoder().decode(plain);
    }

    return { available, encryptToString, decryptFromString, PBKDF2_ITER, SALT_LEN, IV_LEN };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = { Auth };
