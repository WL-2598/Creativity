/**
 * render.js — 拓境渲染引擎
 * 纸纹、五类印版图案与套印错位，层层叠印成一幅版画。
 */
import { rngFromSeed } from '../../shared/rng.js';

export class PrintRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.print = null;
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

  setPrint(print) {
    this.print = print;
    this.t = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.print) return;
    this.t += 1 / 60;
    this._draw();
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _draw() {
    const { ctx, W, H } = this;
    const p = this.print;
    const ox = 36, oy = 36;
    const pw = W - ox * 2, ph = H - oy * 2;

    // 纸
    ctx.fillStyle = p.paper;
    ctx.fillRect(ox, oy, pw, ph);
    // 纸纹：细密噪点
    const rng = rngFromSeed(p.style.length * 7919 + 13);
    for (let i = 0; i < 900; i++) {
      const x = ox + rng() * pw, y = oy + rng() * ph;
      ctx.fillStyle = `rgba(120, 110, 90, ${0.02 + rng() * 0.05})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // 逐版套印（按 order：先浅后深）
    for (const idx of p.order) {
      const plate = p.plates[idx];
      ctx.save();
      ctx.translate(ox + pw * plate.offset.x, oy + ph * plate.offset.y);
      this._drawPlate(ctx, plate, pw, ph, idx);
      ctx.restore();
    }

    // 压痕框线
    ctx.strokeStyle = 'rgba(60, 50, 35, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox + 6, oy + 6, pw - 12, ph - 12);
    ctx.strokeStyle = 'rgba(60, 50, 35, 0.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(ox + 10, oy + 10, pw - 20, ph - 20);
  }

  /** 绘制一块印版的半调图案 */
  _drawPlate(ctx, plate, pw, ph, idx) {
    const rng = rngFromSeed((idx + 1) * 104729 + 17);
    const s = plate.scale;
    ctx.fillStyle = plate.ink;
    ctx.globalAlpha = 0.78;

    if (plate.type === 'dot') {
      const step = 14 * s;
      for (let y = 14; y < ph - 14; y += step) {
        for (let x = 14; x < pw - 14; x += step) {
          if (rng() < plate.density) {
            ctx.beginPath();
            ctx.arc(x + (rng() - 0.5) * 4, y + (rng() - 0.5) * 4, 1.4 + rng() * 1.6 * s, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    } else if (plate.type === 'line') {
      ctx.lineWidth = 1.3 * s;
      const step = 16 * s;
      for (let y = 14; y < ph - 14; y += step) {
        if (rng() < plate.density * 0.9 + 0.1) {
          ctx.beginPath();
          ctx.moveTo(14, y + (rng() - 0.5) * 6);
          ctx.lineTo(pw - 14, y + (rng() - 0.5) * 6);
          ctx.stroke();
        }
      }
    } else if (plate.type === 'wave') {
      ctx.lineWidth = 1.2 * s;
      const step = 20 * s;
      for (let y = 14; y < ph - 14; y += step) {
        if (rng() < plate.density * 0.9 + 0.1) {
          ctx.beginPath();
          for (let x = 14; x <= pw - 14; x += 6) {
            const yy = y + Math.sin((x / (16 * s)) + idx) * 5 * s;
            x === 14 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
          }
          ctx.stroke();
        }
      }
    } else if (plate.type === 'ring') {
      const rings = Math.max(3, Math.floor((Math.min(pw, ph) / (26 * s))));
      for (let i = 1; i <= rings; i++) {
        if (rng() < plate.density + 0.2) {
          const r = i * 22 * s;
          ctx.beginPath();
          ctx.arc(pw / 2, ph / 2, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    } else { // grid
      ctx.lineWidth = 1 * s;
      const step = 18 * s;
      for (let x = 14; x < pw - 14; x += step) {
        if (rng() < plate.density + 0.3) {
          ctx.beginPath();
          ctx.moveTo(x, 14);
          ctx.lineTo(x, ph - 14);
          ctx.stroke();
        }
      }
      for (let y = 14; y < ph - 14; y += step) {
        if (rng() < plate.density + 0.3) {
          ctx.beginPath();
          ctx.moveTo(14, y);
          ctx.lineTo(pw - 14, y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}
