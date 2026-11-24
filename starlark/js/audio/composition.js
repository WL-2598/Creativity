/**
 * composition.js — 生成式作曲核心（纯逻辑，可独立测试）
 * 种子驱动的音阶、和声进行、动机发展、欧几里得节奏。
 * 一颗种子 => 一个自洽的"音乐宇宙"。
 */
import { rngFromSeed, randInt, weightedPick, clamp, randomSeed } from '../../../shared/rng.js';

export { rngFromSeed, randInt, weightedPick, clamp, randomSeed };

/* ------------------------------------------------------------------ *
 * 音阶库 —— 每条音阶是相对根音的半音偏移
 * ------------------------------------------------------------------ */
export const SCALES = {
  major:        { name: '自然大调',   steps: [0, 2, 4, 5, 7, 9, 11] },
  minor:        { name: '自然小调',   steps: [0, 2, 3, 5, 7, 8, 10] },
  dorian:       { name: '多利亚',     steps: [0, 2, 3, 5, 7, 9, 10] },
  phrygian:     { name: '弗里吉亚',   steps: [0, 1, 3, 5, 7, 8, 10] },
  lydian:       { name: '利底亚',     steps: [0, 2, 4, 6, 7, 9, 11] },
  mixolydian:   { name: '混合利底亚', steps: [0, 2, 4, 5, 7, 9, 10] },
  harmonicMinor:{ name: '和声小调',   steps: [0, 2, 3, 5, 7, 8, 11] },
  wholeTone:    { name: '全音阶',     steps: [0, 2, 4, 6, 8, 10] },
  majorPent:    { name: '大调五声',   steps: [0, 2, 4, 7, 9] },
  minorPent:    { name: '小调五声',   steps: [0, 3, 5, 7, 10] },
  hirajoshi:    { name: '平调子',     steps: [0, 2, 3, 7, 8] },
  irohazuka:    { name: '反渗透阶',   steps: [0, 3, 5, 7, 8] },
  Persian:      { name: '波斯',       steps: [0, 1, 4, 5, 7, 8, 11] },
  aeolian:      { name: '爱奥尼亚',   steps: [0, 2, 3, 5, 7, 8, 10] },
};

/** 由 MIDI 音符号 => 频率（A4=440Hz，十二平均律） */
export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** 在音阶上取音：scaleIndex 为音阶内索引（可超出，取模），根音为 baseMidi */
export function scaleNote(baseMidi, scale, scaleIndex) {
  const n = scale.steps.length;
  const octave = Math.floor(scaleIndex / n);
  return baseMidi + scale.steps[(((scaleIndex % n) + n) % n)] + 12 * octave;
}

/* ------------------------------------------------------------------ *
 * 和声进行生成
 * 以"和弦级数"组织：每个和弦是 (根音在音阶中的索引, 性质, 张力值)
 * 张力值决定它离调心的远近，用于驱动"紧张—解决"的呼吸感
 * ------------------------------------------------------------------ */
const CHORD_QUALITIES = [
  { w: 3, q: 1, label: 'maj' },   // 一级：稳定
  { w: 2, q: 0, label: 'min' },   // 小三：柔和
  { w: 2, q: 2, label: 'min7' },  // 小七：悬而未决
  { w: 2, q: 3, label: 'maj7' },  // 大七：梦幻
  { w: 2, q: 4, label: 'sus4' },  // 挂四：空灵
  { w: 1, q: 5, label: '7' },     // 属七：需要解决
  { w: 1, q: 6, label: 'dim' },   // 减：紧张
];

/**
 * 生成一条和声进行。
 * @returns {{chords: Array<{root:number,quality:number,tension:number,label:string}>, length:number}}
 */
