/**
 * lumen.js — 流光的光带核心（纯逻辑，可独立测试）
 * 种子生成若干流光丝带：由种子决定的起点、转向与缠绕，
 * 渲染层赋予其辉光与流动。
 */
import { rngFromSeed, clamp } from '../../shared/rng.js';

/**
 * 生成流光丝带。
 * @param {number} seed 种子
 * @param {{count:number, W:number, H:number}} params 丝带数与画布尺寸
 * @returns {Array<{points:Array, width:number, hue:number, phase:number}>}
 */
export function generateRibbons(seed, params) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const { W, H } = params;
  const count = clamp(params.count ?? 6, 1, 14);
  const ribbons = [];

  for (let i = 0; i < count; i++) {
    let x = rng() * W;
    let y = rng() * H;
    let angle = rng() * Math.PI * 2;
    const points = [];
    const steps = 40 + Math.floor(rng() * 40);
    const speed = 2 + rng() * 3;
    const turnRate = (0.04 + rng() * 0.09) * (rng() < 0.5 ? 1 : -1);
    for (let s = 0; s < steps; s++) {
      points.push({ x, y });
      angle += turnRate + (rng() - 0.5) * 0.05;
      x += Math.cos(angle) * speed;
      y += Math.sin(angle) * speed;
      // 边界回绕，丝带绵延不断
      if (x < -20) x = W + 20; if (x > W + 20) x = -20;
      if (y < -20) y = H + 20; if (y > H + 20) y = -20;
    }
    ribbons.push({
      points,
      width: 1.5 + rng() * 3.5,
      hue: rng(),
      phase: rng() * Math.PI * 2,
      flow: 0.3 + rng() * 0.8,
    });
  }
  return ribbons;
}

/** 计算光带的包围盒（供测试与布局） */
export function ribbonBounds(ribbons) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of ribbons) {
    for (const p of r.points) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
  }
  return { minX, minY, maxX, maxY };
}
