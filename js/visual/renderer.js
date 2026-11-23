/**
 * renderer.js — 视觉引擎基座
 * 管理画布、缩放、帧循环、频谱分析，并向各视觉模式分发渲染。
 * 所有模式共享同一颗种子的随机流，保证声画同源。
 */
import { rngFromSeed, clamp } from '../audio/composition.js';
import { PALETTES, paletteColor } from './palettes.js';
import { flowAngle } from './utils.js';
import * as modes from './modes.js';

export class VisualEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.modeKey = 'nebula';
    this.paletteKey = 'stellar';
    this.world = null;
    this.running = false;
    this._raf = null;
    this._last = 0;
    this._state = null;
    this._bands = { bass: 0, mid: 0, high: 0, level: 0, kick: 0 };
    this._freq = null;

    // 频谱容器（复用，避免每帧分配）
    this._freqData = new Uint8Array(2048);

    window.addEventListener('resize', () => this._resize());
    this._resize();
  }

  setMode(key) {
    if (this.modeKey === key) return;
    this.modeKey = key;
    if (this.world) this._buildState();
  }

  setPalette(key) {
    if (this.paletteKey === key) return;
    this.paletteKey = key;
    if (this.world) this._buildState();
  }

  setWorld(world) {
    this.world = world;
    this._buildState();
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = w; this.H = h;
    if (this._state && this._state.resize) this._state.resize(this._state, w, h);
  }

  _buildState() {
    if (!this.world) return;
    const rng = rngFromSeed(this.world.seed + this._modeSeedOffset());
    this._state = modes[this.modeKey].init(rng, PALETTES[this.paletteKey], this.world, this.W, this.H);
  }

  _modeSeedOffset() {
    return { nebula: 7919, ripples: 104729, mandala: 31337, trails: 1979 }[this.modeKey] || 1;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._last = performance.now();
    this._loop();
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  }

  /* ---------- 音频分析 ---------- */
  updateAudio(analyser) {
    if (!analyser) return;
    analyser.getByteFrequencyData(this._freqData);
    const n = this._freqData.length;
    const bass = this._mean(0, Math.floor(n * 0.06));
    const mid = this._mean(Math.floor(n * 0.06), Math.floor(n * 0.4));
    const high = this._mean(Math.floor(n * 0.4), n);
    // 底鼓 onset 检测：低频能量突增
    const prev = this._bands.bass;
    const kick = clamp((bass - prev) * 6, 0, 1);
    const smoothing = 0.8;
    this._bands.bass = prev * smoothing + bass * (1 - smoothing);
    this._bands.mid = this._bands.mid * smoothing + mid * (1 - smoothing);
    this._bands.high = this._bands.high * smoothing + high * (1 - smoothing);
    this._bands.level = this._bands.level * smoothing + (bass + mid + high) / 3 * (1 - smoothing);
    this._bands.kick = kick;
  }

  _mean(a, b) {
    let s = 0;
    for (let i = a; i < b; i++) s += this._freqData[i];
    return b > a ? s / (b - a) / 255 : 0;
  }

  /* ---------- 主循环 ---------- */
  _loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    const w = this.world;
    const audio = {
      bass: this._bands.bass,
      mid: this._bands.mid,
      high: this._bands.high,
      level: this._bands.level,
      kick: this._bands.kick,
    };

    // 背景
    const pal = PALETTES[this.paletteKey];
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = pal.bg;
    this.ctx.fillRect(0, 0, this.W, this.H);

    if (w && this._state) {
      const t = now / 1000;
      modes[this.modeKey].render(
        this.ctx, this._state, this,
        dt, t, audio, w, pal,
      );
    }

    this._raf = requestAnimationFrame(() => this._loop());
  }
}

export { paletteColor, clamp, flowAngle };
