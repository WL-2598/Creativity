/**
 * render.js — 晕境渲染引擎
 * 天光、雾滴、星芒与光学环带：日晕、主虹、副虹依物理角序展开。
 */
export class HaloRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scene = null;
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

  setScene(scene) {
    this.scene = scene;
    this.t = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.scene) return;
    this.t += 1 / 60;
    const { ctx, W, H } = this;
    const s = this.scene;

    // 天光：按场景着色
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    if (s.scene === 'sun') {
      sky.addColorStop(0, '#2a1a3a');
      sky.addColorStop(0.5, '#5a3a5e');
      sky.addColorStop(1, '#8a5a4e');
    } else if (s.scene === 'moon') {
      sky.addColorStop(0, '#06101f');
      sky.addColorStop(0.6, '#0d1c33');
      sky.addColorStop(1, '#14283f');
    } else {
      sky.addColorStop(0, '#2c3440');
      sky.addColorStop(0.6, '#4a5566');
      sky.addColorStop(1, '#7a8595');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 雾滴（背景层）
    for (const d of s.drops) {
      const tw = 0.5 + 0.5 * Math.sin(this.t * 1.4 + d.tw);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + tw * 0.18})`;
      ctx.beginPath();
      ctx.arc(d.x * W, d.y * H, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 星芒：从光源射出
    const lx = s.light.x * W, ly = s.light.y * H;
    for (const r of s.rays) {
      const len = Math.max(W, H) * r.length;
      const g = ctx.createLinearGradient(lx, ly, lx + Math.cos(r.angle) * len, ly + Math.sin(r.angle) * len);
      g.addColorStop(0, s.glowColor.replace(/[\d.]+\)$/, `${r.alpha})`));
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = r.width;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + Math.cos(r.angle) * len, ly + Math.sin(r.angle) * len);
      ctx.stroke();
    }

    // 光学环带：以反日点为圆心、按物理角半径画弧
    // 反日点：光源关于画面中心的对称点
    const cx = W / 2, cy = H / 2;
    const ax = 2 * cx - lx, ay = 2 * cy - ly;
    const scale = Math.min(W, H) * 0.85; // 角度 → 屏幕半径的比例基准
    const ringRadius = (deg) => scale * Math.tan((deg * Math.PI) / 180);

    for (const ring of s.rings) {
      const outer = ringRadius(ring.angle);
      const inner = ringRadius(Math.max(0, ring.angle - ring.width));
      ctx.lineWidth = Math.max(1, outer - inner);
      if (ring.color.startsWith('rgba(240')) {
        ctx.strokeStyle = ring.color;
      } else {
        // 双色弧：内缘与外缘不同色，用线性渐变跨弧宽
        const grad = ctx.createRadialGradient(ax, ay, inner, ax, ay, outer);
        grad.addColorStop(0, ring.inner);
        grad.addColorStop(1, ring.color);
        ctx.strokeStyle = grad;
      }
      ctx.beginPath();
      ctx.arc(ax, ay, (outer + inner) / 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 光源与光晕
    const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, s.light.r * 5);
    glow.addColorStop(0, s.glowColor);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly, s.light.r * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = s.lightColor;
    ctx.beginPath();
    ctx.arc(lx, ly, s.light.r, 0, Math.PI * 2);
    ctx.fill();

    this._raf = requestAnimationFrame(() => this._loop());
  }
}
