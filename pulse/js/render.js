/**
 * render.js — 脉境渲染引擎
 * 节点按固有节律脉动，脉冲光点沿边传播，如心跳与神经。
 */
export class PulseRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.net = null;
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

  setNet(net) {
    this.net = net;
    this.t = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running || !this.net) return;
    this.t += 1 / 60;
    const { ctx, W, H } = this;
    const net = this.net;

    // 背景
    const bg = ctx.createRadialGradient(W * 0.5, H * 0.5, 30, W * 0.5, H * 0.5, Math.max(W, H) * 0.7);
    bg.addColorStop(0, '#0d1420');
    bg.addColorStop(1, '#05080e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const pad = 46;
    const scale = Math.min(W - pad * 2, H - pad * 2);
    const pos = (n) => ({ x: pad + n.x * scale, y: pad + n.y * scale });

    // 边
    ctx.lineWidth = 1;
    net.edges.forEach((e, i) => {
      const a = pos(net.nodes[e.a]), b = pos(net.nodes[e.b]);
      ctx.strokeStyle = 'rgba(110, 170, 220, 0.16)';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // 双向脉冲波：时延越大，波速越慢
      const drawPulse = (from, to, phase, speed) => {
        const tt = phase % 1;
        if (tt > 0 && tt < 1) {
          const px = from.x + (to.x - from.x) * tt;
          const py = from.y + (to.y - from.y) * tt;
          const g = ctx.createRadialGradient(px, py, 0, px, py, 9);
          g.addColorStop(0, 'rgba(140, 220, 255, 0.9)');
          g.addColorStop(1, 'rgba(140, 220, 255, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, 9, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      const speed = 0.5 / (1 + e.delay);
      drawPulse(a, b, this.t * speed + i * 0.13, speed);
      drawPulse(b, a, this.t * speed + i * 0.13 + 0.5, speed);
    });

    // 节点：按节律脉动
    for (let i = 0; i < net.nodes.length; i++) {
      const n = net.nodes[i];
      const beat = Math.sin(this.t * n.freq / 60 * Math.PI * 2 + n.phase);
      const r = n.size * (1 + beat * 0.5);
      const p = pos(n);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
      g.addColorStop(0, `rgba(120, 200, 250, ${0.25 + beat * 0.2})`);
      g.addColorStop(1, 'rgba(120, 200, 250, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(220, 240, 255, ${0.7 + beat * 0.25})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    this._raf = requestAnimationFrame(() => this._loop());
  }
}
