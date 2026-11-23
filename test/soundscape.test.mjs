import test from 'node:test';
import assert from 'node:assert/strict';
import { generateScore, SCALE_TYPES } from '../soundscape/js/melody.js';

const midiToName = (m) => {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return `${names[m % 12]}${Math.floor(m / 12) - 1}`;
};

test('声境：同种子 => 同一段乐谱（确定性）', () => {
  const a = generateScore(777);
  const b = generateScore(777);
  assert.equal(a.style, b.style);
  assert.equal(a.root, b.root);
  assert.equal(a.bpm, b.bpm);
  assert.deepEqual(a.notes, b.notes);
  assert.deepEqual(a.chords, b.chords);
});

test('声境：所有音符音高都在调式音阶内', () => {
  for (const style of Object.keys(SCALE_TYPES)) {
    const score = generateScore(31, { style });
    const S = SCALE_TYPES[style];
    const allowed = new Set(S.intervals.map(iv => score.root + iv));
    for (const n of score.notes) {
      assert.ok(allowed.has(n.pitch),
        `${style} 调式中音符 ${midiToName(n.pitch)} 不在音阶内`);
    }
  }
});

test('声境：节奏合法、时间单调递增、不超总时长', () => {
  const score = generateScore(888);
  for (let i = 0; i < score.notes.length; i++) {
    const n = score.notes[i];
    assert.ok(n.dur > 0 && n.dur <= 2, `音符时长 ${n.dur} 合法`);
    if (i > 0) assert.ok(n.t >= score.notes[i - 1].t, '音符时间应单调不减');
  }
  assert.ok(score.duration >= score.notes[score.notes.length - 1].t);
});

test('声境：节拍与 BPM 自洽（四分音符时长 = 60/BPM）', () => {
  const score = generateScore(123, { bpm: 80 });
  assert.equal(score.bpm, 80);
  const quarter = 60 / 80;
  const n1 = score.notes[0], n2 = score.notes[1];
  assert.ok(Math.abs(n1.t) < 1e-9, '首个音符从 0 时刻开始');
  assert.ok(Math.abs(n2.t - n1.dur * quarter) < 1e-9, '音符应首尾相接，时长换算自洽');
});

test('声境：小节数与和声数量一致', () => {
  const score = generateScore(2024, { bars: 6 });
  assert.equal(score.bars, 6);
  assert.equal(score.chords.length, 6);
  assert.equal(score.stats.chords, 6);
  assert.equal(score.stats.notes, score.notes.length);
});

test('声境：四种调式风格各异', () => {
  const sets = Object.keys(SCALE_TYPES).map(k => generateScore(500, { style: k }));
  const sigs = new Set(sets.map(s => `${s.style}:${s.root}:${s.notes.length}`));
  assert.equal(sigs.size, 4, '四种调式应产生不同签名');
});

test('声境：不同种子 => 乐谱不同', () => {
  const sig = (s) => JSON.stringify(generateScore(s, { bars: 4 }).notes);
  let diff = 0;
  for (let s = 1; s <= 12; s++) {
    if (sig(s) !== sig(s + 1000)) diff++;
  }
  assert.ok(diff >= 10, '相邻种子应多数产生不同乐谱');
});
