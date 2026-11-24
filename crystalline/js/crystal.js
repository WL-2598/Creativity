/**
 * crystal.js — 晶境的生长核心（纯逻辑，可独立测试）
 * 种子驱动的晶体生长模拟：从若干晶种出发，按"邻接生长"规则
 * 逐格蔓延，长成簇簇晶丛。生长次序被记录，供渲染层做生长动画。
 */
import { rngFromSeed, randInt } from '../../shared/rng.js';

/**
 * 生长一丛晶体。
 * @param {number} seed 种子
 * @param {{width:number, height:number, seeds:number, steps:number}} params
 * @returns {{grid: Int32Array, order: Int32Array, clusters:number, width, height}}
 *   grid: 每格的簇编号（0 = 未生长）
 *   order: 每格的生长次序（-1 = 未生长）
 */
export function growCrystals(seed, params) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const { width, height } = params;
  const grid = new Int32Array(width * height);
  const order = new Int32Array(width * height).fill(-1);
  let nextCluster = 1;
  let step = 0;

  const at = (x, y) => (x >= 0 && y >= 0 && x < width && y < height) ? grid[y * width + x] : 0;

  // 播撒晶种
  const seedCount = Math.max(1, Math.min(params.seeds ?? 4, 12));
  for (let i = 0; i < seedCount; i++) {
    let x, y, guard = 0;
    do {
      x = randInt(rng, 0, width - 1);
      y = randInt(rng, 0, height - 1);
      guard++;
    } while (grid[y * width + x] !== 0 && guard < 50);
    if (grid[y * width + x] === 0) {
      grid[y * width + x] = nextCluster++;
      order[y * width + x] = step++;
    }
  }

  // 逐轮生长：空格的邻接晶格越多，越可能结晶
  const maxSteps = params.steps ?? 60;
  for (let s = 0; s < maxSteps; s++) {
    const candidates = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y * width + x] !== 0) continue;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (at(x + dx, y + dy) !== 0) n++;
          }
        }
        if (n >= 1) candidates.push({ x, y, n });   // 邻接越多越易结晶，孤种亦可蔓延
      }
    }
    if (candidates.length === 0) break;
    // 邻接越多越优先（加权随机）
    const total = candidates.reduce((s, c) => s + c.n, 0);
    let r = rng() * total;
    let picked = candidates[candidates.length - 1];
    for (const c of candidates) { r -= c.n; if (r <= 0) { picked = c; break; } }
    // 取邻接簇中最常见者作为归属
    const counts = {};
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cid = at(picked.x + dx, picked.y + dy);
        if (cid) counts[cid] = (counts[cid] || 0) + 1;
      }
    }
    let bestCid = 0, bestC = 0;
    for (const [cid, c] of Object.entries(counts)) {
      if (c > bestC) { bestC = c; bestCid = Number(cid); }
    }
    grid[picked.y * width + picked.x] = bestCid || nextCluster++;
    order[picked.y * width + picked.x] = step++;
  }

  return { grid, order, clusters: nextCluster - 1, width, height, steps: step };
}

/** 统计晶体覆盖率与最大簇 */
export function crystalStats(result) {
  const { grid, width, height } = result;
  let grown = 0;
  const sizes = {};
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] > 0) { grown++; sizes[grid[i]] = (sizes[grid[i]] || 0) + 1; }
  }
  const maxCluster = Object.values(sizes).reduce((a, b) => Math.max(a, b), 0);
  return { coverage: grown / grid.length, grown, maxCluster, clusterCount: Object.keys(sizes).length };
}
