/**
 * rng.js — 仓库共用随机工具
 * 可播种随机数（mulberry32）：同一颗种子产生完全一致的序列。
 * 各展间共享，保证整个仓库的"种子宇宙"观感统一。
 */

/** 由种子生成确定性随机函数 */
export function rngFromSeed(seed) {
  let a = (seed >>> 0) || 1;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 从 rng 中取一个区间整数 [min, max] */
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** 从带权重的条目中随机取一项：items 为 [{w, ...}] */
export function weightedPick(rng, items) {
  const total = items.reduce((s, it) => s + it.w, 0);
  let r = rng() * total;
  for (const it of items) { r -= it.w; if (r <= 0) return it; }
  return items[items.length - 1];
}

/** 数值钳制 */
export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

/** 生成一个随机种子 */
export function randomSeed() {
  return Math.floor(Math.random() * 0xFFFFFFFF);
}
