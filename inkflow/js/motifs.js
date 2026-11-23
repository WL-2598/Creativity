/**
 * motifs.js — 画卷笔法（纯逻辑）
 * 由种子为每个母题生成一组笔触描述，供 ink.js 绘制。
 * 笔触：{ points: [{x,y}...], width, ink, kind, alpha }
 * ink ∈ [0,1]：墨色浓度（焦/浓/重/淡/清）
 * ------------------------------------------------------------------ */

/** 构造一条带抖动的折线笔触 */
function poly(rng, x0, y0, x1, y1, jitter, segments, width, ink, kind, alpha = 1) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    pts.push({
      x: x0 + (x1 - x0) * t + (rng() - 0.5) * jitter,
      y: y0 + (y1 - y0) * t + (rng() - 0.5) * jitter,
    });
  }
  return { points: pts, width, ink, kind, alpha };
}

/** 墨色浓度映射到五色墨 */
export function inkColor(ink, tone = 0) {
  // tone 0..1：整体浓淡倾向；ink 为笔触浓度
  const v = clamp01(ink * (0.7 + tone * 0.6));
  const a = 0.12 + v * 0.85;
  const g = Math.round(255 - v * 220);
  return `rgba(${g},${g},${Math.round(g * 0.96)},${a})`;
}

function clamp01(v) { return Math.min(1, Math.max(0, v)); }

/* ------------------------------------------------------------------ */

