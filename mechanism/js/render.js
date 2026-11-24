/**
 * render.js — 机枢渲染引擎
 * 逐齿绘制啮合齿轮、摆动的钟摆，以及飞转的指针。
 */
export class MechanismRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mech = null;
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

  setMechanism(mech) {
    this.mech = mech;
    this.t = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.mech) return;
    const { ctx, W, H } = this;
    this.t += 1 / 60;

    // 背景：深铜色机房
    ctx.fillStyle = '#0d0f14';
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * 0.5, H * 0.35, 40, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(58, 66, 84, 0.55)');
    g.addColorStop(1, 'rgba(8, 9, 12, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 先算布局偏移，使整组齿轮居中
    const { gears, pendulum } = this.mech;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const gr of gears) {
      minX = Math.min(minX, gr.x - gr.radius); maxX = Math.max(maxX, gr.x + gr.radius);
      minY = Math.min(minY, gr.y - gr.radius); maxY = Math.max(maxY, gr.y + gr.radius);
    }
    const offX = (W - (maxX - minX)) / 2 - minX;
    const offY = (H - (maxY - minY)) / 2 - minY - 30;

    // 机架底板
    ctx.strokeStyle = 'rgba(160, 170, 190, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(minX + offX - 26, minY + offY - 26, maxX - minX + 52, maxY - minY + 52);
    ctx.stroke();

    // 齿轮（铜色系，深浅交替）
    const palettes = ['#b9c4d4', '#a8b3c6', '#c3ccd8', '#9aa6b8'];
    for (const gr of gears) {
      this._drawGear(gr, offX, offY, palettes[gr.index % palettes.length]);
    }

    // 摆锤
    if (pendulum) {
      const angle = pendulum.amp * Math.sin(this.t * 2.4 + pendulum.phase);
      const px = gears[gears.length - 1].x + offX;
      const py = gears[gears.length - 1].y + offY - 40;
      const ex = px + Math.sin(angle) * pendulum.length;
      const ey = py + Math.cos(angle) * pendulum.length;
      ctx.strokeStyle = 'rgba(190, 200, 220, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.fillStyle = '#d8a85a';
      ctx.beginPath();
      ctx.arc(ex, ey, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 220, 150, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(160, 170, 190, 0.5)';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    this._raf = requestAnimationFrame(() => this._loop());
  }

  /** 绘制单个齿轮：逐齿梯形 + 轮毂 + 辐条 */
  _drawGear(gr, offX, offY, palette = '#b9c4d4') {
    const { ctx } = this;
    const cx = gr.x + offX;
    const cy = gr.y + offY;
    const rot = gr.phase + this.t * gr.speed;
    const rIn = gr.radius * 0.78;   // 齿根
    const rOut = gr.radius;         // 齿顶
    const toothAngle = (Math.PI * 2) / gr.teeth;
    const toothW = toothAngle * 0.5;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    // 轮体
    ctx.fillStyle = palette;
    ctx.beginPath();
    ctx.arc(0, 0, rIn, 0, Math.PI * 2);
    ctx.fill();

    // 齿
    ctx.beginPath();
    for (let i = 0; i < gr.teeth; i++) {
      const a = i * toothAngle;
      const a1 = a - toothW * 0.45, a2 = a + toothW * 0.45;
      const a3 = a + toothW * 0.75, a4 = (a + toothAngle) - toothW * 0.75;
      ctx.lineTo(Math.cos(a1) * rIn, Math.sin(a1) * rIn);
      ctx.lineTo(Math.cos(a2) * rOut, Math.sin(a2) * rOut);
      ctx.lineTo(Math.cos(a3) * rOut, Math.sin(a3) * rOut);
      ctx.lineTo(Math.cos(a4) * rIn, Math.sin(a4) * rIn);
    }
    ctx.closePath();
    ctx.fill();

    // 轮缘高光
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 辐条
    ctx.strokeStyle = 'rgba(10, 12, 18, 0.5)';
    ctx.lineWidth = gr.radius * 0.1;
    for (let i = 0; i < 4; i++) {
      const a = i * (Math.PI / 2) + 0.3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * rIn * 0.4, Math.sin(a) * rIn * 0.4);
      ctx.lineTo(Math.cos(a) * rIn * 0.95, Math.sin(a) * rIn * 0.95);
      ctx.stroke();
    }

    // 轮毂
    ctx.fillStyle = '#2a3038';
    ctx.beginPath();
    ctx.arc(0, 0, rIn * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8a85a';
    ctx.beginPath();
    ctx.arc(0, 0, rIn * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 齿轮标签
    ctx.fillStyle = 'rgba(200, 210, 230, 0.45)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(`${gr.teeth}T`, cx - 9, cy + 3);
  }
}
