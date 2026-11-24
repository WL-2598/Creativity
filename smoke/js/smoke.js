/**
 * smoke.js — 烟境的流烟核心（纯逻辑，可独立测试）
 * 种子裁决一组烟源与一张确定性流场：烟随流场升腾、翻卷、扩散。
 */
import { rngFromSeed } from '../../shared/rng.js';

export const SMOKE_TONES = {
  ember: { label: '炉火', base: [255, 120, 60], sky: ['#1a0e0a', '#3a1a12', '#6a2a1a'] },
  dusk: { label: '暮烟', base: [140, 150, 175], sky: ['#141822', '#232a38', '#3a4456'] },
  mist: { label: '晨雾', base: [200, 210, 225], sky: ['#1a2028', '#2c3540', '#454f5e'] },
  jade: { label: '青烟', base: [110, 190, 150], sky: ['#0c1614', '#162820', '#243c30'] },
};

/**
 * 生成烟境场景。
 * @param {number} seed
 * @param {{tone?: string, sources?: number, field?: number}} opts field: 流场网格分辨率
 */
export function generateSmoke(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const tones = Object.keys(SMOKE_TONES);
  const tone = opts.tone && SMOKE_TONES[opts.tone] ? opts.tone : tones[Math.floor(rng() * tones.length)];
  const T = SMOKE_TONES[tone];

  // 烟源：沿底部分布，强度与色相微变
  const count = Math.min(6, Math.max(1, opts.sources ?? 2 + Math.floor(rng() * 3)));
  const sources = [];
  for (let i = 0; i < count; i++) {
    sources.push({
      x: 0.12 + (0.76 / count) * i + rng() * 0.06,
      y: 0.88 + rng() * 0.06,
      strength: 0.6 + rng() * 0.8,
      drift: (rng() - 0.5) * 0.8,
      size: 0.7 + rng() * 0.6,
    });
  }

  // 流场：预计算角度网格（确定性噪声场）
  const fieldRes = Math.max(8, Math.min(64, opts.field ?? 32));
  const field = buildFlowField(seed, fieldRes, fieldRes);

  return {
    tone,
    toneLabel: T.label,
    base: T.base,
    sky: T.sky,
    sources,
    field,
    fieldRes,
    stats: {
      sources: sources.length,
      fieldRes,
      fieldSize: field.length,
      tone: tone,
    },
  };
}

/** 构造确定性流场：每个格点一个角度（弧度），由双频噪声叠加 */
export function buildFlowField(seed, w, h) {
  let s = (seed >>> 0) || 1;
  const hash = (x, y) => {
    let hh = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2246822519)) | 0;
    hh = Math.imul(hh ^ (hh >>> 13), 1274126177);
    return (hh >>> 0) / 4294967296;
  };
  const field = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = hash(Math.floor(x / 4), Math.floor(y / 4));
      const b = hash(x, y) * 0.5;
      field[y * w + x] = Math.atan2(a - 0.5, 1) * 2 + b * Math.PI;
    }
  }
  return field;
}

/** 从流场采样某点的速度方向（双线性插值） */
export function sampleFlow(field, res, x, y) {
  const fx = (x * res) | 0, fy = (y * res) | 0;
  const xf = x * res - fx, yf = y * res - fy;
  const at = (i, j) => field[(((j + res) % res) * res + ((i + res) % res))];
  const a = at(fx, fy), b = at(fx + 1, fy), c = at(fx, fy + 1), d = at(fx + 1, fy + 1);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}
