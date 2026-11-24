/**
 * render.js — 烟境渲染引擎
 * 粒子烟羽：由流场驱动升腾、翻卷、扩散，柔和叠加如烟似雾。
 */
import { sampleFlow } from './smoke.js';

export class SmokeRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scene = null;
    this.particles = [];
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
    if (this.scene) this._reset();
  }

  setScene(scene) {
    this.scene = scene;
    this._reset();
  }

  _reset() {
    this.particles = [];
    const { sources } = this.scene;
    for (const src of sources) {
      const count = Math.round(src.strength * 90);
      for (let i = 0; i < count; i++) this._spawn(src);
    }
  }

  _spawn(src) {
    this.particles.push({
      x: src.x + (Math.random() - 0.5) * src.size * 0.15,
      y: src.y + (Math.random() - 0.5) * 0.03,
      vx: (Math.random() - 0.5) * 0.05,
      vy: -0.004 - Math.random() * 0.006,
      age: Math.random() * 1.2,
      life: 1.6 + Math.random() * 2.2,
      r: 0.02 + Math.random() * 0.03,
      src,
    });
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

    // 天空
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    s.sky.forEach((c, i) => sky.addColorStop(i / (s.sky.length - 1), c));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const [r, g, b] = s.base;
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      // 流场驱动
      const ang = sampleFlow(s.field, s.fieldRes, p.x, p.y);
      p.vx += (Math.cos(ang) * 0.0009 + p.src.drift * 0.0003);
      p.vy += (Math.sin(ang) * 0.0009 - 0.00002);
      // 阻尼与升力
      p.vx *= 0.985; p.vy *= 0.985;
      p.vy -= 0.00012;
      p.x += p.vx; p.y += p.vy;
      p.age += 1 / 60;

      const t = p.age / p.life;
      if (t >= 1 || p.y < -0.1 || p.x < -0.2 || p.x > 1.2) {
        p.dead = true;
        continue;
      }
      const alpha = Math.sin(Math.min(1, t) * Math.PI) * 0.35;
      const radius = Math.max(2, p.r * W * (1 + t * 1.6));
      const col = ctx.createRadialGradient(p.x * W, p.y * H, 0, p.x * W, p.y * H, radius);
      col.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
      col.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x * W, p.y * H, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 回收死亡粒子
    if (this.particles.some(p => p.dead)) {
      this.particles = this.particles.filter(p => !p.dead);
    }

    // 补烟：维持烟羽
    for (const src of s.sources) {
      if (this.particles.filter(p => p.src === src && p.age < 0.4).length < src.strength * 40) {
        this._spawn(src);
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    this._raf = requestAnimationFrame(() => this._loop());
  }
}
