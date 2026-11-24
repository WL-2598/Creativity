/**
 * shadow.js — 影戏的皮影核心（纯逻辑，可独立测试）
 * 种子布下几具皮影骨架：关节、肢长由种子裁决，灯火游走，影子被光拉长。
 */
import { rngFromSeed } from '../../shared/rng.js';

export const SHADOW_TONES = {
  qing: { label: '青鸾', light: '#7ec8e8', shadow: 'rgba(110, 190, 230, 0.55)', glow: 'rgba(140, 210, 240, 0.35)' },
  zhu: { label: '朱砂', light: '#e8a06a', shadow: 'rgba(230, 150, 90, 0.55)', glow: 'rgba(240, 170, 110, 0.35)' },
  mo: { label: '墨玉', light: '#c8b0e8', shadow: 'rgba(180, 150, 220, 0.55)', glow: 'rgba(190, 160, 230, 0.35)' },
};

/** 由皮影参数计算全部关节点（纯函数，可测试） */
export function puppetJoints(p) {
  const { x, y, torsoLen, headR, armU, armL, legU, legL, a1, a2, b1, b2 } = p;
  const hip = { x, y, w: torsoLen * 0.4 };
  const shoulder = { x, y: y - torsoLen, w: torsoLen * 0.32 };
  const head = { x, y: y - torsoLen - headR * 1.6, w: headR };
  const elbowR = { x: shoulder.x + Math.sin(a1) * armU, y: shoulder.y + Math.cos(a1) * armU, w: armU * 0.5 };
  const handR = { x: elbowR.x + Math.sin(a2) * armL, y: elbowR.y + Math.cos(a2) * armL, w: armL * 0.4 };
  const elbowL = { x: shoulder.x - Math.sin(a1) * armU, y: shoulder.y + Math.cos(a1) * armU, w: armU * 0.5 };
  const handL = { x: elbowL.x - Math.sin(a2) * armL, y: elbowL.y + Math.cos(a2) * armL, w: armL * 0.4 };
  const kneeR = { x: hip.x + Math.sin(b1) * legU, y: hip.y + Math.cos(b1) * legU, w: legU * 0.5 };
  const footR = { x: kneeR.x + Math.sin(b2) * legL, y: kneeR.y + Math.cos(b2) * legL, w: legL * 0.4 };
  const kneeL = { x: hip.x - Math.sin(b1) * legU, y: hip.y + Math.cos(b1) * legU, w: legU * 0.5 };
  const footL = { x: kneeL.x - Math.sin(b2) * legL, y: kneeL.y + Math.cos(b2) * legL, w: legL * 0.4 };
  return { hip, shoulder, head, elbowR, handR, elbowL, handL, kneeR, footR, kneeL, footL };
}

/**
 * 将一点投影到幕底（地面）上的影子横坐标。
 * 灯在 (lx, ly)，幕底在 screenY；影子与灯的方位相反，越远越高影越长。
 */
export function projectShadowX(px, py, lx, ly, screenY) {
  return px + (px - lx) * (screenY - py) / (screenY - ly);
}

/**
 * 生成几具皮影。
 * @param {number} seed
 * @param {{count?: number, tone?: string}} opts
 */
export function generatePuppets(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const toneKeys = Object.keys(SHADOW_TONES);
  const tone = opts.tone && SHADOW_TONES[opts.tone] ? opts.tone : toneKeys[Math.floor(rng() * toneKeys.length)];
  const T = SHADOW_TONES[tone];

  const count = Math.min(5, Math.max(1, opts.count ?? 2 + Math.floor(rng() * 2)));
  const puppets = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1 || 1);
    puppets.push({
      x: 0.2 + t * 0.55 + (rng() - 0.5) * 0.05,
      y: 0.66,
      scale: 0.85 + rng() * 0.35,
      torsoLen: 0.2 + rng() * 0.1,
      headR: 0.025 + rng() * 0.015,
      armU: 0.09 + rng() * 0.05,
      armL: 0.08 + rng() * 0.04,
      legU: 0.1 + rng() * 0.05,
      legL: 0.09 + rng() * 0.04,
      a1: (rng() - 0.5) * 2.2,
      a2: (rng() - 0.5) * 2.4,
      b1: (rng() - 0.5) * 1.0,
      b2: (rng() - 0.5) * 2.0,
    });
  }

  return {
    tone,
    toneLabel: T.label,
    light: T.light,
    shadow: T.shadow,
    glow: T.glow,
    puppets,
    stats: {
      puppets: puppets.length,
      joints: puppets.length * 11,
    },
  };
}
