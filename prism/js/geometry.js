/**
 * geometry.js — 棱镜的几何核心（纯逻辑，可独立测试）
 * 种子驱动的递归几何生长：从中心出发，按种子决定的角度、长度、
 * 线宽逐层分生，再施以 m 重对称，形成精密的几何构图。
 */
import { rngFromSeed, clamp } from '../../shared/rng.js';

/**
 * 生成几何构图。
 * @param {number} seed 种子
 * @param {{symmetry:number, depth:number}} params 对称数与递归深度
 * @returns {{elements:Array, seed:number}}
 *   element: { kind:'line'|'poly'|'arc', points:[{x,y}|{x,y,r}], width, color, depth }
 */
export function generateGeometry(seed, params) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const symmetry = clamp(Math.round(params.symmetry) || 6, 2, 12);
  const depth = clamp(Math.round(params.depth) || 3, 1, 6);

  // 以中心为原点生成单瓣结构
  const petal = [];
  const root = { x: 0, y: 0 };

  /** 递归分生：每个节点按种子生成若干子节点 */
  function grow(x, y, angle, length, width, depth_, color) {
    if (depth_ <= 0 || length < 2) return;
    // 当前段的终点
    const ex = x + Math.cos(angle) * length;
    const ey = y + Math.sin(angle) * length;
    petal.push({ kind: 'line', points: [{ x, y }, { x: ex, y: ey }], width, color, depth: depth_ });

    // 分叉数与角度（种子决定，越深越收敛）
    const branches = depth_ >= 3 ? (rng() < 0.5 ? 2 : 3) : 2;
    const spread = (0.5 + rng() * 0.7) * (depth_ / depth);
    for (let i = 0; i < branches; i++) {
      const t = branches === 1 ? 0.5 : i / (branches - 1);
      const childAngle = angle + (t - 0.5) * spread + (rng() - 0.5) * 0.3;
      const childLen = length * (0.55 + rng() * 0.25);
      grow(ex, ey, childAngle, childLen, width * (0.72 + rng() * 0.1), depth_ - 1,
        depth_ % 3 === 0 ? (color + 1) % 4 : color);
    }

    // 偶发的闭合多边形（花/叶）
    if (depth_ === Math.floor(depth / 2) && rng() < 0.35) {
      const sides = 3 + Math.floor(rng() * 4);
      const pts = [];
      const r = length * 0.4;
      for (let i = 0; i < sides; i++) {
        const a = angle + (i / sides) * Math.PI * 2 + rng() * 0.2;
        pts.push({ x: ex + Math.cos(a) * r, y: ey + Math.sin(a) * r });
      }
      petal.push({ kind: 'poly', points: pts, width: width * 0.8, color: (color + 2) % 4, depth: depth_ });
    }
    // 偶发的弧
    if (depth_ >= 2 && rng() < 0.18) {
      petal.push({
        kind: 'arc',
        points: [{ x: ex, y: ey, r: length * (0.3 + rng() * 0.3), a0: angle - 0.6, a1: angle + 0.6 }],
        width: width * 0.7, color: (color + 3) % 4, depth: depth_,
      });
    }
  }

  // 根枝：多条主脉
  const mains = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < mains; i++) {
    const a = (i / mains) * Math.PI * 2 + rng() * 0.4;
    grow(root.x, root.y, a, 90 + rng() * 40, 2.4, depth, 0);
  }

  // 施以 m 重对称
  const elements = [];
  for (let s = 0; s < symmetry; s++) {
    const rot = (s / symmetry) * Math.PI * 2;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    for (const el of petal) {
      elements.push({
        ...el,
        points: el.points.map(p => ({
          x: p.x * cos - p.y * sin,
          y: p.x * sin + p.y * cos,
          ...(p.r !== undefined ? { r: p.r, a0: p.a0 + rot, a1: p.a1 + rot } : {}),
        })),
      });
    }
  }

  return { elements, seed: seed >>> 0, symmetry, depth };
}

/** 构图的包围半径（供渲染缩放） */
export function compositionRadius(elements) {
  let max = 1;
  for (const el of elements) {
    for (const p of el.points) {
      const d = Math.hypot(p.x, p.y);
      if (d > max) max = d;
    }
  }
  return max;
}
