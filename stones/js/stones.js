/**
 * stones.js — 石阵的核心（纯逻辑，可独立测试）
 * 种子裁决一处巨石阵：石柱群的位置、形制，以及日轨与阴影法则。
 * 约定：方位角 0 = 正东，逆时针增大；高度角 0 = 地平，π/2 = 天顶。
 */
import { rngFromSeed } from '../../shared/rng.js';

export const STONE_ERAS = {
  dusk: { label: '暮色', sun: { az0: 1.6, az1: 3.4, elev: 0.35 } },
  noon: { label: '正午', sun: { az0: 0.9, az1: 2.2, elev: 1.1 } },
  dawn: { label: '晨光', sun: { az0: -0.6, az1: 0.9, elev: 0.5 } },
};

/**
 * 生成一处石阵。
 * @param {number} seed
 * @param {{era?: string, count?: number}} opts
 */
export function generateStoneField(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const eras = Object.keys(STONE_ERAS);
  const era = opts.era && STONE_ERAS[opts.era] ? opts.era : eras[Math.floor(rng() * eras.length)];
  const E = STONE_ERAS[era];

  // 石柱：以圆心为原点的极坐标分布，避免重叠
  const count = Math.min(16, Math.max(4, opts.count ?? 6 + Math.floor(rng() * 6)));
  const stones = [];
  const placed = [];
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0;
    for (let tries = 0; tries < 20; tries++) {
      const ang = rng() * Math.PI * 2;
      const rad = 0.08 + Math.pow(rng(), 0.6) * 0.3;
      x = 0.5 + Math.cos(ang) * rad;
      y = 0.5 + Math.sin(ang) * rad;
      if (placed.every(p => Math.hypot(p.x - x, p.y - y) > 0.09)) break;
    }
    placed.push({ x, y });
    stones.push({
      x, y,
      h: 0.16 + rng() * 0.3,            // 柱高（归一化）
      w: 0.02 + rng() * 0.025,          // 柱宽
      tilt: (rng() - 0.5) * 0.25,       // 倾角（弧度）
    });
  }

  // 日轨：太阳在弧线上巡行
  const sun = { ...E.sun };

  // 中心祭坛
  const altar = { x: 0.5, y: 0.5, r: 0.03 + rng() * 0.02 };

  return {
    era,
    eraLabel: E.label,
    stones,
    altar,
    sun,
    stats: {
      stones: stones.length,
      era: era,
      sunRange: sun.az1 - sun.az0,
    },
  };
}

/**
 * 计算某石柱在给定太阳位置下的阴影。
 * 影子方向与太阳方位相反，长度 = 柱高 / tan(高度角)。
 * @returns {{dx, dy, len}} 归一化阴影向量与长度
 */
export function shadowOf(stone, sunAz, sunElev) {
  const elev = Math.max(0.02, Math.min(Math.PI / 2 - 0.02, sunElev));
  const len = Math.min(1.5, stone.h / Math.tan(elev));
  // 影子指向太阳方位的反方向
  const dir = sunAz + Math.PI;
  return {
    dx: Math.cos(dir) * len,
    dy: Math.sin(dir) * len,
    len,
  };
}
