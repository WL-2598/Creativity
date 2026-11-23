/**
 * terrain.js — 裂隙的地形核心（纯逻辑，可独立测试）
 * 种子驱动的分形噪声地形：高度场、等高线级、水系脉络。
 * 每一张山河图都是某颗种子在大地上的拓印。
 */
import { rngFromSeed } from '../../shared/rng.js';

/** 由种子构造确定性二维值噪声 */
export function makeNoise(seed) {
  let s = (seed >>> 0) || 1;
  const hash = (x, y) => {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2246822519)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = h ^ (h >>> 16);
    return (h >>> 0) / 4294967296;
  };
  // 双线性插值 + 平滑
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };
}

/** 分形布朗运动：叠加多层噪声，制造自然的地形起伏 */
export function fbm(noise, x, y, octaves = 5, lacunarity = 2, gain = 0.5) {
  let amp = 0.5, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}

/**
 * 生成地形高度场。
 * @returns {{width, height, grid: Float32Array, seed}}
 */
export function generateTerrain(seed, width = 160, height = 110) {
  const noise = makeNoise(seed);
  const grid = new Float32Array(width * height);
  // 域变形（domain warp）：让山脊与谷地更自然
  const warp = (x, y) => fbm(noise, x + 3.1, y + 1.7, 3);
  let min = 1, max = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const wx = x / width * 4 + warp(x / width * 3, y / height * 3) * 1.5;
      const wy = y / height * 4 + warp(x / width * 3 + 9.2, y / height * 3) * 1.5;
      const h = fbm(noise, wx, wy, 6);
      const v = Math.max(0, Math.min(1, h));
      grid[y * width + x] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  // 归一化到 [0,1]（钳制浮点残尘）
  if (max > min) {
    for (let i = 0; i < grid.length; i++) {
      grid[i] = Math.min(1, Math.max(0, (grid[i] - min) / (max - min)));
    }
  }
  return { width, height, grid, seed: seed >>> 0 };
}

/**
 * 在高度场上寻径水系：从高处沿最陡下降走到低处。
 * @returns {Array<{points: Array<{x,y}>}>}
 */
export function findRivers(terrain, count = 4) {
  const { width, height, grid } = terrain;
  const rng = rngFromSeed((terrain.seed ^ 0x9e3779b9) >>> 0);
  const rivers = [];
  for (let r = 0; r < count; r++) {
    // 从较高的随机点出发
    let x, y, h;
    for (let attempt = 0; attempt < 20; attempt++) {
      x = Math.floor(rng() * width);
      y = Math.floor(rng() * height);
      h = grid[y * width + x];
      if (h > 0.62) break;
    }
    if (h <= 0.62) continue;
    const pts = [{ x, y }];
    let cx = x, cy = y;
    for (let step = 0; step < 300; step++) {
      // 8 邻域最陡下降
      let bestD = 0, bx = cx, by = cy;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const nh = grid[ny * width + nx];
          const d = grid[cy * width + cx] - nh;
          if (d > bestD) { bestD = d; bx = nx; by = ny; }
        }
      }
      if (bestD < 1e-4) break;          // 到达平原，止息
      cx = bx; cy = by;
      pts.push({ x: cx, y: cy });
      if (grid[cy * width + cx] < 0.34) break;  // 汇入低地
      if (pts.length > 1 && pts[pts.length - 2].x === cx && pts[pts.length - 2].y === cy) break;
    }
    if (pts.length > 4) rivers.push({ points: pts });
  }
  return rivers;
}

/** 等高线级（供绘制） */
export const CONTOUR_LEVELS = [0.12, 0.22, 0.32, 0.42, 0.52, 0.62, 0.72, 0.82, 0.92];

/** 地形统计（供测试与信息显示） */
export function terrainStats(terrain) {
  const { grid } = terrain;
  let sum = 0, max = 0, min = 1;
  for (let i = 0; i < grid.length; i++) {
    sum += grid[i];
    if (grid[i] > max) max = grid[i];
    if (grid[i] < min) min = grid[i];
  }
  return { mean: sum / grid.length, max, min, range: max - min };
}
