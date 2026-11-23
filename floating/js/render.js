/**
 * render.js — 浮生渲染引擎
 * 玻璃瓶、水光、浮游、游鱼与水草的绘制。
 */
import { ORG_PLANKTON, ORG_FISH, ORG_PLANT } from './ecology.js';

const PALETTE = {
  water: ['#041421', '#0a2e44', '#12506b', '#3f97ad'],
  glow: '#b8f0ee',
  fish: ['#ffd9a0', '#ff9e6b', '#ff7a90', '#ffe9c9'],
  plant: ['#1e4d3a', '#2e7d5b', '#4aa87e', '#7de39a'],
};

export class EcoRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = null;
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

  setState(state) { this.state = state; }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  /* 瓶体几何 */
  _jar() {
    const { W, H } = this;
    const w = Math.min(W * 0.5, 420);
    const h = Math.min(H * 0.78, 560);
    return {
      x: (W - w) / 2, y: (H - h) / 2 + H * 0.06, w, h,
      r: w * 0.14,
    };
  }

  _loop() {
    if (!this.running) return;
    const { ctx, W, H } = this;
    const jar = this._jar();
    const ox = jar.x, oy = jar.y, ow = jar.w, oh = jar.h;

    // 背景
    ctx.fillStyle = '#03070f';
    ctx.fillRect(0, 0, W, H);

    // 瓶内水体
    ctx.save();
    this._roundRect(ctx, ox, oy, ow, oh, jar.r);
    ctx.clip();
    const water = ctx.createLinearGradient(0, oy, 0, oy + oh);
    water.addColorStop(0, 'rgba(10, 46, 68, 0.55)');
    water.addColorStop(0.5, 'rgba(8, 38, 58, 0.75)');
    water.addColorStop(1, 'rgba(4, 20, 33, 0.9)');
    ctx.fillStyle = water;
    ctx.fillRect(ox, oy, ow, oh);

    // 水面光斑
    const shimmer = ctx.createLinearGradient(0, oy, 0, oy + oh * 0.25);
    shimmer.addColorStop(0, `rgba(184, 240, 238, ${0.1 + Math.sin(this.state.t * 1.4) * 0.03})`);
    shimmer.addColorStop(1, 'rgba(184, 240, 238, 0)');
    ctx.fillStyle = shimmer;
    ctx.fillRect(ox, oy, ow, oh * 0.25);

    // 生物（坐标换算到瓶内）
    const scale = ow;
    const sx = x => ox + x * scale;
    const sy = y => oy + y * oh;
    for (const o of this.state.organisms) {
      const X = sx(o.x), Y = sy(o.y);
      if (o.type === ORG_PLANKTON) {
        ctx.globalAlpha = 0.5 + o.energy * 0.4;
        ctx.fillStyle = PALETTE.glow;
        ctx.beginPath();
        ctx.arc(X, Y, 1.2 + o.energy * 1.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (o.type === ORG_FISH) {
        this._drawFish(ctx, X, Y, o);
      } else if (o.type === ORG_PLANT) {
        this._drawPlant(ctx, X, Y, o, scale, oh);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // 玻璃瓶：轮廓 + 高光
    ctx.save();
    ctx.strokeStyle = 'rgba(184, 240, 238, 0.35)';
    ctx.lineWidth = 2.5;
    this._roundRect(ctx, ox, oy, ow, oh, jar.r);
    ctx.stroke();
    // 左侧高光
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(ox + ow * 0.14, oy + oh * 0.12);
    ctx.lineTo(ox + ow * 0.14, oy + oh * 0.82);
    ctx.stroke();
    // 瓶口
    ctx.strokeStyle = 'rgba(184, 240, 238, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(ox + ow / 2, oy - 8, ow * 0.22, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    this._raf = requestAnimationFrame(() => this._loop());
  }

  _drawFish(ctx, x, y, o) {
    const ang = Math.atan2(o.vy, o.vx);
    const len = 14 + o.size * 10;
    const wig = Math.sin(o.age * 12) * 0.25;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang + wig * 0.1);
    ctx.globalAlpha = 0.9;
    // 尾
    ctx.fillStyle = PALETTE.fish[1];
    ctx.beginPath();
    ctx.moveTo(-len * 0.4, 0);
    ctx.quadraticCurveTo(-len * 0.8, -len * 0.28 + wig * len * 0.3, -len * 0.85, wig * len * 0.4);
    ctx.quadraticCurveTo(-len * 0.7, 0, -len * 0.85, wig * len * 0.4 - len * 0.3);
    ctx.quadraticCurveTo(-len * 0.8, len * 0.28 + wig * len * 0.3, -len * 0.4, 0);
    ctx.fill();
    // 身
    const body = ctx.createLinearGradient(-len * 0.4, -len * 0.2, len * 0.4, len * 0.2);
    body.addColorStop(0, PALETTE.fish[2]);
    body.addColorStop(0.6, PALETTE.fish[0]);
    body.addColorStop(1, PALETTE.fish[3]);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, len * 0.45, len * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // 眼
    ctx.fillStyle = '#1c1a17';
    ctx.beginPath();
    ctx.arc(len * 0.26, -len * 0.04, len * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawPlant(ctx, x, y, o, scale, oh) {
    const strands = 4;
    ctx.save();
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < strands; i++) {
      const off = (i - strands / 2) * 5 * o.size;
      const sway = Math.sin(o.phase + i * 0.7) * 14 * o.size;
      const len = (40 + i * 6) * o.size;
      ctx.strokeStyle = i % 2 ? PALETTE.plant[1] : PALETTE.plant[2];
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x + off, y);
      ctx.quadraticCurveTo(x + off + sway * 0.5, y - len * 0.55, x + off + sway, y - len);
      ctx.stroke();
    }
    ctx.restore();
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

export { PALETTE };
