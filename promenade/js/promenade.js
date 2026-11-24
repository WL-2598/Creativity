/**
 * promenade.js — 回廊的空间核心（纯逻辑，可独立测试）
 * 种子裁决一条透视长廊：灭点、双侧柱列、拱券与光影方向。
 */
import { rngFromSeed } from '../../shared/rng.js';

export const HALL_TONES = {
  amber: { label: '琥珀长廊', floor: '#3a2c20', ceil: '#241a12', column: '#6a4f36', light: '#ffd9a0' },
  jade: { label: '青玉长廊', floor: '#1f2c28', ceil: '#12201c', column: '#3a5a52', light: '#bfe8d8' },
  rose: { label: '玫瑰长廊', floor: '#2e1f26', ceil: '#1c1118', column: '#6a3f52', light: '#ffc6d8' },
  slate: { label: '青灰长廊', floor: '#262c34', ceil: '#161b21', column: '#4a5462', light: '#c8d8e8' },
};

/**
 * 生成一条长廊。
 * @param {number} seed
 * @param {{tone?: string, columns?: number, arches?: number}} opts
 */
export function generatePromenade(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const tones = Object.keys(HALL_TONES);
  const tone = opts.tone && HALL_TONES[opts.tone] ? opts.tone : tones[Math.floor(rng() * tones.length)];
  const T = HALL_TONES[tone];

  // 灭点：画面中央偏上，留出长廊纵深
  const vanish = {
    x: 0.42 + rng() * 0.16,
    y: 0.32 + rng() * 0.16,
  };

  // 双侧柱列：柱数、柱径、柱高（近大远小由渲染按距离换算）
  const count = Math.min(14, Math.max(4, opts.columns ?? 6 + Math.floor(rng() * 5)));
  const columns = [];
  for (let i = 0; i < count; i++) {
    columns.push({
      depth: 0.15 + (0.7 / count) * i + rng() * 0.02,  // 纵深位置 0=远 1=近
      side: i % 2 === 0 ? -1 : 1,                       // 左右交替
      width: 0.05 + rng() * 0.03,
      height: 0.28 + rng() * 0.12,
      shade: 0.75 + rng() * 0.4,                        // 受光差异
    });
  }

  // 拱券：跨径与位置
  const archCount = Math.max(2, Math.min(6, opts.arches ?? 3 + Math.floor(rng() * 3)));
  const arches = [];
  for (let i = 0; i < archCount; i++) {
    arches.push({
      depth: 0.2 + (0.6 / archCount) * i + rng() * 0.03,
      span: 0.16 + rng() * 0.08,
      height: 0.1 + rng() * 0.06,
    });
  }

  // 光影：方向角与强度
  const light = {
    angle: rng() * Math.PI * 2,
    strength: 0.4 + rng() * 0.5,
  };

  return {
    tone,
    toneLabel: T.label,
    floors: T,
    vanish,
    columns,
    arches,
    light,
    stats: {
      columns: columns.length,
      arches: arches.length,
      light: tone,
      depthRange: [Math.min(...columns.map(c => c.depth)), Math.max(...columns.map(c => c.depth))],
    },
  };
}
