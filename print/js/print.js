/**
 * print.js — 拓境的印版核心（纯逻辑，可独立测试）
 * 种子裁决一组印版：形状、密度、墨色与套印顺序，叠加成一幅版画。
 */
import { rngFromSeed } from '../../shared/rng.js';

export const PRINT_STYLES = {
  ink: { label: '水墨', paper: '#e8e2d4', inks: ['#1a1612', '#3d3a32', '#6b6658', '#8a8474'] },
  crimson: { label: '朱砂', paper: '#f0e6dc', inks: ['#8c1f28', '#a8323a', '#c25a4a', '#3d3a32'] },
  indigo: { label: '靛蓝', paper: '#e6e9ee', inks: ['#12283f', '#1f4a6b', '#3a7299', '#6b8aa8'] },
  gold: { label: '泥金', paper: '#f2ead6', inks: ['#7a5a1a', '#a8842a', '#c9a85a', '#3d3a32'] },
};

export const PLATE_TYPES = ['dot', 'line', 'wave', 'ring', 'grid'];

/**
 * 生成一幅版画的印版序列。
 * @param {number} seed
 * @param {{style?: string, plates?: number}} opts
 */
export function generatePrint(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const styleKeys = Object.keys(PRINT_STYLES);
  const style = opts.style && PRINT_STYLES[opts.style] ? opts.style : styleKeys[Math.floor(rng() * styleKeys.length)];
  const S = PRINT_STYLES[style];

  const plateCount = Math.min(5, Math.max(2, opts.plates ?? 2 + Math.floor(rng() * 3)));
  const plates = [];
  for (let i = 0; i < plateCount; i++) {
    plates.push({
      index: i,
      type: PLATE_TYPES[Math.floor(rng() * PLATE_TYPES.length)],
      density: 0.25 + rng() * 0.5,          // 墨点覆盖率
      scale: 0.7 + rng() * 0.7,             // 图案尺度
      ink: S.inks[Math.floor(rng() * S.inks.length)],
      // 套印错位：每版相对基准的微移，模拟手工套印
      offset: { x: (rng() - 0.5) * 0.02, y: (rng() - 0.5) * 0.02 },
    });
  }
  // 套印顺序：先浅后深（按墨色亮度升序，亮墨在上）
  const order = [...plates].sort((a, b) => lum(a.ink) - lum(b.ink)).map(p => p.index);

  return {
    style,
    styleLabel: S.label,
    paper: S.paper,
    inks: S.inks,
    plates,
    order,
    stats: {
      plates: plates.length,
      layers: order.length,
      coverage: plates.reduce((a, p) => a + p.density, 0),
    },
  };
}

function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.6 + (n & 255) * 0.1;
}
