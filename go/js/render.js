/**
 * render.js — 棋境渲染引擎
 * 木纹棋盘、星位、黑白棋子与落子标记，静默成局。
 */
export class GoRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = null;
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

  setGame(game) {
    this.game = game;
    this.t = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.game) return;
    this.t += 1 / 60;
    const { ctx, W, H } = this;
    const g = this.game;

    // 木盘
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#6a4a2e');
    bg.addColorStop(0.5, '#7a5536');
    bg.addColorStop(1, '#5a3e26');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 棋盘
    const pad = Math.min(W, H) * 0.08;
    const board = Math.min(W, H) - pad * 2;
    const cell = board / (g.size - 1);
    const ox = (W - board) / 2, oy = (H - board) / 2;
    const px = (i) => ox + i * cell;

    // 网格线
    ctx.strokeStyle = 'rgba(30, 20, 12, 0.85)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < g.size; i++) {
      ctx.beginPath();
      ctx.moveTo(px(0), px(i));
      ctx.lineTo(px(g.size - 1), px(i));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px(i), px(0));
      ctx.lineTo(px(i), px(g.size - 1));
      ctx.stroke();
    }
    // 星位
    ctx.fillStyle = 'rgba(30, 20, 12, 0.9)';
    for (const [x, y] of g.stars) {
      ctx.beginPath();
      ctx.arc(px(x), px(y), cell * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }

    // 棋子：缓慢的落子微光
    g.stones.forEach((s, i) => {
      const cx = px(s.x), cy = px(s.y);
      const r = cell * 0.42;
      const pulse = i === g.stones.length - 1 ? 0.5 + 0.5 * Math.sin(this.t * 3) : 0;
      if (s.color === 'black') {
        const grd = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
        grd.addColorStop(0, '#6a6a72');
        grd.addColorStop(1, '#14141a');
        ctx.fillStyle = grd;
      } else {
        const grd = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
        grd.addColorStop(0, '#ffffff');
        grd.addColorStop(1, '#d8d0c0');
        ctx.fillStyle = grd;
      }
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(20, 14, 8, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (pulse > 0) {
        ctx.strokeStyle = `rgba(255, 220, 140, ${pulse * 0.7})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    this._raf = requestAnimationFrame(() => this._loop());
  }
}
