/**
 * render.js — 茶境渲染引擎
 * 席布、茶壶、茶盏、茶托、香炉、花插与茶点，热气袅袅。
 */
export class TeaRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.set = null;
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

  setSet(set) {
    this.set = set;
    this.t = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.set) return;
    this.t += 1 / 60;
    const { ctx, W, H } = this;
    const S = this.set;

    // 环境
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1a1612');
    bg.addColorStop(1, '#0e0c0a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 席布（圆角矩形）
    const cx = W * 0.5, cy = H * 0.52;
    const cw = W * 0.78, ch = H * 0.62;
    ctx.fillStyle = S.clothColor;
    this._roundRect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 24);
    ctx.fill();
    // 席布纹
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - cw / 2, cy - ch / 2 + (ch / 6) * i);
      ctx.lineTo(cx + cw / 2, cy - ch / 2 + (ch / 6) * i);
      ctx.stroke();
    }

    // 器物（按 y 排序，远的先画）
    const items = [...S.vessels].sort((a, b) => a.y - b.y);
    for (const v of items) {
      this._drawVessel(v);
    }
    for (const sw of S.sweets) {
      this._drawSweet(sw);
    }

    // 热气：壶口与香炉
    this._drawSteam(S.vessels.find(v => v.type === 'teapot'), 0.6);
    this._drawSteam(S.vessels.find(v => v.type === 'censer'), 0.4);

    this._raf = requestAnimationFrame(() => this._loop());
  }

  _drawVessel(v) {
    const { ctx, W, H } = this;
    const x = v.x * W, y = v.y * H, r = v.r * Math.min(W, H);
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, shade(v.glazeColor ?? '#8ab89a', 1.25));
    g.addColorStop(1, shade(v.glazeColor ?? '#8ab89a', 0.7));
    if (v.type === 'teapot') {
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
      // 壶嘴与盖
      ctx.beginPath();
      ctx.moveTo(x + r * 0.8, y - r * 0.1);
      ctx.quadraticCurveTo(x + r * 1.5, y - r * 0.5, x + r * 1.3, y + r * 0.2);
      ctx.lineTo(x + r * 0.9, y + r * 0.3);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.85, r * 0.5, r * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 240, 220, 0.25)';
      ctx.beginPath();
      ctx.arc(x, y - r * 0.85, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    } else if (v.type === 'cup') {
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(60, 40, 20, 0.55)';
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.7, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (v.type === 'coaster') {
      ctx.fillStyle = 'rgba(90, 70, 50, 0.6)';
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (v.type === 'censer') {
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(40, 30, 20, 0.8)';
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.3, r * 0.5, r * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (v.type === 'vase') {
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - r * 0.4, y + r * 0.5);
      ctx.quadraticCurveTo(x - r * 0.7, y - r * 0.2, x - r * 0.25, y - r * 0.7);
      ctx.lineTo(x + r * 0.25, y - r * 0.7);
      ctx.quadraticCurveTo(x + r * 0.7, y - r * 0.2, x + r * 0.4, y + r * 0.5);
      ctx.closePath();
      ctx.fill();
      // 一枝花
      ctx.strokeStyle = 'rgba(140, 170, 110, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - r * 0.6);
      ctx.quadraticCurveTo(x + r * 0.4, y - r * 1.4, x + r * 0.2, y - r * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(230, 150, 170, 0.9)';
      ctx.beginPath();
      ctx.arc(x + r * 0.2, y - r * 2, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawSweet(sw) {
    const { ctx, W, H } = this;
    const x = sw.x * W, y = sw.y * H, r = sw.r * Math.min(W, H);
    ctx.fillStyle = 'rgba(220, 200, 160, 0.5)';
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.6, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(180, 120, 80, 0.85)';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawSteam(v, intensity) {
    if (!v) return;
    const { ctx, W, H } = this;
    const x = v.x * W, y = v.y * H - v.r * Math.min(W, H) * 0.8;
    for (let i = 0; i < 3; i++) {
      const off = i * 8;
      const sway = Math.sin(this.t * 1.2 + i + v.x * 10) * 10;
      const g = ctx.createLinearGradient(x + off, y, x + off + sway, y - 60);
      g.addColorStop(0, `rgba(230, 230, 235, ${0.18 * intensity})`);
      g.addColorStop(1, 'rgba(230, 230, 235, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x + off + sway * 0.5, y - 30, 6, 26, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * factor));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * factor));
  const b = Math.min(255, Math.round((n & 255) * factor));
  return `rgb(${r},${g},${b})`;
}
