/**
 * sand.js — 沙盘的沙粒核心（纯逻辑，可独立测试）
 * 种子裁决一处沙境：高度图地形与一处沙源。
 * 元胞法则（确定性）：沙粒从高处滑向相邻低处，单步逐列扫描，
 * 稳定态满足相邻高度差 ≤ 1，总沙量守恒。
 */
import { rngFromSeed } from '../../shared/rng.js';

/**
 * 生成沙境初始状态。
 * @param {number} seed
 * @param {{width?: number, height?: number, source?: number}} opts source: 沙源所在列
 */
export function generateSandscape(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const w = Math.max(8, Math.min(120, opts.width ?? 40 + Math.floor(rng() * 30)));
  const h = Math.max(6, Math.min(80, opts.height ?? 24 + Math.floor(rng() * 20)));

  // 初始地形：多峰沙丘起伏
  const heights = new Uint16Array(w);
  const peaks = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < w; i++) {
    let base = h * 0.35;
    for (let p = 0; p < peaks; p++) {
      const cx = (w / (peaks + 1)) * (p + 1) + (rng() - 0.5) * w * 0.1;
      const amp = h * (0.2 + rng() * 0.35);
      base += Math.exp(-((i - cx) ** 2) / (w * 0.09)) * amp * (0.6 + rng() * 0.4);
    }
    heights[i] = Math.max(0, Math.min(h - 1, Math.round(base)));
  }

  const source = Math.max(1, Math.min(w - 2, opts.source ?? Math.floor(rng() * (w - 2)) + 1));

  const total = [...heights].reduce((a, b) => a + b, 0);
  return {
    width: w,
    height: h,
    heights,
    source,
    stats: {
      cells: w,
      sand: total,
      peak: Math.max(...heights),
      valley: Math.min(...heights),
    },
  };
}

/**
 * 元胞更新一步：沙粒从高处滑向相邻低处。
 * 规则（确定性）：先从左向右扫描，把一格沙滑向较低的右侧；
 * 随后从右向左扫描，但跳过刚接收沙粒的列，避免来回抵消，保证收敛。
 * @returns {boolean} 本步是否发生了移动
 */
export function stepSand(state) {
  const { heights, width } = state;
  let moved = false;
  const justFilled = new Uint8Array(width);
  // 左 → 右
  for (let x = 0; x < width - 1; x++) {
    if (heights[x] > 0 && heights[x] - heights[x + 1] >= 2) {
      heights[x] -= 1;
      heights[x + 1] += 1;
      justFilled[x + 1] = 1;
      moved = true;
    }
  }
  // 右 → 左（跳过刚接收沙粒的列）
  for (let x = width - 1; x > 0; x--) {
    if (justFilled[x]) continue;
    if (heights[x] > 0 && heights[x] - heights[x - 1] >= 2) {
      heights[x] -= 1;
      heights[x - 1] += 1;
      justFilled[x - 1] = 1;
      moved = true;
    }
  }
  return moved;
}

/** 是否达到稳定态：任意相邻高度差 ≤ 1 */
export function isStable(state) {
  const { heights, width } = state;
  for (let x = 0; x < width - 1; x++) {
    if (Math.abs(heights[x] - heights[x + 1]) > 1) return false;
  }
  return true;
}

/** 沙量守恒校验 */
export function sandTotal(state) {
  return [...state.heights].reduce((a, b) => a + b, 0);
}
