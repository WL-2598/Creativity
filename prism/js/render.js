/**
 * render.js — 棱镜渲染引擎
 * 在深色画布上绘制几何构图：辉光边 + 明亮芯线，整体缓缓旋转。
 */
import { compositionRadius } from './geometry.js';

const PALETTES = {
  aurora: ['#53d6c9', '#8a6cf6', '#ff8fc9', '#7de39a', '#ffe3b0'],
  ocean:  ['#39c6c0', '#4a90e2', '#b07ee8', '#5fd0e8', '#f0d9a0'],
  ember:  ['#ff9e6b', '#ff6a88', '#ffd166', '#ff8c42', '#ffe9c9'],
  ink:    ['#cfcfd4', '#8a8fa3', '#5c6274', '#e8e8ee', '#9aa0b4'],
};

export class PrismRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.elements = [];
    this.paletteKey = 'aurora';
    this.rotation = 0;
    this.rotateSpeed = 0.05;
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

  setScene(elements) { this.elements = elements; }
  setPalette(key) { this.paletteKey = key; }
  setRotateSpeed(v) { this.rotateSpeed = v; }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running) return;
    const { ctx, W, H } = this;
    this.rotation += this.rotateSpeed / 60;

    ctx.fillStyle = '#05050c';
    ctx.fillRect(0, 0, W, H);

    if (this.elements.length) {
      const palette = PALETTES[this.paletteKey];
      const R = compositionRadius(this.elements);
      const scale = (Math.min(W, H) * 0.42) / R;
      const cx = W / 2, cy = H / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.rotation);
      ctx.scale(scale, scale);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const el of this.elements) {
        const color = palette[el.color % palette.length];
        this._drawElement(ctx, el, color);
      }
      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
    }

    this._raf = requestAnimationFrame(() => this._loop());
  }

  _drawElement(ctx, el, color) {
    // 辉光边 + 明亮芯线
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = el.width * 4;
    this._trace(ctx, el);
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = el.width;
    this._trace(ctx, el);
    ctx.globalAlpha = 1;
  }

  _trace(ctx, el) {
    if (el.kind === 'line') {
      const [a, b] = el.points;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    } else if (el.kind === 'poly') {
      ctx.beginPath();
      el.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.globalAlpha *= 0.5;
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha /= 0.5;
    } else if (el.kind === 'arc') {
      const p = el.points[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, p.a0, p.a1);
      ctx.stroke();
    }
  }
}

export { PALETTES };
