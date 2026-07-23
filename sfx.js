// sfx.js — 纯 Web Audio 合成音效，零音频文件、零外部依赖
// 所有声音用 OscillatorNode + GainNode 包络实时合成；受「设置 → 音效」开关控制
const Sound = (() => {
    let ctx = null;
    const enabled = () => {
        try { return !!(Game && Game.player && Game.player.settings && Game.player.settings.sound); }
        catch (e) { return false; }
    };
    function ensure() {
        if (!ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            try { ctx = new AC(); } catch (e) { return null; }
        }
        if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
        return ctx;
    }
    // 单音：频率 freq、时长 dur(秒)、波形 type、音量 vol、起始偏移 when(秒)
    function tone(freq, dur, type, vol, when) {
        const c = ensure(); if (!c) return;
        const t0 = c.currentTime + (when || 0);
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(g); g.connect(c.destination);
        osc.start(t0); osc.stop(t0 + dur + 0.03);
    }
    // 滑音：频率 f0 → f1
    function sweep(f0, f1, dur, type, vol, when) {
        const c = ensure(); if (!c) return;
        const t0 = c.currentTime + (when || 0);
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(f0, t0);
        osc.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(g); g.connect(c.destination);
        osc.start(t0); osc.stop(t0 + dur + 0.03);
    }
    const SFX = {
        // 通用按钮轻点
        click()  { tone(440, 0.05, 'triangle', 0.10); },
        // 小境界突破：上行两音（宫→角）
        success() { tone(523.25, 0.10, 'sine', 0.20); tone(659.25, 0.14, 'sine', 0.20, 0.08); },
        // 大境界突破 / 觉醒天赋：上行琶音（宫→角→徵→高宫）
        levelup() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.16, 'sine', 0.20, i * 0.07)); },
        // 突破失败 / 损耗
        fail() { sweep(300, 90, 0.30, 'sawtooth', 0.16); },
        // 天劫硬抗失败
        tribulation() { sweep(680, 110, 0.45, 'sawtooth', 0.20); },
        // 灵石 / 资源 / 闭关收益
        coin() { tone(987.77, 0.06, 'square', 0.13); tone(1318.51, 0.08, 'square', 0.11, 0.05); },
        // 玩家出手命中
        hit() { tone(190, 0.06, 'square', 0.15); },
        // 敌方出手（稍轻）
        hurt() { tone(130, 0.07, 'sawtooth', 0.12); },
        // 治疗 / 回复
        heal() { sweep(440, 880, 0.25, 'sine', 0.15); },
        // 转世轮回
        rebirth() { sweep(200, 1200, 0.5, 'sine', 0.17); tone(1567.98, 0.3, 'sine', 0.11, 0.2); },
        // 任务 / 奇遇奖励
        quest() { tone(880, 0.07, 'triangle', 0.13); tone(1174.66, 0.10, 'triangle', 0.13, 0.07); },
        // 胜利
        win() { [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => tone(f, 0.14, 'sine', 0.18, i * 0.06)); },
        // 战败
        lose() { [440, 349.23, 261.63].forEach((f, i) => tone(f, 0.22, 'sine', 0.18, i * 0.12)); }
    };
    function play(type) {
        if (!enabled()) return;
        const fn = SFX[type];
        if (fn) { try { fn(); } catch (e) {} }
    }
    // 在用户首次手势内调用，创建并恢复 AudioContext（绕过浏览器自动播放限制）
    function unlock() {
        const c = ensure();
        if (c && c.state === 'suspended') { try { c.resume(); } catch (e) {} }
    }
    return { play, enabled, unlock, _ctx: () => ctx };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = { Sound };
