import test from 'node:test';
import assert from 'node:assert/strict';
import { generateBells, BELL_SCALES } from '../bell/js/bell.js';

test('钟磬：同种子 => 同一列编钟（确定性）', () => {
  const a = generateBells(4040);
  const b = generateBells(4040);
  assert.deepEqual(a, b);
});

test('钟磬：编钟参数合法、位置在钟架上', () => {
  for (let s = 1; s <= 8; s++) {
    const set = generateBells(s, { count: 5 });
    assert.equal(set.bells.length, 5);
    const xs = set.bells.map(b => b.x).sort((a, b) => a - b);
    for (let i = 0; i < xs.length; i++) {
      assert.ok(xs[i] > 0.1 && xs[i] < 0.9, '钟在钟架内');
    }
    for (let i = 1; i < xs.length; i++) {
      assert.ok(xs[i] > xs[i - 1], '编钟由左至右排列');
    }
    for (const b of set.bells) {
      assert.ok(b.w > 0 && b.h > 0, '钟体尺寸为正');
      assert.ok(b.freq > 200 && b.freq < 700, '频率在合理范围');
      assert.ok(b.tone >= 0 && b.tone <= 4, '音阶索引合法');
      assert.ok(b.ratio > 0, '音阶比为正');
    }
  }
});

test('钟磬：音高与钟体尺寸反比（钟大音低）', () => {
  const set = generateBells(555, { count: 5 });
  const sorted = [...set.bells].sort((a, b) => b.h - a.h); // 高 → 低
  for (let i = 0; i < sorted.length - 1; i++) {
    assert.ok(sorted[i].h >= sorted[i + 1].h, '按高度降序排列');
    assert.ok(sorted[i].freq <= sorted[i + 1].freq,
      `钟体高 ${sorted[i].h.toFixed(3)} 的音应不高于钟体矮 ${sorted[i + 1].h.toFixed(3)} 的音`);
  }
});

test('钟磬：频率与音阶基音成整数比', () => {
  for (let s = 1; s <= 8; s++) {
    const set = generateBells(s);
    const S = BELL_SCALES[set.scale];
    for (const b of set.bells) {
      const expect = S.base * S.ratios[b.tone];
      assert.ok(Math.abs(b.freq - expect) < 1e-9, `频率应等于基音×音比`);
    }
  }
});

test('钟磬：敲击小曲合法（节拍递增、钟号在列内、力度为正）', () => {
  for (let s = 1; s <= 10; s++) {
    const set = generateBells(s);
    assert.ok(set.melody.length >= 8);
    for (let i = 0; i < set.melody.length; i++) {
      const m = set.melody[i];
      assert.equal(m.beat, i, '节拍应连续递增');
      assert.ok(m.bell >= 0 && m.bell < set.bells.length, '敲击的钟在列内');
      assert.ok(m.force > 0 && m.force <= 1, '力度在 (0, 1]');
    }
  }
});

test('钟磬：统计与结构一致', () => {
  const set = generateBells(666, { count: 7 });
  assert.equal(set.stats.bells, set.bells.length);
  assert.equal(set.stats.beats, set.melody.length);
  assert.equal(set.stats.minFreq, Math.min(...set.bells.map(b => b.freq)));
  assert.equal(set.stats.maxFreq, Math.max(...set.bells.map(b => b.freq)));
  assert.ok(set.stats.minFreq <= set.stats.maxFreq);
});

test('钟磬：不同种子与调式 => 编钟编排不同', () => {
  const sig = (s) => JSON.stringify(generateBells(s, { count: 5 }).bells);
  const seen = new Set();
  for (let s = 1; s <= 16; s++) seen.add(sig(s));
  assert.ok(seen.size >= 12, '不同种子应产生多样化的编钟编排');
  for (const scale of Object.keys(BELL_SCALES)) {
    const set = generateBells(77, { scale });
    assert.equal(set.scale, scale);
    assert.equal(set.scaleLabel, BELL_SCALES[scale].label);
    assert.equal(set.base, BELL_SCALES[scale].base);
  }
});
