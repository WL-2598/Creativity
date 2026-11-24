/**
 * halo.js — 晕境的光学核心（纯逻辑，可独立测试）
 * 种子裁决一处大气场景：光源、雾滴与光学环带（日晕、主虹、副虹、星芒）。
 */
import { rngFromSeed } from '../../shared/rng.js';

/** 光学常数：主虹 42°、副虹 51°、日晕 22°（相对光源的角半径） */
export const OPTICAL_ANGLES = { primary: 42, secondary: 51, corona: 22 };

export const HALO_SCENES = {
  sun: { label: '晴日', light: '#ffd98a', glow: 'rgba(255, 200, 120, 0.5)' },
  moon: { label: '清月', light: '#d8e4f5', glow: 'rgba(180, 210, 240, 0.45)' },
  mist: { label: '雾晨', light: '#e8eef5', glow: 'rgba(220, 235, 250, 0.4)' },
};

/**
 * 生成一处大气光学场景。
 * @param {number} seed
 * @param {{scene?: string, drops?: number, rays?: number}} opts
 */
export function generateHalo(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const scenes = Object.keys(HALO_SCENES);
  const scene = opts.scene && HALO_SCENES[opts.scene] ? opts.scene : scenes[Math.floor(rng() * scenes.length)];
  const S = HALO_SCENES[scene];

  // 光源位置：偏置但留有完整天空
  const light = {
    x: 0.25 + rng() * 0.5,
    y: 0.18 + rng() * 0.35,
    r: 26 + rng() * 26,
  };

  // 环带：从内到外依次为日晕（白）、主虹、副虹，色序符合物理
  const rings = [
    { kind: 'corona', angle: OPTICAL_ANGLES.corona, width: 3, color: 'rgba(240, 245, 255, 0.5)' },
    { kind: 'primary', angle: OPTICAL_ANGLES.primary, width: 8,
      color: 'rgba(255, 90, 70, 0.55)', inner: 'rgba(180, 60, 200, 0.55)' },
    { kind: 'secondary', angle: OPTICAL_ANGLES.secondary, width: 6,
      color: 'rgba(180, 60, 200, 0.4)', inner: 'rgba(255, 90, 70, 0.4)' },
  ];

  // 星芒：从光源射出的光线
  const rayCount = Math.min(16, Math.max(4, opts.rays ?? 6 + Math.floor(rng() * 6)));
  const rays = [];
  for (let i = 0; i < rayCount; i++) {
    rays.push({
      angle: i * (Math.PI * 2 / rayCount) + rng() * 0.2,
      length: 0.25 + rng() * 0.4,
      width: 1 + rng() * 2,
      alpha: 0.15 + rng() * 0.25,
    });
  }

  // 雾滴：漂浮的光点
  const dropCount = Math.min(160, Math.max(40, opts.drops ?? 60 + Math.floor(rng() * 60)));
  const drops = [];
  for (let i = 0; i < dropCount; i++) {
    drops.push({
      x: rng(), y: rng(),
      r: 0.6 + rng() * 2,
      tw: rng() * Math.PI * 2,
    });
  }

  return {
    scene,
    sceneLabel: S.label,
    light,
    rings,
    rays,
    drops,
    lightColor: S.light,
    glowColor: S.glow,
    stats: {
      rings: rings.length,
      rays: rays.length,
      drops: drops.length,
      hasRainbow: rings.some(r => r.kind === 'primary'),
    },
  };
}
