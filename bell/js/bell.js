/**
 * bell.js — 钟磬的乐律核心（纯逻辑，可独立测试）
 * 种子架起一列编钟：钟体大小定音高，敲击序列成曲。
 */
import { rngFromSeed } from '../../shared/rng.js';

/** 三套五声音阶（宫调 / 羽调 / 角调），各 5 音，频率为基音的整数倍 */
export const BELL_SCALES = {
  gong: { label: '宫调', base: 261.63, ratios: [1, 9 / 8, 6 / 5, 5 / 4, 3 / 2] },
  yu: { label: '羽调', base: 293.66, ratios: [1, 9 / 8, 6 / 5, 4 / 3, 3 / 2] },
  jue: { label: '角调', base: 329.63, ratios: [1, 10 / 9, 5 / 4, 4 / 3, 3 / 2] },
};

/**
 * 生成一列编钟。
 * @param {number} seed
 * @param {{scale?: string, count?: number}} opts scale: 调式；count: 钟数
 */
export function generateBells(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const scaleKeys = Object.keys(BELL_SCALES);
  const scale = opts.scale && BELL_SCALES[opts.scale] ? opts.scale : scaleKeys[Math.floor(rng() * scaleKeys.length)];
  const S = BELL_SCALES[scale];

  const count = Math.min(10, Math.max(3, opts.count ?? 4 + Math.floor(rng() * 4)));

  // 从音阶中取音（可重复），由种子决定
  const toneOrder = [];
  for (let i = 0; i < count; i++) {
    toneOrder.push(Math.floor(rng() * 5));
  }

  // 先定音，再由音高定钟体尺寸：钟体越大音越低
  const bells = toneOrder.map((tone, i) => {
    const freq = S.base * S.ratios[tone];
    const h = Math.max(0.08, Math.min(0.3, 0.32 * S.base / freq));
    const w = Math.max(0.04, Math.min(0.09, 0.1 * S.base / freq));
    return { index: i, freq, tone, ratio: S.ratios[tone], h, w };
  });
  // 按音高由低到高、从左到右排列（编钟之制）
  bells.sort((a, b) => a.freq - b.freq);
  bells.forEach((b, i) => {
    b.index = i;
    b.x = 0.18 + (i / (bells.length - 1 || 1)) * 0.64;
    b.y = 0.42;
  });

  // 敲击序列（小曲）：若干拍，每拍指定敲击的钟与力度
  const melody = [];
  const beats = 8 + Math.floor(rng() * 8);
  let cur = Math.floor(rng() * count);
  for (let i = 0; i < beats; i++) {
    const next = i === 0 ? cur : (cur + 1 + Math.floor(rng() * 3)) % count;
    cur = next;
    melody.push({ beat: i, bell: cur, force: 0.5 + rng() * 0.5 });
  }

  return {
    scale,
    scaleLabel: S.label,
    base: S.base,
    bells,
    melody,
    stats: {
      bells: bells.length,
      beats: melody.length,
      minFreq: Math.min(...bells.map(b => b.freq)),
      maxFreq: Math.max(...bells.map(b => b.freq)),
    },
  };
}