const MOTIF_GENERATORS = {
  /* 远山：数重山脊，由近及远、墨色由浓至淡 */
  mountain(rng, W, H) {
    const strokes = [];
    const layers = 3 + Math.floor(rng() * 2);
    for (let l = 0; l < layers; l++) {
      const t = l / layers;                       // 0 近 → 1 远
      const baseY = H * (0.42 + t * 0.42);
      const amp = H * (0.06 + (1 - t) * 0.1);
      const ink = 0.85 - t * 0.55;
      const segments = 6 + Math.floor(rng() * 5);
      // 山脊：从左缘起伏至右缘
      let pts = [];
      for (let i = 0; i <= segments; i++) {
        const x = (W * 0.06) + (W * 0.88) * (i / segments);
        const y = baseY
          - Math.sin(i * 0.9 + l * 1.7) * amp
          - amp * 0.5 * rng();
        pts.push({ x, y });
      }
      strokes.push({ points: pts, width: 2 + (1 - t) * 6, ink, kind: 'ridge', alpha: 1 });
      // 近山加皴法短笔
      if (l < 2) {
        for (let i = 0; i < 8 + rng() * 10; i++) {
          const px = W * 0.1 + rng() * W * 0.8;
          const py = baseY - amp * (0.3 + rng() * 0.7);
          strokes.push(poly(rng, px, py, px + 10 + rng() * 24, py + 6 + rng() * 14,
            3, 2, 1 + rng() * 2, ink * 0.7, 'hatch', 0.5));
        }
      }
    }
    // 一叶扁舟或飞鸟点缀
    if (rng() < 0.6) {
      const bx = W * (0.2 + rng() * 0.5);
      const by = H * (0.72 + rng() * 0.12);
      strokes.push(poly(rng, bx, by, bx + 34 + rng() * 20, by, 1, 3, 2.4, 0.6, 'hull'));
    }
    return strokes;
  },

  /* 修竹：数竿竹枝 + 叶簇 */
  bamboo(rng, W, H) {
    const strokes = [];
    const culms = 2 + Math.floor(rng() * 3);
    for (let c = 0; c < culms; c++) {
      const x = W * (0.18 + (0.62 / culms) * c + rng() * 0.05);
      const top = H * (0.12 + rng() * 0.12);
      const sway = (rng() - 0.5) * H * 0.08;
      const pts = [];
      const segs = 8;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        pts.push({
          x: x + sway * Math.pow(t, 1.6),
          y: H * 0.92 - (H * 0.92 - top) * t,
        });
      }
      strokes.push({ points: pts, width: 3.5 + rng() * 3, ink: 0.7 + rng() * 0.25, kind: 'culm', alpha: 1 });
      // 竹节
      for (let i = 1; i < segs; i += 2) {
        const p = pts[i];
        strokes.push({ points: [{ x: p.x - 5, y: p.y }, { x: p.x + 5, y: p.y }], width: 1.6, ink: 0.8, kind: 'node' });
      }
      // 叶簇
      const leafClusters = 2 + Math.floor(rng() * 3);
      for (let k = 0; k < leafClusters; k++) {
        const t = 0.25 + rng() * 0.55;
        const px = x + sway * Math.pow(t, 1.6) + (rng() - 0.5) * 10;
        const py = H * 0.92 - (H * 0.92 - top) * t;
        const ang = -Math.PI / 2 + (rng() - 0.5) * 1.6;
        const leaves = 3 + Math.floor(rng() * 4);
        for (let j = 0; j < leaves; j++) {
          const a = ang + (rng() - 0.5) * 1.1;
          const len = 26 + rng() * 40;
          strokes.push(poly(rng, px, py, px + Math.cos(a) * len, py + Math.sin(a) * len,
            2, 2, 1.2 + rng() * 1.6, 0.55 + rng() * 0.35, 'leaf', 0.9));
        }
      }
    }
    return strokes;
  },

  /* 疏梅：虬枝 + 花点 */
  plum(rng, W, H) {
    const strokes = [];
    // 主干
    let pts = [];
    let x = W * 0.12, y = H * 0.9;
    for (let i = 0; i <= 6; i++) {
      pts.push({ x, y });
      x += W * (0.04 + rng() * 0.05);
      y -= H * (0.08 + rng() * 0.1);
    }
    strokes.push({ points: pts, width: 5 + rng() * 4, ink: 0.75, kind: 'branch', alpha: 1 });
    // 分枝
    for (let b = 0; b < 3 + Math.floor(rng() * 3); b++) {
      const si = 1 + Math.floor(rng() * 5);
      const sp = pts[si];
      const ang = -Math.PI / 2 + (rng() - 0.5) * 2.2;
      const len = W * (0.08 + rng() * 0.12);
      strokes.push(poly(rng, sp.x, sp.y, sp.x + Math.cos(ang) * len, sp.y + Math.sin(ang) * len,
        3, 4, 2 + rng() * 2.5, 0.7, 'branch', 0.95));
    }
    // 花点
    for (let i = 0; i < 6 + Math.floor(rng() * 10); i++) {
      strokes.push({
        points: [{ x: W * (0.1 + rng() * 0.75), y: H * (0.1 + rng() * 0.75) }],
        width: 3 + rng() * 5, ink: 0.5 + rng() * 0.4, kind: 'dot', alpha: 0.85,
      });
    }
    return strokes;
  },

  /* 幽兰：长叶披拂 */
  orchid(rng, W, H) {
    const strokes = [];
    const cx = W * (0.35 + rng() * 0.3);
    const cy = H * 0.9;
    const blades = 5 + Math.floor(rng() * 4);
    for (let i = 0; i < blades; i++) {
      const ang = -Math.PI / 2 + (rng() - 0.5) * 1.8;
      const len = H * (0.3 + rng() * 0.4);
      const w = 2 + rng() * 3;
      const endX = cx + Math.cos(ang) * len;
      const endY = cy + Math.sin(ang) * len;
      strokes.push(poly(rng, cx, cy, endX, endY, 6, 5, w, 0.45 + rng() * 0.4, 'grass', 0.85));
    }
    // 一簇小花
    if (rng() < 0.8) {
      const fx = cx + (rng() - 0.5) * 40;
      const fy = cy - H * (0.2 + rng() * 0.15);
      for (let i = 0; i < 3 + Math.floor(rng() * 4); i++) {
        strokes.push({
          points: [{ x: fx + (rng() - 0.5) * 30, y: fy + (rng() - 0.5) * 20 }],
          width: 2 + rng() * 3, ink: 0.35, kind: 'dot', alpha: 0.7,
        });
      }
    }
    return strokes;
  },

  /* 明月：圆晕 + 轻云 */
  moon(rng, W, H) {
    const strokes = [];
    const cx = W * (0.35 + rng() * 0.3);
    const cy = H * (0.2 + rng() * 0.2);
    const r = Math.min(W, H) * (0.06 + rng() * 0.05);
    strokes.push({ points: [{ x: cx, y: cy, r }], width: 0, ink: 0.3, kind: 'wash', alpha: 0.8 });
    // 光晕外圈
    strokes.push({ points: [{ x: cx, y: cy, r: r * 2.2 }], width: 0, ink: 0.12, kind: 'wash', alpha: 0.4 });
    // 云线
    for (let i = 0; i < 4 + Math.floor(rng() * 4); i++) {
      const y = cy + (rng() - 0.5) * H * 0.4;
      const x0 = W * 0.1, x1 = W * 0.9;
      strokes.push(poly(rng, x0, y, x1, y + (rng() - 0.5) * 20, 8, 6, 2 + rng() * 3, 0.18, 'cloud', 0.6));
    }
    // 远山底影
    const ridge = [];
    for (let i = 0; i <= 6; i++) {
      ridge.push({ x: W * 0.05 + W * 0.9 * (i / 6), y: H * 0.78 - Math.sin(i * 0.8) * H * 0.05 });
    }
    strokes.push({ points: ridge, width: 3, ink: 0.25, kind: 'ridge', alpha: 0.7 });
    return strokes;
  },

  /* 孤舟：一叶 + 水纹 */
  boat(rng, W, H) {
    const strokes = [];
    const cx = W * (0.3 + rng() * 0.4);
    const cy = H * (0.5 + rng() * 0.15);
    strokes.push(poly(rng, cx - 40, cy, cx + 45, cy, 1, 4, 3.4, 0.7, 'hull'));
    // 船篷
    strokes.push(poly(rng, cx - 26, cy - 6, cx + 8, cy - 6, 1, 3, 2.2, 0.6, 'hull'));
    // 水纹（渐淡）
    for (let i = 0; i < 7; i++) {
      const y = cy + 8 + i * (H * 0.03);
      const x0 = cx - 50 - i * 8;
      const x1 = cx + 60 + i * 8;
      strokes.push(poly(rng, x0, y, x1, y, 2, 4, 1.2 + rng() * 1.4, 0.4 - i * 0.045, 'ripple', 0.7 - i * 0.08));
    }
    return strokes;
  },

  /* 孤鹤：简笔立鹤 */
  crane(rng, W, H) {
    const strokes = [];
    const cx = W * (0.4 + rng() * 0.2);
    const cy = H * 0.68;
    // 身
    strokes.push(poly(rng, cx - 30, cy, cx + 34, cy - 4, 2, 4, 3, 0.7, 'body'));
    // 颈（曲）
    strokes.push(poly(rng, cx + 26, cy - 4, cx + 40, cy - 40, 2, 4, 2.2, 0.7, 'neck'));
    // 头
    strokes.push({ points: [{ x: cx + 42, y: cy - 42 }], width: 4, ink: 0.8, kind: 'dot' });
    // 长腿
    strokes.push(poly(rng, cx - 10, cy, cx - 14, H * 0.92, 1, 4, 1.6, 0.65, 'leg'));
    strokes.push(poly(rng, cx + 8, cy, cx + 12, H * 0.92, 1, 4, 1.6, 0.65, 'leg'));
    // 翼
    strokes.push(poly(rng, cx - 26, cy - 2, cx - 46, cy - 22, 2, 3, 2.6, 0.6, 'wing', 0.8));
    // 云气
    for (let i = 0; i < 3; i++) {
      strokes.push(poly(rng, W * 0.1 + rng() * W * 0.6, cy + 30 + rng() * 40,
        W * 0.2 + rng() * W * 0.6, cy + 30 + rng() * 40, 6, 4, 2, 0.15, 'cloud', 0.5));
    }
    return strokes;
  },

  /* 听雨：雨丝 + 檐线 + 烟树 */
  rain(rng, W, H) {
    const strokes = [];
    // 远树烟影
    const ridge = [];
    for (let i = 0; i <= 5; i++) {
      ridge.push({ x: W * 0.08 + W * 0.84 * (i / 5), y: H * 0.62 - Math.sin(i * 1.2) * H * 0.06 });
    }
    strokes.push({ points: ridge, width: 4, ink: 0.22, kind: 'ridge', alpha: 0.6 });
    // 雨丝
    for (let i = 0; i < 40 + Math.floor(rng() * 40); i++) {
      const x = rng() * W;
      const y = rng() * H * 0.75;
      strokes.push(poly(rng, x, y, x - 3 - rng() * 5, y + 14 + rng() * 18,
        1, 1, 0.8 + rng() * 1.2, 0.35 + rng() * 0.3, 'rain', 0.3 + rng() * 0.4));
    }
    // 檐角
    strokes.push(poly(rng, W * 0.15, H * 0.22, W * 0.75, H * 0.22, 1, 4, 2.4, 0.7, 'beam'));
    return strokes;
  },
};

export const MOTIF_KEYS = Object.keys(MOTIF_GENERATORS);

/** 生成一个母题的笔触集合 */
export function generateMotif(rng, motifKey, W, H) {
  const gen = MOTIF_GENERATORS[motifKey] || MOTIF_GENERATORS.mountain;
  return gen(rng, W, H);
}
