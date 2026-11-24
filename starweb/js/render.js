/**
 * render.js — 织星渲染引擎
 * 星点闪烁、连线辉光，星座网按生长顺序逐线展开。
 */
export class StarRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.field = null;
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

  setField(field) {
    this.field = field;
    this.t = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.field) return;
    this.t += 1 / 60;
    const { ctx, W, H } = this;

    // 夜空底
    const bg = ctx.createRadialGradient(W * 0.5, H * 0.4, 30, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
    bg.addColorStop(0, '#101a2e');
    bg.addColorStop(1, '#04070e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const padX = 40, padY = 40;
    const scale = Math.min((W - padX * 2), (H - padY * 2));

    // 连线（按生长顺序，随时间逐步显现）
    const lineDur = Math.max(0.4, 0.06 / Math.max(1, this.field.edges.length / 40));
    const revealUpTo = this.t / lineDur;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < this.field.edges.length; i++) {
      const e = this.field.edges[i];
      const prog = Math.min(1, Math.max(0, revealUpTo - i));
      if (prog <= 0) break;
      const a = this.field.stars[e.a], b = this.field.stars[e.b];
      ctx.strokeStyle = `rgba(140, 180, 255, ${0.45 * prog})`;
      ctx.beginPath();
      ctx.moveTo(padX + a.x * scale, padY + a.y * scale);
      ctx.lineTo(padX + b.x * scale, padY + b.y * scale);
      ctx.stroke();
    }

    // 星点：亮度闪烁
    for (const s of this.field.stars) {
      const tw = 0.6 + 0.4 * Math.sin(this.t * 2 + s.phase);
      const r = s.size * (0.8 + s.bright * 0.5) * tw;
      const x = padX + s.x * scale, y = padY + s.y * scale;
      // 光晕
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      const alpha = (0.12 + s.bright * 0.08) * tw;
      g.addColorStop(0, `rgba(190, 215, 255, ${alpha})`);
      g.addColorStop(1, 'rgba(190, 215, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, Math.PI * 2);
      ctx.fill();
      // 星核
      ctx.fillStyle = `rgba(235, 244, 255, ${0.6 + s.bright * 0.12})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 星网之名
    if (this.field.name) {
      ctx.fillStyle = 'rgba(200, 220, 255, 0.55)';
      ctx.font = '14px "Songti SC", "STSong", serif';
      ctx.fillText(`星网 · ${this.field.name}`, 22, 30);
    }

    this._raf = requestAnimationFrame(() => this._loop());
  }
}
