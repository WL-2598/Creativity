/**
 * render.js — 花相渲染引擎
 * 花器、三主枝与辅枝、花朵与叶，在微风中轻摇。
 */
export class FloralRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.arrangement = null;
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

  setArrangement(arrangement) {
    this.arrangement = arrangement;
    this.t = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.arrangement) return;
    this.t += 1 / 60;
    const { ctx, W, H } = this;
    const A = this.arrangement;

    // 背景：素绢
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#2a2420');
    bg.addColorStop(1, '#161210');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 花案台面
    const tableY = H * 0.82;
    ctx.fillStyle = 'rgba(60, 48, 38, 0.5)';
    ctx.fillRect(0, tableY, W, H - tableY);

    // 花器
    const vx = W * 0.5, vy = tableY;
    ctx.fillStyle = '#4a3a2e';
    if (A.vesselShape === 'vase') {
      ctx.beginPath();
      ctx.moveTo(vx - W * 0.04, vy);
      ctx.bezierCurveTo(vx - W * 0.07, vy - H * 0.05, vx - W * 0.05, vy - H * 0.13, vx - W * 0.03, vy - H * 0.15);
      ctx.lineTo(vx + W * 0.03, vy - H * 0.15);
      ctx.bezierCurveTo(vx + W * 0.05, vy - H * 0.13, vx + W * 0.07, vy - H * 0.05, vx + W * 0.04, vy);
      ctx.closePath();
      ctx.fill();
    } else if (A.vesselShape === 'jar') {
      ctx.beginPath();
      ctx.ellipse(vx, vy - H * 0.06, W * 0.07, H * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(vx - W * 0.09, vy);
      ctx.lineTo(vx - W * 0.06, vy - H * 0.08);
      ctx.lineTo(vx + W * 0.06, vy - H * 0.08);
      ctx.lineTo(vx + W * 0.09, vy);
      ctx.closePath();
      ctx.fill();
    }
    // 花器口
    ctx.fillStyle = '#2e241c';
    ctx.beginPath();
    ctx.ellipse(vx, vy - H * 0.15, W * 0.035, W * 0.012, 0, 0, Math.PI * 2);
    ctx.fill();

    // 枝条与花
    const all = [...A.stems, ...A.fillers].sort((a, b) => {
      // 主枝最后画（在最前）
      const rank = (s) => s.role === 'main' ? 2 : s.role === 'guest' ? 1 : 0;
      return rank(a) - rank(b);
    });
    for (const stem of all) {
      const sway = Math.sin(this.t * 0.8 + stem.angle * 3) * 0.02;
      const baseX = vx;
      const baseY = vy - H * 0.15;
      const tipX = baseX + Math.sin(stem.angle + sway) * stem.spread * W;
      const tipY = baseY - stem.height * H;
      // 枝
      ctx.strokeStyle = `rgba(90, 110, 70, ${0.7 + stem.height * 0.3})`;
      ctx.lineWidth = Math.max(1.5, 4 * (0.5 + stem.height));
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      const cx = (baseX + tipX) / 2 + Math.sin(stem.angle) * W * 0.05;
      ctx.quadraticCurveTo(cx, (baseY + tipY) / 2, tipX, tipY);
      ctx.stroke();
      // 花与叶
      for (let i = 0; i < stem.flowers; i++) {
        const f = i / Math.max(1, stem.flowers - 1 || 1);
        const fx = baseX + (tipX - baseX) * (0.55 + f * 0.45) + Math.sin(this.t * 1.2 + i) * 2;
        const fy = baseY + (tipY - baseY) * (0.55 + f * 0.45);
        this._drawBlossom(ctx, fx, fy, stem.form, stem.color, 5 + stem.height * 6);
      }
    }

    // 题签
    ctx.fillStyle = 'rgba(220, 200, 170, 0.5)';
    ctx.font = '13px "Songti SC", "STSong", serif';
    ctx.fillText(`花相 · ${A.materials.join('、')} · ${A.vesselLabel}`, 22, 30);

    this._raf = requestAnimationFrame(() => this._loop());
  }

  /** 花朵：点型为簇点，瓣型为花瓣，叶型为叶 */
  _drawBlossom(ctx, x, y, form, color, r) {
    ctx.fillStyle = color;
    if (form === 'dot') {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.4, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255, 240, 200, 0.8)';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
    } else if (form === 'petal') {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.55, r * 0.3, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255, 240, 200, 0.7)';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.7, r * 0.32, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
