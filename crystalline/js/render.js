/**
 * render.js — 晶境渲染引擎
 * 矿晶色面、晶界辉光与生长动画，如晶体在暗处缓缓结晶。
 */
import { crystalStats } from './crystal.js';

const MINERAL_PALETTES = {
  amethyst: { name: '紫晶', base: ['#2a1240', '#4a2270', '#7a46a8', '#b088d8', '#e0c8f5'], edge: '#e8d8ff' },
  sapphire: { name: '蓝玉', base: ['#06182e', '#0d3a5c', '#1f6f9c', '#4aa8d8', '#a8e0f5'], edge: '#d8f0ff' },
  amber:    { name: '琥珀', base: ['#241505', '#4a2e0d', '#8a5a1f', '#d89a4a', '#f5d8a8'], edge: '#ffe9c0' },
  jade:     { name: '翠玉', base: ['#052018', '#0d4530', '#1f7a55', '#4aa87e', '#b8e8c8'], edge: '#d8ffe8' },
};

export class CrystalRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.result = null;
    this.paletteKey = 'amethyst';
    this.revealT = 0;      // 生长动画进度
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

  setScene(result) {
    this.result = result;
    this.revealT = 0;
  }
  setPalette(key) { this.paletteKey = key; }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running) return;
    const { ctx, W, H } = this;
    this.revealT = Math.min(1, this.revealT + 0.012);
    const t = performance.now() / 1000;

    // 深绒底
    const bg = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.5, Math.max(W, H) * 0.7);
    bg.addColorStop(0, '#0c0a16');
    bg.addColorStop(1, '#050409');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (this.result) {
      const { grid, order, width, height } = this.result;
      const cell = Math.min(W / width, H / height);
      const ox = (W - width * cell) / 2;
      const oy = (H - height * cell) / 2;
      const total = order.length;
      const revealed = Math.floor(this.revealT * total);
      const pal = MINERAL_PALETTES[this.paletteKey];

      // 晶面：已生长的格子
      for (let i = 0; i < grid.length; i++) {
        const g = grid[i];
        if (g === 0 || order[i] >= revealed) continue;
        const x = ox + (i % width) * cell;
        const y = oy + Math.floor(i / width) * cell;
        // 颜色随簇与位置微变
        const lvl = Math.min(pal.base.length - 1, 1 + Math.floor(((g * 7 + i * 3) % 5) / 1.4));
        const bright = 0.55 + 0.35 * Math.sin(t * 1.1 + i * 0.35);
        ctx.globalAlpha = 0.72 * bright;
        ctx.fillStyle = pal.base[lvl];
        ctx.fillRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
      }

      // 晶界：相邻不同簇之间画亮线
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = pal.edge;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = y * width + x;
          if (grid[i] === 0 || order[i] >= revealed) continue;
          const px = ox + x * cell, py = oy + y * cell;
          if (x + 1 < width && grid[i + 1] !== 0 && grid[i + 1] !== grid[i] && order[i + 1] < revealed) {
            ctx.moveTo(px + cell, py + 1); ctx.lineTo(px + cell, py + cell - 1);
          }
          if (y + 1 < height && grid[i + width] !== 0 && grid[i + width] !== grid[i] && order[i + width] < revealed) {
            ctx.moveTo(px + 1, py + cell); ctx.lineTo(px + cell - 1, py + cell);
          }
        }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // 新生晶格的辉光脉冲
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < grid.length; i++) {
        if (grid[i] === 0) continue;
        const o = order[i];
        const age = this.revealT * total - o;
        if (age >= 0 && age < 24) {
          const x = ox + (i % width) * cell + cell / 2;
          const y = oy + Math.floor(i / width) * cell + cell / 2;
          const fade = 1 - age / 24;
          ctx.globalAlpha = fade * 0.5;
          ctx.fillStyle = pal.edge;
          ctx.beginPath();
          ctx.arc(x, y, cell * 0.9 * fade, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // 闪烁的晶面微光
      for (let i = 0; i < grid.length; i += 7) {
        if (grid[i] === 0) continue;
        const x = ox + (i % width) * cell + cell / 2;
        const y = oy + Math.floor(i / width) * cell + cell / 2;
        if (Math.sin(t * 3 + i * 0.7) > 0.92) {
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(x, y, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    this._raf = requestAnimationFrame(() => this._loop());
  }
}

export { MINERAL_PALETTES, crystalStats };
