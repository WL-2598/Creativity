/**
 * render.js — 钟磬渲染引擎
 * 钟架、铜钟与敲击时的声波扩散、辉光。
 */
export class BellRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.set = null;
    this.t = 0;
    this._raf = null;
    this._hits = []; // 敲击涟漪 {bell,t,force}
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

  setSet(set) {
    this._gen = (this._gen || 0) + 1;
    this.set = set;
    this.t = 0;
    this._hits = [];
    // 预排首次敲击
    if (set && set.melody.length) {
      this._scheduleHit(this._gen, set.melody[0], 0.2);
    }
  }

  _scheduleHit(gen, hit, delay) {
    setTimeout(() => {
      if (gen !== this._gen || !this.set) return;
      this._hits.push({ bell: hit.bell, t: this.t, force: hit.force });
      // 敲击下一个
      const next = this.set.melody.find(m => m.beat === hit.beat + 1);
      if (next) this._scheduleHit(gen, next, 0.36);
    }, delay * 1000);
  }

  start() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _loop() {
    if (!this.set) { this._raf = null; return; }
    this.t += 1 / 60;
    const { ctx, W, H } = this;
    const S = this.set;

    // 背景
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#141824');
    bg.addColorStop(1, '#0a0d14');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 钟架
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(W * 0.12, H * 0.62, W * 0.76, H * 0.04);
    ctx.fillRect(W * 0.15, H * 0.66, W * 0.05, H * 0.24);
    ctx.fillRect(W * 0.8, H * 0.66, W * 0.05, H * 0.24);
    ctx.fillStyle = 'rgba(200, 160, 90, 0.25)';
    ctx.fillRect(W * 0.12, H * 0.6, W * 0.76, 3);

    // 声波涟漪
    for (let i = this._hits.length - 1; i >= 0; i--) {
      const h = this._hits[i];
      const age = this.t - h.t;
      if (age > 1.6) { this._hits.splice(i, 1); continue; }
      const b = S.bells[h.bell];
      const x = b.x * W;
      const y = (b.y - b.h / 2) * H;
      const p = age / 1.6;
      ctx.strokeStyle = `rgba(230, 200, 120, ${0.35 * (1 - p) * h.force})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 10 + p * 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(230, 200, 120, ${0.18 * (1 - p) * h.force})`;
      ctx.beginPath();
      ctx.arc(x, y, 20 + p * 90, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 铜钟（按 x 排序）
    const sorted = [...S.bells].sort((a, b) => a.x - b.x);
    for (const b of sorted) {
      this._drawBell(b);
    }

    this._raf = requestAnimationFrame(() => this._loop());
  }

  _drawBell(b) {
    const { ctx, W, H } = this;
    const x = b.x * W;
    const yTop = (b.y - b.h / 2) * H;
    const w = b.w * W;
    const h = b.h * H;
    const g = ctx.createLinearGradient(x - w / 2, yTop, x + w / 2, yTop);
    g.addColorStop(0, '#6a5230');
    g.addColorStop(0.4, '#c99a4a');
    g.addColorStop(0.6, '#e8c880');
    g.addColorStop(1, '#6a5230');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.35, yTop);
    ctx.lineTo(x + w * 0.35, yTop);
    ctx.lineTo(x + w, yTop + h);
    ctx.lineTo(x - w, yTop + h);
    ctx.closePath();
    ctx.fill();
    // 纽（钟顶钮）
    ctx.fillStyle = '#8a6a38';
    ctx.beginPath();
    ctx.arc(x, yTop - h * 0.08, w * 0.14, 0, Math.PI * 2);
    ctx.fill();
    // 敲击标记
    ctx.fillStyle = 'rgba(240, 220, 160, 0.5)';
    ctx.beginPath();
    ctx.arc(x, yTop + h * 0.25, w * 0.08, 0, Math.PI * 2);
    ctx.fill();
    // 辉光（刚被敲击时）
    const hit = this._hits.find(hh => hh.bell === b.index);
    if (hit) {
      const age = this.t - hit.t;
      if (age < 0.5) {
        const a = (1 - age / 0.5) * hit.force;
        ctx.fillStyle = `rgba(255, 230, 160, ${0.4 * a})`;
        ctx.beginPath();
        ctx.arc(x, yTop + h * 0.25, w * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
