/**
 * mechanism.js — 机枢的机械核心（纯逻辑，可独立测试）
 * 种子裁决一组互相啮合的齿轮：齿数、位置、相位与传动比，外加一只摆锤。
 */
import { rngFromSeed } from '../../shared/rng.js';

/**
 * 生成一套机械机构。
 * 齿轮沿一条折线排布，相邻齿轮相互啮合：
 * 传动比 = 齿数之比，角速度与齿数成反比，转向交替。
 * @param {number} seed 种子
 * @param {{gears?: number, pendulum?: boolean}} opts
 * @returns {{gears, pendulum, stats}}
 */
export function generateMechanism(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const count = Math.min(8, Math.max(3, opts.gears ?? 4 + Math.floor(rng() * 4)));

  // 齿数：从 [12, 40] 取，相邻齿数尽量互质，保证传动比有意思
  const teeth = [];
  for (let i = 0; i < count; i++) {
    let t = 12 + Math.floor(rng() * 28);
    if (i > 0 && Math.abs(t - teeth[i - 1]) < 4) t += 4;
    teeth.push(Math.min(44, t));
  }

  // 切向链式布局：每只齿轮与前一只恰好啮合，安装角避开所有既有齿轮
  const margin = 70;
  const gap = 8;
  const gears = [];
  const MODS = [1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0];
  let x = margin;
  let y = margin;

  for (let i = 0; i < count; i++) {
    let placed = false;
    let best = null; // 兜底：净空最大的候选（保证总有输出）
    // 模数逐档收缩，保证总能在链上找到不重叠的安装角
    for (const mod of MODS) {
      const r = teeth[i] * mod;
      if (i === 0) {
        gears.push({ index: 0, x, y, teeth: teeth[0], radius: r, ratio: 1,
          speed: (0.25 / teeth[0]) * teeth[0], phase: rng() * Math.PI * 2 });
        placed = true;
        break;
      }
      const prev = gears[i - 1];
      const reach = prev.radius + r + gap;
      const base = i * 137.5 * Math.PI / 180 + rng() * 0.6; // 黄金角发散，铺开成螺旋
      for (let a = 0; a < 360; a += 3) {
        const ang = base + a * Math.PI / 180;
        const nx = prev.x + Math.cos(ang) * reach;
        const ny = prev.y + Math.sin(ang) * reach;
        let clearance = Infinity;
        for (const g of gears.slice(0, i - 1)) {
          const d = Math.hypot(g.x - nx, g.y - ny) - (g.radius + r);
          clearance = Math.min(clearance, d);
        }
        if (clearance >= 2) {
          gears.push({
            index: i, x: nx, y: ny, teeth: teeth[i], radius: r,
            ratio: teeth[0] / teeth[i],
            speed: (i % 2 === 0 ? 1 : -1) * (0.25 / teeth[i]) * teeth[0],
            phase: rng() * Math.PI * 2,
          });
          placed = true;
          break;
        }
        if (!best || clearance > best.clearance) best = { x: nx, y: ny, r, teeth: teeth[i], clearance };
      }
      if (placed) break;
    }
    if (!placed && best) {
      // 极端情形兜底：取净空最大的位置（仍与前一齿轮啮合）
      gears.push({
        index: i, x: best.x, y: best.y, teeth: best.teeth, radius: best.r,
        ratio: teeth[0] / best.teeth,
        speed: (i % 2 === 0 ? 1 : -1) * (0.25 / best.teeth) * teeth[0],
        phase: rng() * Math.PI * 2,
      });
    }
  }

  // 摆锤：长度与初相位由种子决定
  const pendulum = opts.pendulum === false ? null : {
    length: 90 + rng() * 120,
    phase: rng() * Math.PI * 2,
    amp: 0.35 + rng() * 0.35,
  };

  const totalTeeth = teeth.reduce((a, b) => a + b, 0);
  return {
    gears,
    pendulum,
    stats: {
      gears: gears.length,
      totalTeeth,
      gearRatio: teeth.reduce((a, b) => a * b, 1) / Math.pow(teeth[0], count - 1),
      hasPendulum: !!pendulum,
    },
  };
}
