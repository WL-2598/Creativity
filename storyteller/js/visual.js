/**
 * visual.js — 织梦的星图视觉引擎
 * 种子星场、漂移光尘与星座连线，色调随故事主题流转。
 * 视觉保持低亮度，为文字让出舞台。
 */

export class StoryVisual {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.palette = ['#0a1430', '#1c3a6e', '#5f9ed8', '#cfe4ff'];
    this.stars = [];
    this.motes = [];
    this.lines = [];
    this.rotation = 0;
    this.running = false;
    this._raf = null;
    window.addEventListener('resize', () => this._resize());
    this._resize();
    this._build();
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.floor(this.canvas.clientHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = this.canvas.clientWidth;
    this.H = this.canvas.clientHeight;
    this._build();
  }

  _build() {
    const { W, H } = this;
    const n = Math.floor((W * H) / 9000);
    this.stars = Array.from({ length: Math.min(160, Math.max(60, n)) }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.3 + Math.random() * 1.5,
      tw: Math.random() * Math.PI * 2,
      depth: 0.3 + Math.random() * 0.7,
    }));
    this.motes = Array.from({ length: 26 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.1,
      r: 0.6 + Math.random() * 1.8,
      hue: Math.random(),
    }));
    // 星座连线：取若干星，两两相连
    this.lines = [];
    const picks = this.stars.filter(s => s.r > 1.1).slice(0, 8);
    for (let i = 0; i < picks.length - 1; i++) {
      if (Math.random() < 0.7) {
        this.lines.push({ a: picks[i], b: picks[i + 1] });
      }
    }
  }

  setStory(story) {
    if (story && story.palette) this.palette = story.palette;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  _loop() {
    if (!this.running) return;
    const { ctx, W, H } = this;
    const t = performance.now() / 1000;
    const [bg, c1, c2, c3] = this.palette;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 星场
    ctx.globalCompositeOperation = 'lighter';
    for (const s of this.stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * 1.2 + s.tw);
      ctx.globalAlpha = tw * s.depth * 0.8;
      ctx.fillStyle = c3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 星座连线（缓慢绕中心旋转）
    this.rotation = t * 0.02;
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = c2;
    ctx.lineWidth = 0.7;
    const cx = W / 2, cy = H / 2;
    const cos = Math.cos(this.rotation), sin = Math.sin(this.rotation);
    const rot = s => ({
      x: cx + (s.x - cx) * cos - (s.y - cy) * sin,
      y: cy + (s.x - cx) * sin + (s.y - cy) * cos,
    });
    ctx.beginPath();
    for (const line of this.lines) {
      const a = rot(line.a), b = rot(line.b);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    // 漂移光尘
    for (const m of this.motes) {
      m.x += m.vx; m.y += m.vy;
      if (m.x < 0 || m.x > W) m.vx *= -1;
      if (m.y < 0 || m.y > H) m.vy *= -1;
      ctx.globalAlpha = 0.25 + 0.35 * Math.sin(t * 0.7 + m.hue * 6);
      ctx.fillStyle = m.hue > 0.5 ? c2 : c3;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    this._raf = requestAnimationFrame(() => this._loop());
  }
}
