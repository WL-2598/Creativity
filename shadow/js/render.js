/**
 * render.js — 影戏渲染引擎
 * 幕布、灯火与皮影：灯沿弧线游走，影子被光拉长投在幕上。
 */
import { puppetJoints, projectShadowX } from './shadow.js';

export class ShadowRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.set = null;
    this.t = 0;
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

  setSet(set) {
    this.set = set;
    this.t = 0;
  }

  start() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => this._loop());
  }

  _loop() {
    if (!this.set) { this._raf = null; return; }
    this.t += 1 / 60;
    const { ctx, W, H } = this;
    const S = this.set;

    // 幕布
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#241a2a');
    bg.addColorStop(1, '#140e18');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // 幕布纹理
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < H; i += 24) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(W, i);
      ctx.stroke();
    }

    // 灯火：沿顶部弧线游走
    const lx = 0.5 + Math.sin(this.t * 0.35) * 0.38;
    const ly = 0.14;
    const Lx = lx * W, Ly = ly * H;

    // 灯光辉光
    const glow = ctx.createRadialGradient(Lx, Ly, 4, Lx, Ly, Math.max(W, H) * 0.5);
    glow.addColorStop(0, S.glow);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    // 灯
    ctx.fillStyle = S.light;
    ctx.beginPath();
    ctx.arc(Lx, Ly, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 240, 0.9)';
    ctx.beginPath();
    ctx.arc(Lx, Ly, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 幕底（投影面）
    const screenY = H * 0.9;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(0, screenY);
    ctx.lineTo(W, screenY);
    ctx.stroke();

    // 皮影：先画影子，再画皮影本体
    for (const p of S.puppets) {
      this._drawShadow(p, Lx, Ly, screenY);
    }
    for (const p of S.puppets) {
      this._drawPuppet(p);
    }

    this._raf = requestAnimationFrame(() => this._loop());
  }

  _drawPuppet(p) {
    const { ctx, W, H } = this;
    const j = puppetJoints(p);
    const s = p.scale * Math.min(W, H);
    ctx.fillStyle = 'rgba(24, 18, 26, 0.92)';
    ctx.strokeStyle = 'rgba(24, 18, 26, 0.92)';
    const pt = (pt) => [pt.x * W, pt.y * H];

    // 躯干与四肢
    this._limb(pt(j.hip), pt(j.shoulder), j.hip.w * s);
    this._limb(pt(j.shoulder), pt(j.elbowR), j.elbowR.w * s);
    this._limb(pt(j.elbowR), pt(j.handR), j.handR.w * s);
    this._limb(pt(j.shoulder), pt(j.elbowL), j.elbowL.w * s);
    this._limb(pt(j.elbowL), pt(j.handL), j.handL.w * s);
    this._limb(pt(j.hip), pt(j.kneeR), j.kneeR.w * s);
    this._limb(pt(j.kneeR), pt(j.footR), j.footR.w * s);
    this._limb(pt(j.hip), pt(j.kneeL), j.kneeL.w * s);
    this._limb(pt(j.kneeL), pt(j.footL), j.footL.w * s);
    // 头
    const [hx, hy] = pt(j.head);
    ctx.beginPath();
    ctx.arc(hx, hy, j.head.w * s, 0, Math.PI * 2);
    ctx.fill();
  }

  _limb(a, b, width) {
    const ctx = this.ctx;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, width);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }

  _drawShadow(p, Lx, Ly, screenY) {
    const { ctx, W, H } = this;
    const j = puppetJoints(p);
    const s = p.scale * Math.min(W, H);
    ctx.strokeStyle = this.set.shadow;
    ctx.lineCap = 'round';
    const proj = (pt) => [
      projectShadowX(pt.x * W, pt.y * H, Lx, Ly, screenY),
      screenY,
    ];
    const seg = (a, b, w) => {
      const [ax, ay] = proj(a);
      const [bx, by] = proj(b);
      ctx.lineWidth = Math.max(2, w * s);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    };
    seg(j.hip, j.shoulder, j.hip.w);
    seg(j.shoulder, j.elbowR, j.elbowR.w);
    seg(j.elbowR, j.handR, j.handR.w);
    seg(j.shoulder, j.elbowL, j.elbowL.w);
    seg(j.elbowL, j.handL, j.handL.w);
    seg(j.hip, j.kneeR, j.kneeR.w);
    seg(j.kneeR, j.footR, j.footR.w);
    seg(j.hip, j.kneeL, j.kneeL.w);
    seg(j.kneeL, j.footL, j.footL.w);
    const [hx, hy] = proj(j.head);
    ctx.fillStyle = this.set.shadow;
    ctx.beginPath();
    ctx.ellipse(hx, hy, j.head.w * s, j.head.w * s * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

