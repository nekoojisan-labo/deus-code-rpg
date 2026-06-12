// ==========================================
// SE System (WebAudio手続き合成・音声アセット不要)
// ==========================================
// レトロJRPG風の効果音をオシレーター/ノイズでリアルタイム合成する。
// 使い方: window.playSE('cursor' | 'confirm' | 'cancel' | 'menu_open' | 'hit' |
//                       'damage' | 'heal' | 'magic' | 'encounter' | 'victory' |
//                       'level_up' | 'escape' | 'save' | 'transition')
// AudioContext はユーザー操作起点の初回呼び出しで生成される（自動再生制限対応）。

class SESystem {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.volume = 0.35;
        this.enabled = true;
        this._noiseBuf = null;
        this._last = {}; // name -> time（同音の連打抑制）
    }

    _ensure() {
        if (!this.enabled) return null;
        if (!this.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) { this.enabled = false; return null; }
            this.ctx = new AC();
            this.master = this.ctx.createGain();
            this.master.gain.value = this.volume;
            this.master.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    _noise() {
        const ctx = this.ctx;
        if (!this._noiseBuf) {
            const len = Math.floor(ctx.sampleRate * 0.5);
            this._noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
            const d = this._noiseBuf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        }
        const src = ctx.createBufferSource();
        src.buffer = this._noiseBuf;
        return src;
    }

    // 単音: type波形 / f0→f1 周波数スイープ / dur秒 / gain
    _tone(t0, { type = 'square', f0 = 440, f1 = null, dur = 0.08, gain = 0.5, attack = 0.004 }) {
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f0, t0);
        if (f1 !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(gain, t0 + attack);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        osc.connect(g).connect(this.master);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
    }

    // ノイズバースト: バンドパス中心f / dur秒
    _burst(t0, { f = 800, q = 1.2, dur = 0.12, gain = 0.6, f1 = null }) {
        const ctx = this.ctx;
        const src = this._noise();
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(f, t0);
        if (f1 !== null) bp.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
        bp.Q.value = q;
        const g = ctx.createGain();
        g.gain.setValueAtTime(gain, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        src.connect(bp).connect(g).connect(this.master);
        src.start(t0);
        src.stop(t0 + dur + 0.02);
    }

    play(name) {
        try {
            const ctx = this._ensure();
            if (!ctx) return;
            const now = ctx.currentTime;
            // 同一SEの過剰連打を35msで間引く（カーソル連打等は許容したいので短め）
            if (this._last[name] && now - this._last[name] < 0.035) return;
            this._last[name] = now;
            const t = now + 0.001;
            switch (name) {
                case 'cursor':
                    this._tone(t, { type: 'square', f0: 720, dur: 0.045, gain: 0.25 });
                    break;
                case 'confirm':
                    this._tone(t, { type: 'square', f0: 660, dur: 0.05, gain: 0.3 });
                    this._tone(t + 0.055, { type: 'square', f0: 990, dur: 0.07, gain: 0.3 });
                    break;
                case 'cancel':
                    this._tone(t, { type: 'square', f0: 520, f1: 260, dur: 0.09, gain: 0.28 });
                    break;
                case 'menu_open':
                    this._tone(t, { type: 'triangle', f0: 420, f1: 840, dur: 0.1, gain: 0.3 });
                    break;
                case 'hit': // 敵に攻撃が当たる
                    this._burst(t, { f: 1800, q: 0.8, dur: 0.08, gain: 0.55, f1: 500 });
                    this._tone(t, { type: 'sine', f0: 180, f1: 70, dur: 0.12, gain: 0.55 });
                    break;
                case 'damage': // 味方が被弾
                    this._burst(t, { f: 900, q: 0.9, dur: 0.16, gain: 0.5, f1: 200 });
                    this._tone(t, { type: 'sawtooth', f0: 220, f1: 80, dur: 0.18, gain: 0.4 });
                    break;
                case 'heal':
                    this._tone(t, { type: 'sine', f0: 523, dur: 0.09, gain: 0.3 });
                    this._tone(t + 0.08, { type: 'sine', f0: 659, dur: 0.09, gain: 0.3 });
                    this._tone(t + 0.16, { type: 'sine', f0: 784, dur: 0.14, gain: 0.3 });
                    break;
                case 'magic':
                    this._tone(t, { type: 'triangle', f0: 700, f1: 1900, dur: 0.22, gain: 0.25 });
                    this._tone(t + 0.02, { type: 'triangle', f0: 707, f1: 1930, dur: 0.22, gain: 0.22 });
                    this._burst(t + 0.05, { f: 3200, q: 2.5, dur: 0.18, gain: 0.18 });
                    break;
                case 'encounter':
                    this._tone(t, { type: 'sawtooth', f0: 200, f1: 560, dur: 0.16, gain: 0.3 });
                    this._tone(t + 0.16, { type: 'sawtooth', f0: 200, f1: 560, dur: 0.16, gain: 0.3 });
                    break;
                case 'victory':
                    this._tone(t, { type: 'square', f0: 523, dur: 0.1, gain: 0.3 });
                    this._tone(t + 0.11, { type: 'square', f0: 659, dur: 0.1, gain: 0.3 });
                    this._tone(t + 0.22, { type: 'square', f0: 784, dur: 0.1, gain: 0.3 });
                    this._tone(t + 0.33, { type: 'square', f0: 1046, dur: 0.22, gain: 0.32 });
                    break;
                case 'level_up':
                    this._tone(t, { type: 'triangle', f0: 659, dur: 0.09, gain: 0.32 });
                    this._tone(t + 0.09, { type: 'triangle', f0: 784, dur: 0.09, gain: 0.32 });
                    this._tone(t + 0.18, { type: 'triangle', f0: 988, dur: 0.09, gain: 0.32 });
                    this._tone(t + 0.27, { type: 'triangle', f0: 1318, dur: 0.24, gain: 0.34 });
                    break;
                case 'escape':
                    this._burst(t, { f: 1200, q: 0.7, dur: 0.2, gain: 0.3, f1: 300 });
                    this._tone(t, { type: 'square', f0: 880, f1: 220, dur: 0.22, gain: 0.22 });
                    break;
                case 'save':
                    this._tone(t, { type: 'sine', f0: 880, dur: 0.08, gain: 0.3 });
                    this._tone(t + 0.09, { type: 'sine', f0: 1174, dur: 0.16, gain: 0.3 });
                    break;
                case 'transition':
                    this._burst(t, { f: 400, q: 0.6, dur: 0.25, gain: 0.16, f1: 1200 });
                    break;
                default:
                    break;
            }
        } catch (e) {
            // SEは失敗しても無音でゲーム続行
        }
    }
}

window.seSystem = window.seSystem || new SESystem();
window.playSE = function (name) { window.seSystem.play(name); };
