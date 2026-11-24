/**
 * render.js — 潮汐渲染引擎
 * 夜空月相、海面波浪与潮位曲线，潮水随潮位整体涨落。
 */
export class TideRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tide = null;
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

  setTide(tide) {
    this.tide = tide;
    this.t = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.tide) return;
    this.t += 1 / 60;
    const { ctx, W, H } = this;
    const T = this.tide;

    // 夜空
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#050914');
    sky.addColorStop(0.6, '#0a1424');
    sky.addColorStop(1, '#101c30');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 星点
    for (let i = 0; i < 90; i++) {
      const x = ((i * 37) % W) + Math.sin(this.t * 0.3 + i) * 0.6;
      const y = ((i * 53) % (H * 0.6));
      const tw = 0.4 + 0.6 * Math.sin(this.t * 1.5 + i * 0.7);
      ctx.fillStyle = `rgba(200, 220, 255, ${0.2 + tw * 0.3})`;
      ctx.fillRect(x, y, 1.4, 1.4);
    }

    // 月亮（月相：phase=0 新月全黑，0.5 满月全亮）
    const mx = T.moon.x * W, my = T.moon.y * H, mr = T.moon.r;
    ctx.save();
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#e8eef8';
    ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
    // 阴影：月相遮罩（椭圆偏移）
    ctx.fillStyle = '#050914';
    ctx.beginPath();
    ctx.ellipse(mx - mr * (T.phase - 0.5) * 2, my, mr, mr, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // 月晕
    const halo = ctx.createRadialGradient(mx, my, mr, mx, my, mr * 3.5);
    halo.addColorStop(0, 'rgba(200, 220, 255, 0.18)');
    halo.addColorStop(1, 'rgba(200, 220, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 潮位：当前时刻（循环取曲线中点附近）
    const idx = Math.floor((this.t * 0.02) % T.tide.length);
    const tideNow = T.tide[idx].level;
    const seaY = H * 0.58 - tideNow * 22;

    // 海面：多层正弦波叠加
    const { amp, freq, speed, sharp } = T.waves;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) {
      let y = seaY;
      for (let k = 0; k < 3; k++) {
        const a = amp / (1 + k * 0.6);
        const f = freq * (1 + k * 0.4);
        y += Math.sin(x * f + this.t * speed * (1 + k * 0.3) + k * 2.1) * a * (1 - k * 0.2);
      }
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    const sea = ctx.createLinearGradient(0, seaY, 0, H);
    sea.addColorStop(0, `rgba(${28 + sharp * 10}, ${60 + sharp * 20}, ${96 + sharp * 20}, 0.92)`);
    sea.addColorStop(1, 'rgba(8, 16, 28, 0.95)');
    ctx.fillStyle = sea;
    ctx.fill();
    // 波峰高光
    ctx.strokeStyle = 'rgba(160, 200, 235, 0.25)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 4) {
      let y = seaY;
      for (let k = 0; k < 3; k++) {
        const a = amp / (1 + k * 0.6);
        const f = freq * (1 + k * 0.4);
        y += Math.sin(x * f + this.t * speed * (1 + k * 0.3) + k * 2.1) * a * (1 - k * 0.2);
      }
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 潮位曲线（左下角小图）
    const gx = 18, gy = H - 92, gw = 170, gh = 62;
    ctx.fillStyle = 'rgba(6, 12, 22, 0.65)';
    ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeStyle = 'rgba(150, 190, 230, 0.3)';
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.beginPath();
    const lo = T.stats.minTide, hi = T.stats.maxTide;
    for (let i = 0; i < T.tide.length; i++) {
      const px = gx + (i / (T.tide.length - 1)) * gw;
      const py = gy + gh - ((T.tide[i].level - lo) / Math.max(0.001, hi - lo)) * gh;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(120, 200, 255, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(200, 220, 245, 0.55)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(`潮位曲线 · ${T.seasonLabel}`, gx, gy - 6);

    this._raf = requestAnimationFrame(() => this._loop());
  }
}
