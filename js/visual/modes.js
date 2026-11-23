/**
 * modes.js — 四种视觉宇宙模式
 * nebula 星云 / ripples 涟漪 / mandala 织锦 / trails 星轨
 * 每个模式由种子初始化，随频谱实时共振。
 */
import { flowAngle } from './utils.js';
import { paletteColor } from './palettes.js';
import { clamp } from '../audio/composition.js';

/* ------------------------------------------------------------------ *
 * 星云 —— 视差星场 + 流场粒子云，中高频驱动亮度与密度
 * ------------------------------------------------------------------ */
const nebula = {
  init(rng, palette, world, W, H) {
    const starLayers = [
      { count: 90, size: [0.4, 1.1], speed: 0.02 },
      { count: 60, size: [0.8, 1.8], speed: 0.05 },
      { count: 30, size: [1.4, 2.6], speed: 0.09 },
    ].map(layer => ({
      stars: Array.from({ length: layer.count }, () => ({
        x: rng() * W, y: rng() * H,
        r: layer.size[0] + rng() * (layer.size[1] - layer.size[0]),
        tw: rng() * Math.PI * 2,
      })),
      ...layer,
    }));
    const baseCount = Math.floor(140 + world.density * 420);
    const particles = Array.from({ length: baseCount }, () => ({
      x: rng() * W, y: rng() * H,
      age: rng(),
      hue: rng(),
    }));
    return { starLayers, particles, glow: 0, W, H,
      resize(s, w, h) { s.W = w; s.H = h; } };
  },
  render(ctx, s, engine, dt, t, audio, world, palette) {
    const { W, H } = s;

    // 星场（视差滚动 + 闪烁）
    for (const layer of s.starLayers) {
      ctx.globalCompositeOperation = 'lighter';
      for (const st of layer.stars) {
        const tw = 0.55 + 0.45 * Math.sin(t * 1.4 + st.tw);
        ctx.globalAlpha = tw * (0.35 + audio.high * 0.6);
        ctx.fillStyle = palette.colors[4];
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 中央辉光（低频呼吸）
    const glowTarget = clamp(audio.bass * 0.9 + 0.25, 0, 1);
    s.glow += (glowTarget - s.glow) * 0.05;
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.55 * (0.8 + s.glow * 0.4));
    g.addColorStop(0, paletteColor(palette.colors, 0.75));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = s.glow * 0.28;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 流场粒子
    const motion = world.motion;
    const speedMul = 40 + world.density * 70;
    ctx.globalCompositeOperation = 'lighter';
    for (const p of s.particles) {
      const ang = flowAngle(p.x, p.y, t, 0.0021, 0.5) * motion;
      p.x += Math.cos(ang) * speedMul * dt * (0.6 + audio.mid);
      p.y += Math.sin(ang) * speedMul * dt * (0.6 + audio.mid);
      p.age += dt * (0.05 + motion * 0.12);
      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20 || p.age > 1) {
        p.x = rng01() * W; p.y = rng01() * H; p.age = 0;
      }
      const fade = Math.sin(Math.PI * p.age);
      ctx.globalAlpha = fade * (0.35 + audio.high * 0.65) * world.brightness;
      ctx.fillStyle = paletteColor(palette.colors, p.hue + p.age * 0.3);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.2 + audio.mid * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
};

/* ------------------------------------------------------------------ *
 * 涟漪 —— 中心向外扩散的同心环，底鼓触发脉冲，干涉叠加
 * ------------------------------------------------------------------ */
const ripples = {
  init(rng, palette, world, W, H) {
    const rings = [];
    // 环境环：持续呼吸
    for (let i = 0; i < 5; i++) {
      rings.push({ r: rng() * Math.max(W, H), speed: 0.3 + rng() * 0.5, hue: rng(), born: rng() });
    }
    return { rings, core: 0, W, H,
      resize(st, w, h) { st.W = w; st.H = h; } };
  },
  render(ctx, s, engine, dt, t, audio, world, palette) {
    const { W, H } = s;
    const cx = W / 2, cy = H / 2;
    const maxR = Math.hypot(W, H) * 0.6;
    ctx.globalCompositeOperation = 'lighter';

    // 底鼓 => 新脉冲环
    if (audio.kick > 0.25) {
      s.rings.push({ r: 0, speed: 90 + audio.kick * 160, hue: rng01(), born: 0, amp: 0.6 + audio.kick });
    }
    // 环境环随中频推进
    for (const ring of s.rings) {
      ring.r += (ring.speed + audio.mid * 180) * dt * (0.6 + world.motion);
      ring.born += dt;
      if (ring.r > maxR) {
        ring.r = 0; ring.born = 0; ring.amp = 0.35 + audio.mid;
      }
      const amp = (ring.amp ?? 0.4) * Math.max(0, 1 - ring.r / maxR);
      if (amp <= 0.02) continue;
      ctx.globalAlpha = amp * (0.5 + world.brightness * 0.5);
      ctx.strokeStyle = paletteColor(palette.colors, ring.hue + ring.born * 0.05);
      ctx.lineWidth = 1.5 + audio.bass * 3;
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    s.rings = s.rings.filter(r => r.r < maxR);

    // 中心核：低频呼吸
    const coreTarget = clamp(audio.bass * 1.1, 0.05, 1);
    s.core += (coreTarget - s.core) * 0.08;
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 + s.core * 120);
    core.addColorStop(0, paletteColor(palette.colors, 0.9));
    core.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = s.core * 0.5;
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, 60 + s.core * 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  },
};

/* ------------------------------------------------------------------ *
 * 织锦 —— 万花筒对称图案，频谱驱动花瓣、弧线与光点
 * ------------------------------------------------------------------ */
const mandala = {
  init(rng, palette, world, W, H) {
    return {
      m: 4 + Math.floor(rng() * 9),          // 对称折数
      rot: rng() * Math.PI * 2,
      rotSpeed: (rng() - 0.5) * 0.12 * (world.motion || 0.5),
      R: Math.min(W, H) * 0.42,
      petals: Array.from({ length: 12 }, () => ({
        phase: rng(), freq: 0.3 + rng() * 0.7, hue: rng(),
      })),
      W, H,
      resize(st, w, h) { st.W = w; st.H = h; st.R = Math.min(w, h) * 0.42; },
    };
  },
  render(ctx, s, engine, dt, t, audio, world, palette) {
    const cx = s.W / 2, cy = s.H / 2;
    s.rot += s.rotSpeed * dt * (0.4 + world.motion);
    ctx.globalCompositeOperation = 'lighter';

    const layers = [
      { mul: 1.00, amp: 1.0, lw: 1.0 },
      { mul: 0.66, amp: 0.7, lw: 1.6 },
      { mul: 0.42, amp: 0.5, lw: 2.4 },
    ];
    for (const layer of layers) {
      const R = s.R * layer.mul * (0.9 + audio.bass * 0.25);
      ctx.globalAlpha = (0.25 + audio.mid * 0.5) * layer.amp * world.brightness;
      ctx.strokeStyle = paletteColor(palette.colors, layer.mul + audio.high * 0.2);
      ctx.lineWidth = layer.lw + audio.high * 2;

      // 弧线花瓣
      ctx.beginPath();
      for (let i = 0; i < s.m; i++) {
        const a0 = s.rot + (i / s.m) * Math.PI * 2;
        const petal = 0.5 + 0.5 * Math.sin(t * 1.2 + s.petals[i % s.petals.length].phase * 6);
        const a1 = a0 + (0.25 + petal * 0.4) * layer.mul;
        ctx.arc(cx, cy, R, a0, a1);
      }
      ctx.stroke();

      // 光点
      ctx.fillStyle = palette.colors[4];
      for (let i = 0; i < s.m; i++) {
        const a = s.rot + (i / s.m) * Math.PI * 2;
        const rr = R * (0.6 + audio.high * 0.4);
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        ctx.globalAlpha = (0.3 + audio.mid) * layer.amp;
        ctx.beginPath();
        ctx.arc(x, y, 1.5 + audio.bass * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 中心：随底鼓绽放
    const bloom = clamp(audio.kick, 0, 1);
    if (bloom > 0.1) {
      ctx.globalAlpha = bloom * 0.8;
      ctx.fillStyle = palette.colors[3];
      ctx.beginPath();
      ctx.arc(cx, cy, 10 + bloom * 40, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
};

/* ------------------------------------------------------------------ *
 * 星轨 —— 拖尾彗星粒子，风场驱动，长余晖轨迹
 * ------------------------------------------------------------------ */
const trails = {
  init(rng, palette, world, W, H) {
    const count = Math.floor(40 + world.density * 130);
    return {
      comets: Array.from({ length: count }, () => ({
        x: rng() * W, y: rng() * H,
        vx: 0, vy: 0,
        hue: rng(),
        trail: Array.from({ length: 18 }, () => ({ x: 0, y: 0 })),
      })),
      stars: Array.from({ length: 80 }, () => ({
        x: rng() * W, y: rng() * H, r: 0.4 + rng() * 1.2, tw: rng() * 6.28,
      })),
      W, H,
      resize(st, w, h) { st.W = w; st.H = h; },
    };
  },
  render(ctx, s, engine, dt, t, audio, world, palette) {
    const { W, H } = s;
    // 余晖：半透明覆盖产生拖尾
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = PALETTES_BG(palette);
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    // 星点
    ctx.globalCompositeOperation = 'lighter';
    for (const st of s.stars) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 1.3 + st.tw);
      ctx.fillStyle = palette.colors[4];
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const wind = flowAngle(0, 0, t, 0.0011, 0.35) * 0.9;
    const turbulence = 260 + audio.bass * 500;
    for (const c of s.comets) {
      const a = flowAngle(c.x, c.y, t, 0.0016, 0.6) + wind;
      c.vx = c.vx * 0.94 + (Math.cos(a) * turbulence) * dt;
      c.vy = c.vy * 0.94 + (Math.sin(a) * turbulence) * dt;
      c.x += c.vx * dt * (0.5 + world.motion);
      c.y += c.vy * dt * (0.5 + world.motion);

      // 记录轨迹
      c.trail.pop();
      c.trail.unshift({ x: c.x, y: c.y });

      if (c.x < -60 || c.x > W + 60 || c.y < -60 || c.y > H + 60) {
        c.x = rng01() * W; c.y = rng01() * H; c.vx = 0; c.vy = 0; c.trail.fill(null);
      }

      // 绘制拖尾
      const speed = Math.hypot(c.vx, c.vy);
      const norm = clamp(speed / 400, 0, 1);
      ctx.globalAlpha = 0.25 + norm * 0.6;
      const grad = ctx.createLinearGradient(c.trail[17]?.x ?? c.x, c.trail[17]?.y ?? c.y, c.x, c.y);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, paletteColor(palette.colors, c.hue + norm * 0.4));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1 + norm * 2.4 + audio.mid * 1.5;
      ctx.beginPath();
      c.trail.forEach((p, i) => {
        const px = p?.x, py = p?.y;
        if (px == null) return;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
};

/* 辅助：背景填充色（避免循环依赖，内联取 bg） */
function PALETTES_BG(palette) { return palette.bg; }

/** 渲染期使用的随机（视觉粒子重生位置），无需种子确定性 */
function rng01() { return Math.random(); }

export { nebula, ripples, mandala, trails };
