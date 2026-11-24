/**
 * tea.js — 茶境的茶席核心（纯逻辑，可独立测试）
 * 种子裁决一席茶：席布、茶器、香炉、花插与茶点，布局合于主客之仪。
 */
import { rngFromSeed } from '../../shared/rng.js';

export const CLOTH_COLORS = {
  indigo: { label: '靛席', color: '#2a3a52' },
  sand: { label: '素席', color: '#6a5a48' },
  moss: { label: '苔席', color: '#3a4a38' },
  plum: { label: '梅席', color: '#4a2a38' },
};

export const GLAZES = {
  celadon: { label: '青瓷', color: '#8ab89a' },
  white: { label: '白瓷', color: '#e8e4dc' },
  black: { label: '黑釉', color: '#3a3a40' },
  amber: { label: '琥珀', color: '#a8763a' },
};

/**
 * 生成一席茶。
 * @param {number} seed
 * @param {{guests?: number, cloth?: string}} opts guests: 客位数（盏数）
 */
export function generateTeaSet(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const clothKeys = Object.keys(CLOTH_COLORS);
  const cloth = opts.cloth && CLOTH_COLORS[opts.cloth] ? opts.cloth : clothKeys[Math.floor(rng() * clothKeys.length)];
  const C = CLOTH_COLORS[cloth];

  const glazeKeys = Object.keys(GLAZES);
  const glaze = glazeKeys[Math.floor(rng() * glazeKeys.length)];
  const G = GLAZES[glaze];

  // 主位：茶壶居中偏后
  const teapot = {
    type: 'teapot', x: 0.5, y: 0.38,
    r: 0.06 + rng() * 0.02,
    glaze, glazeLabel: G.label, glazeColor: G.color,
  };

  // 客位：茶盏列于前方，避开两侧香炉/花插，左右分列
  const guests = Math.min(8, Math.max(2, opts.guests ?? 3 + Math.floor(rng() * 3)));
  const cups = [];
  const half = Math.ceil(guests / 2);
  for (let i = 0; i < guests; i++) {
    const side = i < half ? -1 : 1;
    const idx = i < half ? i : guests - 1 - i;
    cups.push({
      type: 'cup',
      x: 0.5 + side * (0.13 + idx * 0.055),
      y: 0.62 + Math.abs(idx - (guests - 1) / 2) * 0.02,
      r: 0.02 + rng() * 0.004,
      glaze, glazeLabel: G.label, glazeColor: G.color,
    });
  }

  // 茶托（壶下）
  const coaster = {
    type: 'coaster', x: teapot.x, y: teapot.y + 0.05, r: teapot.r * 1.5,
    glaze, glazeLabel: G.label, glazeColor: G.color,
  };

  // 香炉：侧旁（釉色独立抽取）
  const censerGlazeKey = glazeKeys[Math.floor(rng() * glazeKeys.length)];
  const censer = {
    type: 'censer', x: 0.11 + rng() * 0.03, y: 0.58 + rng() * 0.06,
    r: 0.02 + rng() * 0.004,
    glaze: censerGlazeKey,
    glazeLabel: GLAZES[censerGlazeKey].label,
  };

  // 花插：另一侧（釉色独立抽取）
  const vaseGlazeKey = glazeKeys[Math.floor(rng() * glazeKeys.length)];
  const vase = {
    type: 'vase', x: 0.87 - rng() * 0.02, y: 0.58 + rng() * 0.06,
    r: 0.02 + rng() * 0.004,
    glaze: vaseGlazeKey,
    glazeLabel: GLAZES[vaseGlazeKey].label,
  };

  // 茶点：盏列之间
  const sweets = [];
  const sweetCount = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < sweetCount; i++) {
    sweets.push({
      type: 'sweet',
      x: 0.35 + rng() * 0.3,
      y: 0.74 + rng() * 0.1,
      r: 0.012 + rng() * 0.008,
    });
  }

  const vessels = [teapot, ...cups, coaster, censer, vase];
  return {
    cloth,
    clothLabel: C.label,
    clothColor: C.color,
    glaze,
    glazeLabel: G.label,
    glazeColor: G.color,
    vessels,
    sweets,
    stats: {
      cups: cups.length,
      vessels: vessels.length,
      sweets: sweets.length,
      guests: guests,
    },
  };
}
