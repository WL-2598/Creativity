/**
 * firework.js — 焰火的核心（纯逻辑，可独立测试）
 * 种子裁决一组焰火：发射延迟、爆点高度、粒子数、色彩与二次爆裂。
 */
import { rngFromSeed } from '../../shared/rng.js';

export const FIREWORK_TONES = {
  festival: { label: '节庆', palette: ['#ff5a5a', '#ffd166', '#6ee7b7', '#78c8ff', '#e0a8ff'] },
  ocean: { label: '海蓝', palette: ['#3aa0ff', '#6ee7ff', '#a8d8ff', '#5a8aff', '#c8f0ff'] },
  amber: { label: '琥珀', palette: ['#ffb347', '#ff8c42', '#ffd166', '#ff6b6b', '#ffe8b0'] },
  jade: { label: '青玉', palette: ['#34d399', '#6ee7b7', '#a7f3d0', '#5eead4', '#d1fae5'] },
};

/**
 * 生成一组焰火。
 * @param {number} seed
 * @param {{tone?: string, count?: number}} opts
 */
export function generateFireworks(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const tones = Object.keys(FIREWORK_TONES);
  const tone = opts.tone && FIREWORK_TONES[opts.tone] ? opts.tone : tones[Math.floor(rng() * tones.length)];
  const T = FIREWORK_TONES[tone];

  const count = Math.min(12, Math.max(2, opts.count ?? 4 + Math.floor(rng() * 5)));
  const fireworks = [];
  for (let i = 0; i < count; i++) {
    fireworks.push({
      delay: i * (0.4 + rng() * 0.9),          // 发射延迟（秒）
      x: 0.15 + rng() * 0.7,                    // 横向位置
      explodeY: 0.18 + rng() * 0.3,             // 爆点高度（自顶向下）
      particles: 40 + Math.floor(rng() * 90),   // 粒子数
      color: T.palette[Math.floor(rng() * T.palette.length)],
      secondary: rng() < 0.35,                  // 是否二次爆裂
      gravity: 0.25 + rng() * 0.4,              // 重力
      trail: 0.5 + rng() * 0.5,                 // 拖尾长度
    });
  }
  // 延迟单调不减（保证发射次序稳定）
  fireworks.sort((a, b) => a.delay - b.delay);

  const totalParticles = fireworks.reduce((a, f) => a + f.particles * (f.secondary ? 2 : 1), 0);
  return {
    tone,
    toneLabel: T.label,
    palette: T.palette,
    fireworks,
    stats: {
      count: fireworks.length,
      particles: totalParticles,
      withSecondary: fireworks.filter(f => f.secondary).length,
      maxDelay: fireworks[fireworks.length - 1].delay,
    },
  };
}
