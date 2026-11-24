/**
 * render.js — 沙盘渲染引擎
 * 高度图分层着色，沙源持续落沙，沙粒在元胞法则下滑落堆积。
 */
import { stepSand } from './sand.js';

export class SandRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = null;
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

  setState(state) {
    this.state = state;
    this.t = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.state) return;
    this.t += 1 / 60;
    const { ctx, W, H } = this;
    const s = this.state;

    // 天光
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1a2230');
    sky.addColorStop(1, '#2a3342');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 沙源：顶部落沙（每帧从沙源列注入一格）
    if (Math.random() < 0.5) s.heights[s.source] = Math.min(s.height, s.heights[s.source] + 1);
    // 元胞推进
    stepSand(s);

    // 高度图渲染
    const cellW = W / s.width;
    const cellH = H / s.height;
    for (let x = 0; x < s.width; x++) {
      const top = H - s.heights[x] * cellH;
      const g = ctx.createLinearGradient(0, top, 0, H);
      // 高度越低越深：沙色分层
      const depth = s.heights[x] / s.height;
      g.addColorStop(0, `rgb(${228 - depth * 30}, ${190 - depth * 25}, ${120 - depth * 20})`);
      g.addColorStop(1, `rgb(${180 - depth * 30}, ${130 - depth * 20}, ${70 - depth * 15})`);
      ctx.fillStyle = g;
      ctx.fillRect(x * cellW, top, cellW + 0.6, H - top);
      // 顶面高光
      ctx.fillStyle = 'rgba(255, 240, 200, 0.35)';
      ctx.fillRect(x * cellW, top, cellW + 0.6, 1.5);
    }

    // 沙源标记
    ctx.fillStyle = 'rgba(255, 220, 160, 0.8)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(`沙源 ▼`, s.source * cellW - 14, 22);

    this._raf = requestAnimationFrame(() => this._loop());
  }
}