export function generateProgression(rng, scale, len = 6) {
  const n = scale.steps.length;
  const chords = [];
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const isLast = i === len - 1;
    let step, quality, tension;
    if (isLast) {
      // 结尾解决回一级，形成闭环
      step = 0; quality = 1; tension = 0;
    } else {
      // 级数游走：允许二度/三度移动，避免机械
      const move = [-2, -1, 1, 2, 0][randInt(rng, 0, 4)];
      step = ((prev + move) % n + n) % n;
      prev = step;
      const q = weightedPick(rng, CHORD_QUALITIES);
      quality = q.q; tension = q.q;
    }
    chords.push({ root: step, quality, tension, label: '' });
  }
  return { chords, length: len };
}

/**
 * 将和弦展开为实际发音的音高集合（voice-leading：以密集排列为主，
 * 低音取根音，上方三度叠置，适合 ambient 铺底）
 */
export function chordVoices(baseMidi, scale, chord, voicing = 'closed') {
  const n = scale.steps.length;
  const rootMidi = scaleNote(baseMidi, scale, chord.root);
  const qualityDegrees = {
    1: [0, 2, 4],        // maj
    0: [0, 2, 3],        // min
    2: [0, 2, 3, 5],     // min7
    3: [0, 2, 4, 6],     // maj7
    4: [0, 4, 5],        // sus4
    5: [0, 2, 4, 6],     // 7 (省略五音的属七色彩)
    6: [0, 2, 3, 5],     // dim
  };
  const degs = qualityDegrees[chord.quality] || [0, 2, 4];
  const notes = [rootMidi - 12];
  for (const d of degs) {
    notes.push(scaleNote(baseMidi, scale, chord.root + d));
  }
  if (voicing === 'open') {
    notes[2] = scaleNote(baseMidi, scale, chord.root + degs[2] + (n >= 7 ? 7 : 5));
  }
  return notes;
}

/* ------------------------------------------------------------------ *
 * 动机（motif）—— 旋律的最小单元，可被"发展"：重复、倒影、移位、拉伸
 * ------------------------------------------------------------------ */
/**
 * 生成一个动机：节奏网格（单位=八分音符）+ 音高索引序列。
 * 返回 { beats: Array<{t:number, dur:number, deg:number}> }
 * deg 为音阶内相对度数（0 起），0 表示"休止"。
 */
export function generateMotif(rng, scale, grid = 8) {
  const cells = randInt(rng, 4, 8);
  const events = [];
  let t = 0;
  for (let i = 0; i < cells; i++) {
    const r = rng();
    if (r < 0.22) { t += 1; continue; }                    // 休止
    const dur = rng() < 0.3 ? 2 : 1;
    const deg = randInt(rng, 0, Math.max(1, scale.steps.length - 1));
    events.push({ t, dur, deg });
    t += dur;
  }
  if (events.length === 0) events.push({ t: 0, dur: 1, deg: 0 });
  return { events, grid };
}

/**
 * 动机发展：以原始动机为基因，随机施加变换产生"似曾相识"的乐句。
 * kind: 'repeat' | 'invert' | 'shift' | 'stretch' | 'reverse'
 */
export function developMotif(rng, motif) {
  const kind = weightedPick(rng, [
    { w: 3, k: 'repeat' },
    { w: 2, k: 'invert' },
    { w: 2, k: 'shift' },
    { w: 2, k: 'stretch' },
    { w: 1, k: 'reverse' },
  ]).k;
  const ev = motif.events.map(e => ({ ...e }));
  const invert = s => s === 0 ? 0 : (7 - s);
  switch (kind) {
    case 'invert':   ev.forEach(e => { if (e.deg > 0) e.deg = invert(e.deg); }); break;
    case 'shift':    ev.forEach(e => { if (e.deg > 0) e.deg = Math.abs(e.deg + randInt(rng, -2, 3)); }); break;
    case 'stretch':  ev.forEach(e => { e.dur *= 2; e.t *= 2; }); break;
    case 'reverse':  ev.reverse(); break;
    case 'repeat':   break;
  }
  return { events: ev, grid: motif.grid, kind };
}

/* ------------------------------------------------------------------ *
 * 欧几里得节奏（Bjorklund 风格）—— 把 k 个脉冲尽可能均匀地
 * 散布在 n 步中，形成星形脉冲序列，适合合成打击乐
 * ------------------------------------------------------------------ */
