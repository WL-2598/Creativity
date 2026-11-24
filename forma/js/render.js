/**
 * render.js — 形境渲染引擎
 * 植物的笔法线段、叶花标记、生长动画与风摇。
 */
import { plantBounds } from './lsystem.js';

const PALETTES = {
  forest: { name: '林夜', branch: '#3d5a3a', leaf: '#7de39a', flower: '#ff8fc9', grass: '#a8e07a', bg1: '#07120b', bg2: '#030806' },
  bloom:  { name: '花辰', branch: '#4a3550', leaf: '#9fe8c0', flower: '#ffb0d8', grass: '#c8f0a0', bg1: '#120a16', bg2: '#070409' },
  gold:   { name: '金秋', branch: '#5a4a2a', leaf: '#e8c87a', flower: '#ff9e6b', grass: '#f0d890', bg1: '#141008', bg2: '#080603' },
  ink:    { name: '墨林', branch: '#4a4a52', leaf: '#9aa0b4', flower: '#cfd4e0', grass: '#b8c0d0', bg1: '#0c0d12', bg2: '#05060a' },
};

export class PlantRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.plant = null;
    this.paletteKey = 'forest';
    this.growT = 0;
    this.wind = 0.5;
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

  setPlant(plant) {
    this.plant = plant;
    this.growT = 0;
  }
  setPalette(key) { this.paletteKey = key; }
  setWind(v) { this.wind = v; }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running) return;
    const { ctx, W, H } = this;
    this.growT = Math.min(1, this.growT + 0.014);
    const t = performance.now() / 1000;

    // 背景
    const pal = PALETTES[this.paletteKey];
    const bg = ctx.createRadialGradient(W / 2, H * 0.55, 0, W / 2, H * 0.55, Math.max(W, H) * 0.7);
    bg.addColorStop(0, pal.bg1);
    bg.addColorStop(1, pal.bg2);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (this.plant) {
      const { segments, markers, order } = this.plant;
      const b = plantBounds(this.plant);
      const margin = Math.min(W, H) * 0.1;
      const scale = Math.min((W - margin * 2) / Math.max(1, b.maxX - b.minX),
                             (H - margin * 2) / Math.max(1, b.maxY - b.minY));
      const ox = (W - (b.maxX - b.minX) * scale) / 2 - b.minX * scale;
      const oy = H * 0.9 - (b.maxY - b.minY) * scale * 0.9 - b.minY * scale;
      const map = (px, py) => ({
        x: ox + px * scale + Math.sin(t * 1.1 + px * 0.012) * this.wind * 8 * (1 + py * 0.004),
        y: oy + py * scale,
      });

      const revealed = Math.floor(this.growT * (order || 1));

      // 枝干
      ctx.lineCap = 'round';
      for (const s of segments) {
        if (s.order >= revealed) continue;
        const a = map(s.x1, s.y1), b2 = map(s.x2, s.y2);
        ctx.strokeStyle = pal.branch;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = s.width;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b2.x, b2.y);
        ctx.stroke();
      }

      // 叶花
      for (const m of markers) {
        if (m.order >= revealed) continue;
        const p = map(m.x, m.y);
        const col = m.type === 'flower' ? pal.flower : m.type === 'grass' ? pal.grass : pal.leaf;
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.9;
        if (m.type === 'flower') {
          // 花瓣
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 + t * 0.2;
            ctx.beginPath();
            ctx.ellipse(p.x + Math.cos(a) * m.size, p.y + Math.sin(a) * m.size, m.size * 0.7, m.size * 0.4, a, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#fff3c0';
          ctx.beginPath();
          ctx.arc(p.x, p.y, m.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (m.type === 'grass') {
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, m.size * 0.35, m.size * 1.1, 0.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, m.size * 0.9, m.size * 0.5, t * 0.5 + m.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    this._raf = requestAnimationFrame(() => this._loop());
  }
}

export { PALETTES };
