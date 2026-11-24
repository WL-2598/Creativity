/**
 * melody.js — 声境的乐谱核心（纯逻辑，可独立测试）
 * 种子裁决一段五声音阶旋律：调式、节拍、音高游走与和声进行。
 */
import { rngFromSeed } from '../../shared/rng.js';

export const SCALE_TYPES = {
  pentatonic: { label: '五声', intervals: [0, 2, 4, 7, 9] },
  minor: { label: '小调', intervals: [0, 2, 3, 5, 7, 8, 10] },
  dorian: { label: '多利亚', intervals: [0, 2, 3, 5, 7, 9, 10] },
  lydian: { label: '利底亚', intervals: [0, 2, 4, 6, 7, 9, 11] },
};

/**
 * 生成一段乐谱。
 * 旋律以「音高游走」生成：多数步进，偶尔跳进，避免机械随机。
 * @param {number} seed
 * @param {{style?: string, bars?: number, bpm?: number}} opts
 */
export function generateScore(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const styleKeys = Object.keys(SCALE_TYPES);
  const style = opts.style && SCALE_TYPES[opts.style] ? opts.style : styleKeys[Math.floor(rng() * styleKeys.length)];
  const S = SCALE_TYPES[style];

  const bpm = Math.round(opts.bpm ?? (52 + rng() * 40));
  const beat = 60 / bpm;
  const bars = Math.max(2, Math.min(16, opts.bars ?? 4 + Math.floor(rng() * 8)));

  // 主音：种子决定根音（MIDI 55~72，即 A3~C5 一带）
  const root = 55 + Math.floor(rng() * 18);
  const scale = S.intervals.map(iv => root + iv);

  // 旋律：以节拍为单位游走
  const steps = bars * 4; // 每小节四拍
  const notes = [];
  let t = 0;
  let prev = scale[Math.floor(rng() * scale.length)];
  let cursor = scale.indexOf(prev);
  for (let i = 0; i < steps; i++) {
    // 节奏：以四分音符为底，附点或八分扩展
    const r = rng();
    let dur = 1;
    if (r > 0.82) dur = 1.5;       // 附点四分
    else if (r > 0.62) dur = 0.5;  // 八分
    else if (r > 0.5) dur = 0.75;  // 三连音感
    const pitch = cursor >= 0 ? scale[cursor] : scale[0];
    notes.push({ t, pitch, dur });
    t += dur * beat;

    // 音高游走：八成级进（±1 音级），两成跳进
    const move = rng();
    if (move < 0.5) cursor += rng() < 0.5 ? -1 : 1;
    else if (move < 0.8) cursor += rng() < 0.5 ? -2 : 2;
    else cursor += Math.floor(rng() * 5) - 2;
    cursor = Math.max(0, Math.min(scale.length - 1, cursor));
    prev = scale[cursor];
  }

  // 和声：每小节一个和弦（根音 + 三度/六度音，均取自音阶）
  const chords = [];
  for (let b = 0; b < bars; b++) {
    const base = scale[Math.floor(rng() * Math.min(3, scale.length))];
    chords.push({ t: b * 4 * beat, root: base, third: base + (rng() < 0.5 ? 4 : 7), fifth: base + 7 });
  }

  return {
    style,
    styleLabel: S.label,
    root,
    bpm,
    bars,
    duration: t,
    notes,
    chords,
    stats: {
      notes: notes.length,
      chords: chords.length,
      scaleSize: scale.length,
    },
  };
}
