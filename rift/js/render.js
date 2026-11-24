/**
 * render.js — 裂隙渲染引擎
 * 地形图的绘制：高程色带、等高线、水系、林雪与图框。
 * 三种风格：墨线 / 彩图 / 夜图。
 */
import { CONTOUR_LEVELS } from './terrain.js';

const ELEVATION_RAMP = ['#f4efe2', '#e8dcc0', '#c9b48a', '#a8916a', '#7d6a55', '#54473d', '#3a312c', '#241f1e'];

const STYLE_BG = {
  ink:    { bg: '#f2ede2', line: 'rgba(40,34,28,0.75)', river: 'rgba(40,70,110,0.7)', snow: 'rgba(255,255,255,0.85)', forest: 'rgba(60,80,50,0.55)' },
  color:  { bg: '#e9e2d2', line: 'rgba(50,40,30,0.4)', river: 'rgba(40,90,140,0.75)', snow: 'rgba(255,255,255,0.9)', forest: 'rgba(45,70,40,0.5)' },
  night:  { bg: '#0a0e1a', line: 'rgba(120,180,255,0.5)', river: 'rgba(90,180,255,0.75)', snow: 'rgba(220,240,255,0.6)', forest: 'rgba(90,150,90,0.4)' },
};

export class RiftRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.terrain = null;
    this.rivers = [];
    this.styleKey = 'ink';
    this.pan = 0;
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

  setTerrain(terrain, rivers) {
    this.terrain = terrain;
    this.rivers = rivers || [];
  }
  setStyle(key) { this.styleKey = key; }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  /** 地形网格到画布的映射（留边距，缓慢平移） */
  _map() {
    const { W, H } = this;
    const margin = Math.min(W, H) * 0.08;
    const tw = W - margin * 2, th = H - margin * 2;
    const scale = Math.min(tw / this.terrain.width, th / this.terrain.height);
    const ox = (W - this.terrain.width * scale) / 2;
    const oy = (H - this.terrain.height * scale) / 2;
    const sx = x => ox + x * scale;
    const sy = y => oy + y * scale;
    return { sx, sy, scale };
  }

  _loop() {
    if (!this.running || !this.terrain) return;
    this.pan += 0.002;
    this._draw();
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _draw() {
    const { ctx, W, H } = this;
    const S = STYLE_BG[this.styleKey];
    const { width: tw, height: th, grid } = this.terrain;
    const { sx, sy } = this._map();

    // 背景
    ctx.fillStyle = S.bg;
    ctx.fillRect(0, 0, W, H);

    // 高程色带
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        const h = grid[y * tw + x];
        const idx = Math.min(ELEVATION_RAMP.length - 1, Math.floor(h * ELEVATION_RAMP.length));
        ctx.fillStyle = ELEVATION_RAMP[idx];
        ctx.fillRect(sx(x), sy(y), Math.ceil(sx(x + 1) - sx(x)) + 0.6, Math.ceil(sy(y + 1) - sy(y)) + 0.6);
      }
    }

    // 雪线
    if (this.styleKey !== 'night') {
      ctx.fillStyle = S.snow;
      for (let y = 0; y < th; y += 2) {
        for (let x = 0; x < tw; x += 2) {
          if (grid[y * tw + x] > 0.82) {
            ctx.fillRect(sx(x), sy(y), sx(x + 2) - sx(x), sy(y + 2) - sy(y));
          }
        }
      }
    }

    // 林点
    ctx.fillStyle = S.forest;
    for (let y = 2; y < th; y += 3) {
      for (let x = 2; x < tw; x += 3) {
        const h = grid[y * tw + x];
        if (h > 0.28 && h < 0.68) {
          const px = sx(x) + ((x * 7 + y * 13) % 5) * 0.6;
          const py = sy(y) + ((x * 11 + y * 5) % 5) * 0.6;
          ctx.beginPath();
          ctx.arc(px, py, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 等高线（marching squares 简化）
    ctx.strokeStyle = S.line;
    ctx.lineWidth = 0.9;
    for (const level of CONTOUR_LEVELS) {
      ctx.beginPath();
      for (let y = 0; y < th - 1; y++) {
        for (let x = 0; x < tw - 1; x++) {
          this._cellContour(ctx, grid, tw, x, y, level, sx, sy);
        }
      }
      ctx.stroke();
    }

    // 水系
    ctx.strokeStyle = S.river;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const river of this.rivers) {
      ctx.beginPath();
      river.points.forEach((p, i) => {
        const X = sx(p.x) + Math.sin(this.pan * 2 + p.x * 0.5) * 0.6;
        const Y = sy(p.y) + Math.cos(this.pan * 2 + p.y * 0.5) * 0.6;
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      });
      ctx.stroke();
    }

    // 图框与罗盘
    this._cartouche(ctx, W, H, S);
  }

  /** 单元格内的等高线段 */
  _cellContour(ctx, grid, tw, x, y, level, sx, sy) {
    const h00 = grid[y * tw + x];
    const h10 = grid[y * tw + x + 1];
    const h11 = grid[(y + 1) * tw + x + 1];
    const h01 = grid[(y + 1) * tw + x];
    const pts = [];
    const cross = (a, b, px, py, qx, qy) => {
      if ((a - level) * (b - level) < 0) {
        const t = (level - a) / (b - a);
        return { x: px + t * (qx - px), y: py + t * (qy - py) };
      }
      return null;
    };
    const c1 = cross(h00, h10, sx(x), sy(y), sx(x + 1), sy(y));        // 上
    const c2 = cross(h10, h11, sx(x + 1), sy(y), sx(x + 1), sy(y + 1)); // 右
    const c3 = cross(h11, h01, sx(x + 1), sy(y + 1), sx(x), sy(y + 1)); // 下
    const c4 = cross(h01, h00, sx(x), sy(y + 1), sx(x), sy(y));         // 左
    const cs = [c1, c2, c3, c4].filter(Boolean);
    if (cs.length === 2) {
      ctx.moveTo(cs[0].x, cs[0].y);
      ctx.lineTo(cs[1].x, cs[1].y);
    } else if (cs.length === 4) {
      ctx.moveTo(cs[0].x, cs[0].y); ctx.lineTo(cs[2].x, cs[2].y);
      ctx.moveTo(cs[1].x, cs[1].y); ctx.lineTo(cs[3].x, cs[3].y);
    }
  }

  _cartouche(ctx, W, H, S) {
    const { terrain } = this;
    ctx.save();
    ctx.strokeStyle = S.line;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(16, 16, 132, 64);
    ctx.fillStyle = S.line;
    ctx.font = '600 13px "Songti SC", "STSong", serif';
    ctx.fillText(`裂隙 · 种子 ${terrain.seed}`, 28, 40);
    ctx.font = '10px "Songti SC", "STSong", serif';
    ctx.globalAlpha = 0.8;
    ctx.fillText(`等高线 ${CONTOUR_LEVELS.length} 级 · 水系 ${this.rivers.length}`, 28, 58);
    ctx.globalAlpha = 1;
    // 罗盘
    const cx = W - 46, cy = 46;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = S.line;
    ctx.font = '600 11px "Songti SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText('北', cx, cy - 6);
    ctx.beginPath();
    ctx.moveTo(cx, cy + 8);
    ctx.lineTo(cx - 5, cy + 16);
    ctx.lineTo(cx, cy + 13);
    ctx.lineTo(cx + 5, cy + 16);
    ctx.closePath();
    ctx.fill();
    ctx.textAlign = 'start';
    ctx.restore();
  }
}