export function euclid(k, n) {
  const out = new Array(n).fill(0);
  if (k <= 0) return out;
  if (k >= n) return out.fill(1);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += k;
    if (acc >= n) {
      acc -= n;
      out[i] = 1;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 世界观（World）—— 一颗种子的全部音乐参数
 * ------------------------------------------------------------------ */
export const MOOD_PRESETS = {
  deepsea:  { label: '深海',   tempo: 72,  density: 0.45, brightness: 0.42, motion: 0.5,  reverb: 0.85, delay: 0.35, scaleBias: ['minor', 'dorian', 'phrygian'],        cutoff: 0.55 },
  dawn:     { label: '晨曦',   tempo: 84,  density: 0.65, brightness: 0.78, motion: 0.7,  reverb: 0.6,  delay: 0.3,  scaleBias: ['major', 'lydian', 'majorPent'],          cutoff: 0.8  },
  rainforest:{label: '雨林',   tempo: 96,  density: 0.75, brightness: 0.6,  motion: 0.85, reverb: 0.75, delay: 0.4,  scaleBias: ['dorian', 'minorPent', 'minor'],         cutoff: 0.65 },
  stellar:  { label: '星际',   tempo: 66,  density: 0.35, brightness: 0.55, motion: 0.4,  reverb: 0.95, delay: 0.55, scaleBias: ['lydian', 'major', 'harmonicMinor'],      cutoff: 0.7  },
  mist:     { label: '迷雾',   tempo: 60,  density: 0.28, brightness: 0.35, motion: 0.3,  reverb: 0.9,  delay: 0.6,  scaleBias: ['minor', 'phrygian', 'aeolian'],          cutoff: 0.5  },
};

/**
 * 由种子 + 可选心情预设构建一个完整的"音乐世界"。
 * 所有参数集中在此，保证同种子 => 同世界，且可整体随机化。
 */
export function createWorld(seed, moodKey = null) {
  const rng = rngFromSeed(seed);
  const mood = moodKey && MOOD_PRESETS[moodKey] ? MOOD_PRESETS[moodKey] : MOOD_PRESETS.stellar;

  const scaleKeys = Object.keys(SCALES);
  const scaleKey = weightedPick(rng, mood.scaleBias.map(k => ({ w: 1, k }))).k;
  const scale = SCALES[scaleKey];

  // 根音：在 C2~C4 之间，避开过响/过闷的极端
  const baseMidi = randInt(rng, 36, 60) - 12 * randInt(rng, 0, 1);

  const world = {
    seed,
    scaleKey,
    scale,
    baseMidi,
    tempo: Math.round(mood.tempo + (rng() - 0.5) * 10),
    density: clamp(mood.density + (rng() - 0.5) * 0.1, 0.15, 0.95),
    brightness: clamp(mood.brightness + (rng() - 0.5) * 0.15, 0.2, 0.95),
    motion: clamp(mood.motion + (rng() - 0.5) * 0.15, 0.1, 1),
    reverb: clamp(mood.reverb + (rng() - 0.5) * 0.1, 0.2, 1),
    delay: clamp(mood.delay + (rng() - 0.5) * 0.15, 0, 0.85),
    cutoff: clamp(mood.cutoff + (rng() - 0.5) * 0.1, 0.3, 0.95),
    progression: generateProgression(rng, scale, randInt(rng, 4, 7)),
    motifs: [],
    rhythms: {
      kick:  euclid(randInt(rng, 2, 4), 8),
      hat:   euclid(randInt(rng, 3, 6), 8),
      bell:  euclid(randInt(rng, 2, 5), 8),
    },
    // 随时间缓慢演化的参数（每 32 拍触发一次"呼吸"）
    evolution: { drift: 0, arpRotate: 0, voiceGain: 0.9, brightnessTarget: mood.brightness },
  };

  // 生成 3 个旋律动机作为"基因库"
  for (let i = 0; i < 3; i++) {
    world.motifs.push(generateMotif(rng, scale, 8));
  }
  return world;
}
