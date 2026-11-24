/**
 * glitch.js — 光斑的故障核心（纯逻辑，可独立测试）
 * 种子裁决一帧故障画面：源图形、行位移带、色散强度、扫描线与噪点。
 */
import { rngFromSeed } from '../../shared/rng.js';

export const GLITCH_SCENES = {
  signal: { label: '信号', base: ['#0d1b2a', '#1b3a5c', '#2e6a9e'] },
  neon: { label: '霓虹', base: ['#1a0d24', '#4a1a5c', '#8e2e9e'] },
  void: { label: '虚空', base: ['#0a0a12', '#1c1c30', '#3a3a58'] },
  ember: { label: '余烬', base: ['#1a0d08', '#4a2410', '#8e4a20'] },
};

/**
 * 生成一帧故障画面的参数。
 * @param {number} seed
 * @param {{scene?: string, bands?: number, scanlines?: number}} opts
 */
export function generateGlitch(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const scenes = Object.keys(GLITCH_SCENES);
  const scene = opts.scene && GLITCH_SCENES[opts.scene] ? opts.scene : scenes[Math.floor(rng() * scenes.length)];
  const S = GLITCH_SCENES[scene];

  // 行位移带：每条带覆盖一段行区间，整体横向位移
  const bandCount = Math.min(14, Math.max(2, opts.bands ?? 3 + Math.floor(rng() * 6)));
  const bands = [];
  for (let i = 0; i < bandCount; i++) {
    bands.push({
      y: rng(),                                   // 带中心（归一化）
      h: 0.01 + rng() * 0.09,                     // 带高（归一化）
      shift: (rng() - 0.5) * 0.12,                // 横向位移（归一化）
      rgb: rng() < 0.5 ? 1 : -1,                  // 位移方向的通道变体
      amp: 0.5 + rng() * 1.5,                     // 带强度
    });
  }

  // 色散：RGB 三通道的分离强度
  const chroma = 0.004 + rng() * 0.02;

  // 扫描线
  const scanlines = Math.min(40, Math.max(4, opts.scanlines ?? 10 + Math.floor(rng() * 16)));

  // 噪点密度
  const noise = 0.02 + rng() * 0.12;

  // 数据块：矩形错位块
  const blocks = [];
  const blockCount = Math.floor(rng() * 4);
  for (let i = 0; i < blockCount; i++) {
    blocks.push({
      x: rng(), y: rng(),
      w: 0.04 + rng() * 0.12,
      h: 0.02 + rng() * 0.08,
      shift: (rng() - 0.5) * 0.1,
    });
  }

  return {
    scene,
    sceneLabel: S.label,
    base: S.base,
    bands,
    chroma,
    scanlines,
    noise,
    blocks,
    stats: {
      bands: bands.length,
      scanlines,
      blocks: blocks.length,
      chroma,
      noise,
    },
  };
}
