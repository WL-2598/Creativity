/**
 * pattern.js — 织理的图案核心（纯逻辑，可独立测试）
 * 种子裁决三类图案：编织（经纬交织）、瓷砖（马赛克镶嵌）、曼陀罗（旋转对称）。
 */
import { rngFromSeed } from '../../shared/rng.js';

export const PATTERN_KINDS = {
  weave: { label: '编织' },
  tile: { label: '瓷砖' },
  mandala: { label: '曼陀罗' },
};

/**
 * 生成图案描述。
 * @param {number} seed
 * @param {{kind?: string, size?: number}} opts size: 编织/瓷砖为网格边长，曼陀罗为层数
 */
export function generatePattern(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const kinds = Object.keys(PATTERN_KINDS);
  const kind = opts.kind && PATTERN_KINDS[opts.kind] ? opts.kind : kinds[Math.floor(rng() * kinds.length)];

  if (kind === 'weave') return _weave(rng, opts.size ?? 14 + Math.floor(rng() * 8));
  if (kind === 'tile') return _tile(rng, opts.size ?? 8 + Math.floor(rng() * 8));
  return _mandala(rng, opts.size ?? 4 + Math.floor(rng() * 4));
}

/** 编织：每格是经线在纬线上（1）还是纬线在经线上（0），相邻格有合理过渡 */
function _weave(rng, size) {
  const cells = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      // 以棋盘为底 + 随机扰动，保证交织规律与偶然并存
      row.push(((x + y) % 2) ^ (rng() < 0.22 ? 1 : 0));
    }
    cells.push(row);
  }
  // 颜色：经线/纬线双色 + 底色
  return {
    kind: 'weave',
    kindLabel: PATTERN_KINDS.weave.label,
    size,
    cells,
    colors: { warp: '#c9a86a', weft: '#5a7a9a', ground: '#1c2028' },
    stats: { cells: size * size },
  };
}

/** 瓷砖：每个格子填一种瓷砖类型（1~4），类型分布均衡 */
function _tile(rng, size) {
  const palette = ['#e07a5f', '#3d5a80', '#81b29a', '#f2cc8f'];
  const cells = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      row.push(1 + Math.floor(rng() * 4));
    }
    cells.push(row);
  }
  return {
    kind: 'tile',
    kindLabel: PATTERN_KINDS.tile.label,
    size,
    cells,
    palette,
    stats: { cells: size * size, colors: palette.length },
  };
}

/** 曼陀罗：旋转对称的分层图案，每层有元素类型与数量 */
function _mandala(rng, layers) {
  const palette = ['#ff9a8b', '#f6d365', '#8ce99a', '#74c0fc', '#b197fc', '#f783ac'];
  const rings = [];
  for (let l = 0; l < layers; l++) {
    const symmetry = 6 + Math.floor(rng() * 6); // 6~11 重对称
    rings.push({
      radius: 0.35 + l * 0.16,
      symmetry,
      element: rng() < 0.5 ? 'petal' : 'dot',
      color: palette[Math.floor(rng() * palette.length)],
    });
  }
  return {
    kind: 'mandala',
    kindLabel: PATTERN_KINDS.mandala.label,
    layers,
    rings,
    palette,
    stats: { rings: layers, symmetry: rings[0] ? rings[0].symmetry : 0 },
  };
}
