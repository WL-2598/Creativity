/**
 * render.js — 织理渲染引擎
 * 编织的经纬纱线、瓷砖马赛克、曼陀罗放射图案。
 */
export class TextureRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pattern = null;
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

  setPattern(pattern) {
    this.pattern = pattern;
    this.t = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.pattern) return;
    this.t += 1 / 60;
    const { ctx, W, H } = this;
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, W, H);

    if (this.pattern.kind === 'weave') this._drawWeave(W, H);
    else if (this.pattern.kind === 'tile') this._drawTile(W, H);
    else this._drawMandala(W, H);

    this._raf = requestAnimationFrame(() => this._loop());
  }

  /** 编织：经纬纱线交织，凸起的纱线立体感 */
  _drawWeave(W, H, cell = 46) {
    const { ctx } = this;
    const p = this.pattern;
    const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
    const cx = (W - cols * cell) / 2, cy = (H - rows * cell) / 2;
    ctx.fillStyle = p.colors.ground;
    ctx.fillRect(cx - 10, cy - 10, cols * cell + 20, rows * cell + 20);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const on = p.cells[Math.min(y, p.size - 1)][Math.min(x, p.size - 1)];
        const px = cx + x * cell, py = cy + y * cell;
        // 纬线（横向）
        ctx.fillStyle = on ? p.colors.weft : shade(p.colors.weft, 0.7);
        ctx.fillRect(px, py + cell * 0.25, cell, cell * 0.5);
        // 经线（纵向）
        ctx.fillStyle = on ? shade(p.colors.warp, 0.75) : p.colors.warp;
        ctx.fillRect(px + cell * 0.25, py, cell * 0.5, cell);
        // 交织处的凸起高光
        if (on) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.fillRect(px + cell * 0.28, py + cell * 0.28, cell * 0.44, cell * 0.44);
        }
      }
    }
    // 纱线光泽：缓慢移动的斜向高光
    const g = ctx.createLinearGradient(cx, cy + (this.t * 30) % (rows * cell), cx + cols * cell, cy + rows * cell);
    g.addColorStop(0, 'rgba(255, 255, 255, 0)');
    g.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx, cy, cols * cell, rows * cell);
  }

  /** 瓷砖：四种形状的马赛克镶嵌 */
  _drawTile(W, H, cell = 76) {
    const { ctx } = this;
    const p = this.pattern;
    const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
    const cx = (W - cols * cell) / 2, cy = (H - rows * cell) / 2;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const v = p.cells[Math.min(y, p.size - 1)][Math.min(x, p.size - 1)];
        const px = cx + x * cell, py = cy + y * cell;
        const col = p.palette[(v - 1) % p.palette.length];
        ctx.fillStyle = col;
        ctx.beginPath();
        if (v === 1) {
          ctx.rect(px + 2, py + 2, cell - 4, cell - 4);
        } else if (v === 2) {
          ctx.moveTo(px + cell / 2, py + 2);
          ctx.lineTo(px + cell - 2, py + cell / 2);
          ctx.lineTo(px + cell / 2, py + cell - 2);
          ctx.lineTo(px + 2, py + cell / 2);
        } else if (v === 3) {
          ctx.moveTo(px + cell / 2, py + 2);
          ctx.lineTo(px + cell - 2, py + cell * 0.35);
          ctx.lineTo(px + cell * 0.7, py + cell - 2);
          ctx.lineTo(px + 2, py + cell * 0.65);
        } else {
          ctx.arc(px + cell / 2, py + cell / 2, cell * 0.32, 0, Math.PI * 2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }

  /** 曼陀罗：旋转对称的分层放射图案 */
  _drawMandala(W, H) {
    const { ctx } = this;
    const p = this.pattern;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.42;
    const breathe = 1 + Math.sin(this.t * 0.8) * 0.02;

    // 背景光晕
    const halo = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.15);
    halo.addColorStop(0, 'rgba(40, 30, 50, 0.5)');
    halo.addColorStop(1, 'rgba(10, 12, 18, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    for (let l = 0; l < p.rings.length; l++) {
      const ring = p.rings[l];
      const r = R * ring.radius * breathe;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = ring.color;
      ctx.fillStyle = ring.color;
      ctx.lineWidth = 2;
      for (let i = 0; i < ring.symmetry; i++) {
        const a = (i / ring.symmetry) * Math.PI * 2;
        ctx.save();
        ctx.rotate(a);
        if (ring.element === 'petal') {
          ctx.beginPath();
          ctx.ellipse(r * 0.75, 0, r * 0.28, r * 0.1, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(r * 0.75, 0, r * 0.09, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      // 同心圈
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // 中心点
    ctx.fillStyle = p.palette[2 % p.palette.length];
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.05 * breathe, 0, Math.PI * 2);
    ctx.fill();
  }
}

function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `rgb(${r},${g},${b})`;
}
