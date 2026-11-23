/**
 * render.js — 流光渲染引擎
 * 光带辉光与落笔光迹的绘制，全部加法混合，如磷光在暗处游走。
 */
import { ribbonBounds } from './lumen.js';

const PALETTES = {
  aurora: ['#53d6c9', '#8a6cf6', '#ff8fc9', '#7de39a'],
  ember:  ['#ffd166', '#ff9e6b', '#ff6a88', '#ffe9c9'],
  ocean:  ['#39c6c0', '#4a90e2', '#9fe8f0', '#b07ee8'],
  sakura: ['#ff8fc9', '#f0a8d8', '#ffe3f0', '#c9a0ff'],
};

export class LumenRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ribbons = [];
    this.strokes = [];
    this.paletteKey = 'aurora';
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
  }

  setRibbons(ribbons) { this.ribbons = ribbons; }
  setPalette(key) { this.paletteKey = key; }
  clearStrokes() { this.strokes = []; }
  clearAll() { this.strokes = []; }

  /* ---------- 落笔 ---------- */
  beginStroke(x, y, width) {
    this._current = { points: [{ x, y }], width: width ?? 3 };
  }
  extendStroke(x, y) {
    if (!this._current) return;
    this._current.points.push({ x, y });
  }
  endStroke() {
    if (this._current && this._current.points.length > 1) {
      this.strokes.push(this._current);
      if (this.strokes.length > 60) this.strokes.shift();
    }
    this._current = null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running) return;
    const { ctx, W, H } = this;
    const t = performance.now() / 1000;

    // 暗夜底（带微弱拖影，光迹自然绵长）
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(4, 4, 10, 0.28)';
    ctx.fillRect(0, 0, W, H);

    ctx.globalCompositeOperation = 'lighter';
    const palette = PALETTES[this.paletteKey];

    for (const r of this.ribbons) {
      this._drawRibbon(ctx, r, palette, t);
    }
    for (const s of this.strokes) {
      this._drawStroke(ctx, s, palette);
    }
    if (this._current) this._drawStroke(ctx, this._current, palette);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _drawRibbon(ctx, r, palette, t) {
    const color = palette[Math.floor(r.hue * palette.length) % palette.length];
    const n = r.points.length;
    // 辉光边
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = color;
    ctx.lineWidth = r.width * 4;
    ctx.lineCap = 'round';
    this._tracePoly(ctx, r.points);
    // 明亮芯线，亮度沿丝带流动
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = r.width;
    this._tracePoly(ctx, r.points);
    // 流动光点
    const flowPos = ((t * r.flow * 0.25 + r.phase / (Math.PI * 2)) % 1 + 1) % 1;
    const idx = Math.floor(flowPos * (n - 1));
    const p = r.points[idx];
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, r.width * 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  _drawStroke(ctx, s, palette) {
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = palette[0];
    ctx.lineWidth = s.width * 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this._tracePoly(ctx, s.points);
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = s.width;
    ctx.strokeStyle = '#ffffff';
    this._tracePoly(ctx, s.points);
    ctx.globalAlpha = 1;
  }

  _tracePoly(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }
}

export { PALETTES, ribbonBounds };
