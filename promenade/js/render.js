/**
 * render.js — 回廊渲染引擎
 * 透视长廊：灭点、双侧柱列、拱券与光束，随时间缓缓前行。
 */
export class PromenadeRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hall = null;
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

  setHall(hall) {
    this.hall = hall;
    this.t = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.hall) return;
    this.t += 1 / 60;
    const { ctx, W, H } = this;
    const h = this.hall;
    const T = h.floors;

    // 纵深 → 屏幕：远点（灭点）到近点（底部）
    const vx = h.vanish.x * W, vy = h.vanish.y * H;
    const nearY = H * 0.98;
    const proj = (depth) => {
      const k = Math.pow(depth, 0.85);           // 近大远小
      const y = vy + (nearY - vy) * k;
      const spread = W * 0.5 * (0.12 + 0.88 * k);
      return { y, spread };
    };

    // 地面与天顶
    ctx.fillStyle = T.floor;
    ctx.beginPath();
    ctx.moveTo(vx - W * 0.02, vy);
    ctx.lineTo(vx + W * 0.02, vy);
    ctx.lineTo(W + W * 0.1, H);
    ctx.lineTo(-W * 0.1, H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = T.ceil;
    ctx.beginPath();
    ctx.moveTo(vx - W * 0.02, vy);
    ctx.lineTo(vx + W * 0.02, vy);
    ctx.lineTo(W + W * 0.1, H * 0.1);
    ctx.lineTo(-W * 0.1, H * 0.1);
    ctx.closePath();
    ctx.fill();

    // 光束：从灭点方向射入
    const la = h.light.angle;
    for (let i = 0; i < 3; i++) {
      const a = la + i * 0.28 + this.t * 0.05;
      const len = Math.max(W, H) * 1.4;
      const g = ctx.createLinearGradient(
        vx, vy,
        vx + Math.cos(a) * len, vy + Math.sin(a) * len
      );
      g.addColorStop(0, `rgba(255, 240, 210, ${0.1 + h.light.strength * 0.06})`);
      g.addColorStop(1, 'rgba(255, 240, 210, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      ctx.lineTo(vx + Math.cos(a - 0.06) * len, vy + Math.sin(a - 0.06) * len);
      ctx.lineTo(vx + Math.cos(a + 0.06) * len, vy + Math.sin(a + 0.06) * len);
      ctx.closePath();
      ctx.fill();
    }

    // 拱券（按纵深排序，远的先画）
    const arches = h.arches.map(a => ({ ...a, depth: (a.depth + this.t * 0.02) % 1 }))
      .sort((a, b) => a.depth - b.depth);
    for (const arch of arches) {
      const { y, spread } = proj(arch.depth);
      const cx = vx;
      const half = spread * arch.span;
      ctx.strokeStyle = `rgba(${hexToRgb(T.column)}, ${0.5 + 0.4 * arch.depth})`;
      ctx.lineWidth = Math.max(1, 3 * (0.3 + 0.7 * arch.depth));
      ctx.beginPath();
      ctx.ellipse(cx, y - arch.height * H, half, arch.height * H * 2, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    }

    // 柱列（按纵深排序，远的先画）
    const cols = h.columns.map(c => ({ ...c, depth: (c.depth + this.t * 0.03) % 1 }))
      .sort((a, b) => a.depth - b.depth);
    for (const col of cols) {
      const { y, spread } = proj(col.depth);
      const cx = vx + col.side * spread * 0.92;
      const w = col.width * W * (0.3 + 0.7 * col.depth);
      const hh = col.height * H * (0.3 + 0.7 * col.depth);
      const top = y - hh;
      const shade = Math.max(0.25, Math.min(1, col.shade * (0.4 + 0.6 * col.depth)));
      ctx.fillStyle = shadeColor(T.column, shade);
      ctx.fillRect(cx - w / 2, top, w, hh);
      // 柱头柱础
      ctx.fillRect(cx - w / 2 - w * 0.2, top, w * 1.4, w * 0.35);
      ctx.fillRect(cx - w / 2 - w * 0.2, y - w * 0.35, w * 1.4, w * 0.35);
      // 受光边
      ctx.fillStyle = `rgba(255, 240, 210, ${0.12 * col.depth})`;
      ctx.fillRect(cx - w / 2, top, w * 0.3, hh);
    }

    // 地面光影渐变
    const floor = ctx.createLinearGradient(0, vy, 0, H);
    floor.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
    floor.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    ctx.fillStyle = floor;
    ctx.fillRect(0, vy, W, H - vy);

    this._raf = requestAnimationFrame(() => this._loop());
  }
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function shadeColor(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `rgb(${r},${g},${b})`;
}
