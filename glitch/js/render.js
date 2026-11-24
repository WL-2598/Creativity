/**
 * render.js — 光斑渲染引擎
 * 程序化源图形 + 行位移、色散、扫描线、噪点与数据块错位。
 */
import { rngFromSeed } from '../../shared/rng.js';

export class GlitchRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.glitch = null;
    this.source = null;
    this.t = 0;
    this.running = false;
    this._raf = null;
    window.addEventListener('resize', () => this._resize());
    this._resize();
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.floor(this.canvas.clientHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = this.canvas.clientWidth;
    this.H = this.canvas.clientHeight;
    if (this.glitch) this._buildSource();
  }

  setGlitch(glitch) {
    this.glitch = glitch;
    this.t = 0;
    this._buildSource();
  }

  /** 离屏源图形：渐变 + 几何体（由种子决定） */
  _buildSource() {
    const g = this.glitch;
    const off = document.createElement('canvas');
    off.width = this.W;
    off.height = this.H;
    const c = off.getContext('2d');
    const rng = rngFromSeed((g.scene.length * 9173 + 17) >>> 0);
    const grad = c.createLinearGradient(0, 0, this.W, this.H);
    g.base.forEach((col, i) => grad.addColorStop(i / (g.base.length - 1), col));
    c.fillStyle = grad;
    c.fillRect(0, 0, this.W, this.H);
    // 几何体：圆环与线网
    for (let i = 0; i < 8; i++) {
      c.strokeStyle = `rgba(255, 255, 255, ${0.05 + rng() * 0.12})`;
      c.lineWidth = 1 + rng() * 2;
      c.beginPath();
      c.arc(rng() * this.W, rng() * this.H, 20 + rng() * 120, 0, Math.PI * 2);
      c.stroke();
    }
    for (let i = 0; i < 10; i++) {
      c.strokeStyle = `rgba(120, 220, 255, ${0.06 + rng() * 0.1})`;
      c.beginPath();
      c.moveTo(rng() * this.W, rng() * this.H);
      c.lineTo(rng() * this.W, rng() * this.H);
      c.stroke();
    }
    this.source = off;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.glitch || !this.source) return;
    this.t += 1 / 60;
    const { ctx, W, H } = this;
    const g = this.glitch;

    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, W, H);

    // 基础源图
    ctx.globalAlpha = 0.9;
    ctx.drawImage(this.source, 0, 0);
    ctx.globalAlpha = 1;

    // 行位移带（带轻微时变）
    for (let i = 0; i < g.bands.length; i++) {
      const b = g.bands[i];
      const wob = Math.sin(this.t * 2 + i * 1.3) * 0.01;
      const y = b.y * H - b.h * H * 0.5;
      const hh = b.h * H;
      const shift = (b.shift + wob) * W;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5 * b.amp;
      ctx.drawImage(this.source, shift, y, W, hh, 0, y, W, hh);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // 数据块错位
    for (const blk of g.blocks) {
      const x = blk.x * W, y = blk.y * H;
      const w = blk.w * W, h = blk.h * H;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.6;
      ctx.drawImage(this.source, x + blk.shift * W, y, w, h, x, y, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // 色散：上下微移的青红两层
    const ch = g.chroma * H;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = 'rgba(0, 220, 255, 0.5)';
    ctx.fillRect(0, ch, W, H);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = 'rgba(255, 60, 120, 0.5)';
    ctx.fillRect(0, -ch, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // 扫描线
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let i = 0; i < g.scanlines; i++) {
      const y = (i / g.scanlines) * H + (this.t * 20) % (H / g.scanlines);
      ctx.fillRect(0, y, W, 1);
    }

    // 噪点
    const rng = rngFromSeed((Math.floor(this.t * 24) & 0xffff) >>> 0);
    const count = Math.floor(g.noise * 400);
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${rng() * 0.25})`;
      ctx.fillRect(rng() * W, rng() * H, 2, 2);
    }

    this._raf = requestAnimationFrame(() => this._loop());
  }
}
