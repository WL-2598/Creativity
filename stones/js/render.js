/**
 * render.js — 石阵渲染引擎
 * 石柱群、中心祭坛、日轨弧线与随日移动的阴影。
 */
import { shadowOf } from './stones.js';

export class StonesRender {
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
    const f = this.field;

    // 天地
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1c2030');
    sky.addColorStop(0.7, '#2c3042');
    sky.addColorStop(1, '#3a3f4e');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // 地平线
    const groundY = H * 0.72;
    const ground = ctx.createLinearGradient(0, groundY, 0, H);
    ground.addColorStop(0, '#4a4638');
    ground.addColorStop(1, '#2e2a20');
    ctx.fillStyle = ground;
    ctx.fillRect(0, groundY, W, H - groundY);

    // 日轨弧：太阳沿弧线巡行
    const sunT = (this.t * 0.05) % 1;
    const sunAz = f.sun.az0 + (f.sun.az1 - f.sun.az0) * sunT;
    const sunElev = f.sun.elev * (0.7 + 0.3 * Math.sin(sunT * Math.PI));
    const cx = W * 0.5, cy = groundY;
    const R = Math.min(W, H) * 0.42;
    const sunX = cx + Math.cos(sunAz) * R * 0.9;
    const sunY = cy - Math.sin(sunElev) * R;
    // 日轨
    ctx.strokeStyle = 'rgba(255, 200, 130, 0.25)';
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    for (let a = f.sun.az0; a <= f.sun.az1; a += 0.02) {
      const x = cx + Math.cos(a) * R * 0.9;
      const y = cy - Math.sin(f.sun.elev * (0.7 + 0.3 * Math.sin(((a - f.sun.az0) / (f.sun.az1 - f.sun.az0)) * Math.PI))) * R;
      a === f.sun.az0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // 太阳
    const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 40);
    glow.addColorStop(0, 'rgba(255, 210, 150, 0.9)');
    glow.addColorStop(1, 'rgba(255, 210, 150, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
    ctx.fill();

    // 中心祭坛
    ctx.fillStyle = '#5a5446';
    ctx.beginPath();
    ctx.ellipse(cx, cy, f.altar.r * W, f.altar.r * H * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 石柱与阴影（先画阴影，再画柱）
    const scale = Math.min(W, H);
    for (const s of f.stones) {
      const sx = s.x * W, sy = s.y * H;
      const hh = s.h * scale;
      const ww = s.w * scale;
      // 阴影
      const sh = shadowOf(s, sunAz, sunElev);
      ctx.fillStyle = 'rgba(20, 16, 10, 0.4)';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + sh.dx * scale, sy + sh.dy * scale * 0.55);
      ctx.lineTo(sx + sh.dx * scale + ww, sy + sh.dy * scale * 0.55);
      ctx.lineTo(sx + ww, sy);
      ctx.closePath();
      ctx.fill();
      // 石柱（带倾角的立石）
      ctx.save();
      ctx.translate(sx + ww / 2, sy);
      ctx.rotate(s.tilt);
      const g = ctx.createLinearGradient(-ww / 2, 0, ww / 2, 0);
      g.addColorStop(0, '#4a4438');
      g.addColorStop(0.5, '#6a6252');
      g.addColorStop(1, '#3e3a30');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-ww * 0.6, 0);
      ctx.lineTo(-ww * 0.45, -hh);
      ctx.lineTo(ww * 0.45, -hh);
      ctx.lineTo(ww * 0.6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    this._raf = requestAnimationFrame(() => this._loop());
  }
}
