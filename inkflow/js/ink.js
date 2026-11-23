/**
 * ink.js — 墨韵渲染引擎
 * 宣纸纹理、五色墨笔触、墨的晕染扩散、落笔与印章。
 * 纯 Canvas 2D，无依赖。
 */
import { inkColor } from './motifs.js';

/** 本地流场噪声（墨在纸面缓慢游走） */
function flowAngle(x, y, t, scale = 0.004, speed = 0.3) {
  return Math.sin(x * scale + t * speed) * 1.2
       + Math.cos(y * scale * 1.3 - t * speed * 0.6) * 1.0
       + Math.sin((x + y) * scale * 0.5 + t * speed * 0.4) * 0.7;
}

export class InkRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 0;
    this.H = 0;
    this.tone = 0.5;            // 整体墨色倾向 0..1
    this.strokes = [];           // 已落定的笔触
    this.particles = [];         // 晕染粒子
    this.brush = null;           // 正在绘制的笔触
    this.settling = false;       // 场景入场动画
    this.settleT = 0;
    this.running = false;
    this._raf = null;
    this._paper = null;
    window.addEventListener('resize', () => this._resize());
    this._resize();
    this._buildPaper();
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.floor(this.canvas.clientHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = this.canvas.clientWidth;
    this.H = this.canvas.clientHeight;
    this._buildPaper();
  }

  /* ---------- 宣纸 ---------- */
  _buildPaper() {
    const { W, H } = this;
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const c = off.getContext('2d');
    // 底色：微黄的宣纸
    const base = c.createLinearGradient(0, 0, W * 0.4, H);
    base.addColorStop(0, '#f7f2e7');
    base.addColorStop(0.5, '#f3eddf');
    base.addColorStop(1, '#efe7d4');
    c.fillStyle = base;
    c.fillRect(0, 0, W, H);
    // 纸纹：细密噪点
    const img = c.getImageData(0, 0, W, H);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * 14;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    c.putImageData(img, 0, 0);
    // 纸纤维
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 140; i++) {
      const x = Math.random() * W, y = Math.random() * H;
      const a = Math.random() * Math.PI * 2;
      const len = 10 + Math.random() * 40;
      c.strokeStyle = `rgba(200,185,150,${0.03 + Math.random() * 0.05})`;
      c.lineWidth = 0.6 + Math.random() * 1.2;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
    // 四角微暗，仿旧纸
    const vig = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(120,100,60,0.10)');
    c.fillStyle = vig;
    c.fillRect(0, 0, W, H);
    this._paper = off;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  /* ---------- 场景 ---------- */
  setScene(strokes, seed, tone) {
    this.tone = tone ?? this.tone;
    this.strokes = strokes.map(s => ({ ...s, points: s.points.map(p => ({ ...p })) }));
    this.particles = [];
    this.settleT = 0;
    this.settling = true;
  }

  setTone(t) { this.tone = t; }

  clear() {
    this.strokes = [];
    this.particles = [];
    this.brush = null;
  }

  /* ---------- 落笔 ---------- */
  beginBrush(x, y) {
    this.brush = { points: [{ x, y }], width: 5 + Math.random() * 4, ink: 0.8, kind: 'stroke' };
  }

  extendBrush(x, y) {
    if (!this.brush) return;
    const pts = this.brush.points;
    const last = pts[pts.length - 1];
    const dist = Math.hypot(x - last.x, y - last.y);
    // 速度越快笔锋越细，模拟提按
    const speed = Math.min(1, dist / 24);
    this.brush.width = Math.max(1.4, this.brush.width * 0.92 + 4.5 * (1 - speed * 0.6));
    pts.push({ x, y });
    if (pts.length > 1) {
      this._spawnBleed(last.x, last.y, this.brush.ink, this.brush.width * 0.4);
    }
  }

  endBrush() {
    if (this.brush && this.brush.points.length > 1) this.strokes.push(this.brush);
    this.brush = null;
  }

  /** 晕染粒子：墨在纸面缓慢扩散 */
  _spawnBleed(x, y, ink, size) {
    if (this.particles.length > 400) return;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      this.particles.push({
        x: x + (Math.random() - 0.5) * size,
        y: y + (Math.random() - 0.5) * size,
        vx: Math.cos(a) * 0.15,
        vy: Math.sin(a) * 0.15,
        life: 0.3 + Math.random() * 0.8,
        age: 0,
        ink,
        size: size * (0.6 + Math.random() * 0.8),
      });
    }
  }

  /* ---------- 印章 ---------- */
  stamp(char) {
    const { W, H, ctx } = this;
    const s = Math.min(W, H) * 0.075;
    const x = W - s - 28, y = H - s - 28;
    ctx.save();
    // 印面：微有残破的朱红方印
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = '#b03a2e';
    ctx.beginPath();
    const j = 1.5;
    ctx.moveTo(x - j, y);
    ctx.lineTo(x + s + j, y - j);
    ctx.lineTo(x + s + j * 2, y + s + j);
    ctx.lineTo(x - j * 0.5, y + s + j * 1.5);
    ctx.closePath();
    ctx.fill();
    // 白文刻字
    ctx.fillStyle = '#f7f2e7';
    ctx.font = `600 ${s * 0.62}px "Songti SC", "STSong", "SimSun", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char || '印', x + s / 2, y + s / 2 + s * 0.04);
    ctx.restore();
  }

  /* ---------- 渲染 ---------- */
  _drawStroke(ctx, s, alphaMul) {
    const { points, width, ink, kind } = s;
    const color = inkColor(ink, this.tone);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const a = s.alpha ?? 1;

    if (kind === 'dot' || kind === 'wash') {
      const p = points[0];
      ctx.globalAlpha = a * alphaMul;
      if (kind === 'dot') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r || width);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r || width, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = color;
      }
      ctx.globalAlpha = 1;
      return;
    }

    // 折线笔触：主锋 + 淡墨晕边，模拟水墨渗化
    ctx.globalAlpha = a * alphaMul;
    const drawLine = (w) => {
      ctx.lineWidth = Math.max(0.6, w);
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
    };
    if (kind === 'ridge' || kind === 'culm' || kind === 'branch' || kind === 'grass' || kind === 'body') {
      // 先晕边（宽而淡），再主锋
      ctx.globalAlpha = a * alphaMul * 0.35;
      drawLine(width * 2.1);
      ctx.globalAlpha = a * alphaMul;
      drawLine(width);
    } else {
      drawLine(width);
    }
    ctx.globalAlpha = 1;
  }

  _loop() {
    if (!this.running) return;
    const { ctx, W, H } = this;
    const t = performance.now() / 1000;

    // 宣纸
    ctx.drawImage(this._paper, 0, 0, W, H);

    // 入场动画：墨逐渐"渗"出来
    if (this.settling) {
      this.settleT += 0.02;
      if (this.settleT >= 1) this.settling = false;
    }
    const settleAlpha = this.settling ? Math.min(1, this.settleT * 2.2) : 1;

    // 已落定笔触
    for (const s of this.strokes) this._drawStroke(ctx, s, settleAlpha);

    // 正在绘制的笔触
    if (this.brush) this._drawStroke(ctx, this.brush, 1);

    // 晕染粒子：随流场漂移、渐隐
    ctx.globalCompositeOperation = 'multiply';
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      const ang = flowAngle(p.x, p.y, t, 0.004, 0.3);
      p.vx += Math.cos(ang) * 0.02;
      p.vy += Math.sin(ang) * 0.02;
      p.vx *= 0.97; p.vy *= 0.97;
      p.x += p.vx; p.y += p.vy;
      p.age += 0.016;
      const fade = Math.max(0, 1 - p.age / p.life);
      if (fade <= 0) { this.particles.splice(i, 1); continue; }
      ctx.globalAlpha = fade * 0.5;
      ctx.fillStyle = inkColor(p.ink, this.tone);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.8 + fade * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    this._raf = requestAnimationFrame(() => this._loop());
  }
}
