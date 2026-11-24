/**
 * render.js — 焰火渲染引擎
 * 焰火升空、爆炸绽放、粒子坠落与二次爆裂，夜空中的瞬时华彩。
 */
export class FireworkRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.show = null;
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
    if (this.show) this._reset();
  }

  setShow(show) {
    this.show = show;
    this._reset();
  }

  _reset() {
    this.t = 0;
    this.rockets = this.show.fireworks.map(f => ({
      ...f,
      phase: 'rise',           // rise | burst
      px: f.x * this.W,
      py: this.H,
      vy: 0,
      particles: [],
      burstT: 0,
    }));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.show) return;
    this.t += 1 / 60;
    const { ctx, W, H } = this;

    // 夜空（带微弱拖影的叠加）
    ctx.fillStyle = 'rgba(5, 7, 14, 0.28)';
    ctx.fillRect(0, 0, W, H);

    for (const fw of this.rockets) {
      if (this.t < fw.delay) continue;
      if (fw.phase === 'rise') {
        // 上升：匀加速，到爆点高度即炸
        fw.vy -= 0.9;
        fw.py += fw.vy;
        const targetY = fw.explodeY * H;
        if (fw.py <= targetY || fw.vy <= 0) {
          fw.phase = 'burst';
          fw.py = Math.max(targetY, fw.py);
          this._explode(fw, fw.py);
        } else {
          // 拖尾
          ctx.strokeStyle = fw.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.moveTo(fw.px, fw.py);
          ctx.lineTo(fw.px, fw.py + 26 * fw.trail);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(fw.px, fw.py, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // 绽放：粒子按重力下落，二次爆裂在绽放后触发
        fw.burstT += 1 / 60;
        for (const p of fw.particles) {
          p.vy += fw.gravity * 0.12;
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 1 / 60;
        }
        if (fw.secondary && fw.burstT > 0.5 && !fw._secondary) {
          fw._secondary = true;
          this._explode(fw, fw.py, true);
        }
        ctx.globalCompositeOperation = 'lighter';
        for (const p of fw.particles) {
          if (p.life <= 0) continue;
          const a = Math.max(0, Math.min(1, p.life * 2));
          ctx.fillStyle = p.color;
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        fw.particles = fw.particles.filter(p => p.life > 0 && p.y < H + 20);
      }
    }

    this._raf = requestAnimationFrame(() => this._loop());
  }

  /** 爆炸：粒子球状扩散 */
  _explode(fw, y, secondary = false) {
    const n = secondary ? Math.floor(fw.particles * 0.4) : fw.particles;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (secondary ? 0.3 : 0);
      const sp = (secondary ? 1.5 : 2.5) + Math.random() * (secondary ? 2 : 4);
      fw.particles.push({
        x: fw.px,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0.8 + Math.random() * 1.4,
        r: 1.4 + Math.random() * 2.4,
        color: fw.color,
      });
    }
  }
}
