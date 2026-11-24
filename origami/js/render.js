/**
 * render.js — 纸境渲染引擎
 * 折纸折痕图：峰线实线、谷线虚线，在纸面上呼吸明暗。
 */
export class OrigamiRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.fold = null;
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
  }

  setFold(fold) {
    this.fold = fold;
    this.t = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.fold) return;
    this.t += 1 / 60;
    const { ctx, W, H } = this;
    const f = this.fold;

    // 纸面
    ctx.fillStyle = f.paper;
    ctx.fillRect(0, 0, W, H);

    // 纸纹
    const sh = Math.sin(this.t * 0.7) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.02 + sh * 0.02})`;
    ctx.fillRect(0, 0, W, H);

    // 折痕
    const pad = 40;
    const size = Math.min(W, H) - pad * 2;
    const cell = size / f.grid;
    ctx.lineCap = 'round';
    for (const s of f.segments) {
      const x1 = pad + s.x1 * cell, y1 = pad + s.y1 * cell;
      const x2 = pad + s.x2 * cell, y2 = pad + s.y2 * cell;
      if (s.peak) {
        // 峰线：实线、深墨
        ctx.setLineDash([]);
        ctx.strokeStyle = f.lineColor;
        ctx.lineWidth = 1.8;
      } else {
        // 谷线：虚线、浅墨
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = shade(f.lineColor, 0.6);
        ctx.lineWidth = 1.2;
      }
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 折痕明暗呼吸：模拟折光
    const shimmer = 0.06 * Math.sin(this.t * 0.5);
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, shimmer)})`;
    ctx.fillRect(0, 0, W, H);

    // 角标
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`折痕 ${f.stats.folds} · 马氏顶点 ${f.stats.maekawaVertices}/${f.stats.maekawaTotal}`, 22, 28);

    this._raf = requestAnimationFrame(() => this._loop());
  }
}

function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `rgb(${r},${g},${b})`;
}
