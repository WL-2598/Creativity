/**
 * composition.test.mjs — 作曲核心的自动化测试
 * 运行：node --test test/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rngFromSeed, randInt, weightedPick, scaleNote, chordVoices,
  generateProgression, generateMotif, developMotif, euclid,
  createWorld, SCALES, midiToFreq, MOOD_PRESETS,
} from '../js/audio/composition.js';

test('RNG：同种子产生完全一致的序列', () => {
  const a = [...Array(10).keys()].map(() => rngFromSeed(42)());
  const b = [...Array(10).keys()].map(() => rngFromSeed(42)());
  assert.deepEqual(a, b);
  const c = [...Array(10).keys()].map(() => rngFromSeed(43)());
  assert.notDeepEqual(a, c);
});

test('scaleNote：按音阶取音并支持跨八度', () => {
  const major = SCALES.major;
  assert.equal(scaleNote(48, major, 0), 48);   // C4
  assert.equal(scaleNote(48, major, 1), 50);   // D4
  assert.equal(scaleNote(48, major, 4), 55);   // G4
  assert.equal(scaleNote(48, major, 5), 57);   // A4
  assert.equal(scaleNote(48, major, 7), 60);   // 索引越界 => 高八度 C5
  assert.equal(scaleNote(48, major, 8), 62);   // D5
  assert.equal(scaleNote(48, SCALES.minorPent, 1), 51); // 小调五声二度 = 小三度
});

test('chordVoices：根音位于最低，音高有序', () => {
  const major = SCALES.major;
  const voices = chordVoices(48, major, { root: 0, quality: 1 });
  assert.equal(voices[0], 36);  // 根音低八度
  assert.ok(voices.every(v => v >= voices[0]));
  assert.ok(voices.length >= 3);
});

test('progression：结尾解决回一级，形成闭环', () => {
  for (let seed = 1; seed < 50; seed++) {
    const rng = rngFromSeed(seed);
    const p = generateProgression(rng, SCALES.dorian, 6);
    assert.equal(p.chords.length, 6);
    const last = p.chords[p.chords.length - 1];
    assert.equal(last.root, 0, `种子 ${seed} 的进行未回到一级`);
    assert.equal(last.tension, 0);
  }
});

test('motif：事件在网格内且结构合法', () => {
  const rng = rngFromSeed(7);
  const m = generateMotif(rng, SCALES.minorPent, 8);
  assert.ok(m.events.length >= 1);
  for (const e of m.events) {
    assert.ok(e.t >= 0 && e.dur >= 1);
    assert.ok(e.deg >= 0);
  }
  // 事件不重叠：每个事件的 t + dur <= 下一事件 t（或为最后一个）
  for (let i = 1; i < m.events.length; i++) {
    assert.ok(m.events[i].t >= m.events[i - 1].t);
  }
});

test('developMotif：保留动机结构（stretch 除外）', () => {
  const rng = rngFromSeed(3);
  const m = generateMotif(rng, SCALES.major, 8);
  for (let i = 0; i < 40; i++) {
    const d = developMotif(rng, m);
    assert.equal(d.events.length, m.events.length);
    assert.ok(['repeat', 'invert', 'shift', 'stretch', 'reverse'].includes(d.kind));
  }
});

test('euclid：脉冲总数等于 k，长度等于 n', () => {
  for (let k = 0; k <= 8; k++) {
    for (let n = 1; n <= 16; n++) {
      const p = euclid(k, n);
      assert.equal(p.length, n);
      assert.equal(p.reduce((s, v) => s + v, 0), Math.min(k, n));
    }
  }
});

test('createWorld：同种子 => 同世界（完全确定性）', () => {
  const w1 = createWorld(123456, 'stellar');
  const w2 = createWorld(123456, 'stellar');
  assert.deepEqual(JSON.parse(JSON.stringify(w1)), JSON.parse(JSON.stringify(w2)));
  assert.equal(w1.scaleKey, w2.scaleKey);
  assert.equal(w1.progression.length, w2.progression.length);
});

test('createWorld：心境预设影响参数区间', () => {
  for (const key of Object.keys(MOOD_PRESETS)) {
    const w = createWorld(999, key);
    assert.ok(w.tempo >= 45 && w.tempo <= 130, `${key} 速度异常: ${w.tempo}`);
    assert.ok(w.density >= 0.1 && w.density <= 1);
    assert.ok(w.brightness >= 0.2 && w.brightness <= 0.95);
    assert.ok(w.reverb >= 0.2 && w.reverb <= 1);
  }
});

test('createWorld：不同种子 => 不同世界', () => {
  const seeds = [];
  for (let i = 0; i < 200; i++) {
    const w = createWorld(Math.floor(Math.random() * 0xFFFFFFFF));
    seeds.push(JSON.stringify(w).slice(0, 400));
  }
  assert.equal(new Set(seeds).size, 200, '随机种子应当产生足够多样的世界');
});

test('工具函数：randInt / weightedPick / midiToFreq', () => {
  const rng = rngFromSeed(5);
  for (let i = 0; i < 100; i++) {
    const v = randInt(rng, 3, 7);
    assert.ok(v >= 3 && v <= 7);
  }
  const picked = weightedPick(rng, [{ w: 0, a: 'x' }, { w: 10, b: 'y' }]);
  assert.equal(picked.b, 'y');
  assert.ok(Math.abs(midiToFreq(69) - 440) < 1e-9);
  assert.ok(Math.abs(midiToFreq(60) - 261.625) < 0.01);
});
