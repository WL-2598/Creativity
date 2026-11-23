/**
 * render.js — 云图渲染引擎
 * 云海漂移、雨幕、闪电与雪落，一片会呼吸的天空。
 */
import { makeNoiseField } from './weather.js';

export class WeatherRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.weather = null;
    this.field = null;
    this.fieldW = 0;
    this.fieldH = 0;
    this.cloudOffset = 0;
    this.drops = [];
    this.snow = [];
    this.flashT = 0;          // 闪电余晖
    this.bolt = null;         // 当前闪电枝杈
    this.nextLightning = 3;
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

  setWeather(weather) {
    this.weather = weather;
    // 预渲染云场（双联以便无缝平移）
    const w = Math.ceil(this.W / 6), h = Math.ceil(this.H / 6);
    this.fieldW = w * 2;
    this.fieldH = h;
    this.field = makeNoiseField(weather.cloudSeed, this.fieldW, this.fieldH);
    this._cloudCanvas = document.createElement('canvas');
    this._cloudCanvas.width = this.fieldW;
    this._cloudCanvas.height = this.fieldH;
    const c = this._cloudCanvas.getContext('2d');
    for (let y = 0; y < this.fieldH; y++) {
      for (let x = 0; x < this.fieldW; x++) {
        const v = this.field[y * this.fieldW + x];
        if (v > 0.5) {
          c.fillStyle = weather.cloudColor.replace(/[\d.]+\)$/, `${(v - 0.5) * 0.9})`);
          c.fillRect(x * 6, y * 6, 7, 7);
        }
      }
    }
    // 雨滴与雪花
    const drops = Math.floor(weather.rainRate * 140);
    this.drops = Array.from({ length: drops }, () => ({
      x: Math.random() * this.W, y: Math.random() * this.H,
      len: 10 + Math.random() * 18, sp: 7 + Math.random() * 8,
    }));
    this.snow = Array.from({ length: Math.floor(weather.snow ? 120 : 0) }, () => ({
      x: Math.random() * this.W, y: Math.random() * this.H,
      r: 1 + Math.random() * 2.5, sp: 0.4 + Math.random() * 0.8,
      drift: (Math.random() - 0.5) * 0.6,
    }));
    this.nextLightning = 2 + Math.random() * 6;
    this.flashT = 0;
    this.bolt = null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.weather) return;
    const { ctx, W, H } = this;
    const w = this.weather;
    const dt = 1 / 60;
    this.cloudOffset += w.wind * dt * 14;

    // 天光
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    w.sky.forEach((c, i) => sky.addColorStop(i / (w.sky.length - 1), c));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 云海（无缝平移）
    if (this._cloudCanvas) {
      const scale = Math.max(W, this.fieldW);
      const ox = -(this.cloudOffset % this.fieldW);
      ctx.globalAlpha = 0.85;
      ctx.drawImage(this._cloudCanvas, ox, H * 0.18, this.fieldW * 1.5, this.fieldH * 1.5);
      ctx.drawImage(this._cloudCanvas, ox + this.fieldW, H * 0.18, this.fieldW * 1.5, this.fieldH * 1.5);
      ctx.globalAlpha = 1;
    }

    // 雨幕
    if (w.rainRate > 0.02) {
      ctx.strokeStyle = 'rgba(180, 200, 235, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const d of this.drops) {
        d.y += d.sp * dt * 10;
        d.x -= w.wind * d.sp * dt * 4;
        if (d.y > H) { d.y = -10; d.x = Math.random() * W + w.wind * 30; }
        if (d.x < -20) d.x = W + 10;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - w.wind * 3, d.y + d.len);
      }
      ctx.stroke();
    }

    // 雪
    if (w.snow) {
      ctx.fillStyle = 'rgba(240, 248, 255, 0.85)';
      for (const s of this.snow) {
        s.y += s.sp;
        s.x += s.drift + w.wind * 0.3;
        if (s.y > H) { s.y = -5; s.x = Math.random() * W; }
        if (s.x > W) s.x = 0; if (s.x < 0) s.x = W;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 闪电
    this.nextLightning -= dt;
    if (w.lightningRate > 0.02 && this.nextLightning <= 0) {
      this.flashT = 1;
      this.bolt = this._makeBolt();
      this.nextLightning = (6 - w.lightningRate * 5) + Math.random() * 6;
    }
    if (this.flashT > 0) {
      this.flashT -= dt * 4;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, this.flashT) * 0.35})`;
      ctx.fillRect(0, 0, W, H);
      if (this.bolt) {
        ctx.strokeStyle = `rgba(220, 235, 255, ${Math.max(0, this.flashT) * 2})`;
        ctx.lineWidth = 2.4;
        for (const line of this.bolt) {
          ctx.beginPath();
          line.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
          ctx.stroke();
        }
      }
      if (this.flashT <= 0) this.bolt = null;
    }

    // 远山轮廓，增添纵深
    ctx.fillStyle = 'rgba(4, 6, 12, 0.75)';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) {
      const y = H * 0.82 - Math.abs(Math.sin(x * 0.004 + 1.2)) * H * 0.08 - Math.sin(x * 0.013) * H * 0.03;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    this._raf = requestAnimationFrame(() => this._loop());
  }

  /** 生成一道闪电：主干 + 若干分杈（每条为独立折线） */
  _makeBolt() {
    const { W, H } = this;
    const spine = [];
    let x = W * (0.25 + Math.random() * 0.5);
    let y = 0;
    spine.push({ x, y });
    const branches = [];
    while (y < H * 0.75) {
      y += 18 + Math.random() * 26;
      x += (Math.random() - 0.5) * 46;
      spine.push({ x, y });
      if (Math.random() < 0.35 && spine.length > 3) {
        const start = spine[spine.length - 1];
        const bx = start.x + (Math.random() - 0.5) * 70;
        const by = start.y + 24 + Math.random() * 36;
        const line = [start];
        const dx = (bx - start.x) / 3, dy = (by - start.y) / 3;
        for (let i = 1; i <= 3; i++) {
          line.push({ x: start.x + dx * i + (Math.random() - 0.5) * 14, y: start.y + dy * i });
        }
        branches.push(line);
      }
    }
    return [spine, ...branches];
  }
}
