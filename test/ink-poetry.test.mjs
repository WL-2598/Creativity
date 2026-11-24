/**
 * ink-poetry.test.mjs — 墨韵诗心测试
 * 格律（字数、押韵）、确定性、画诗同源。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPoem, lineLength, MOTIF_IMAGERY, RHYME_GROUPS } from '../inkflow/js/poetry.js';

test('诗心：五言绝句字数合律', () => {
  for (let seed = 1; seed < 60; seed++) {
    const p = createPoem(seed, 'mountain', 'five');
    assert.equal(p.lines.length, 4);
    for (const line of p.lines) assert.ok(lineLength(line, 'five'), `五言字数不符: ${line}`);
  }
});

test('诗心：七言绝句字数合律', () => {
  for (let seed = 1; seed < 60; seed++) {
    const p = createPoem(seed, 'bamboo', 'seven');
    for (const line of p.lines) assert.ok(lineLength(line, 'seven'), `七言字数不符: ${line}`);
  }
});

test('诗心：一、二、四句同韵（平水韵式）', () => {
  const rhymeWords = new Set();
  Object.values(RHYME_GROUPS).forEach(g => g.words.forEach(w => rhymeWords.add(w)));
  let checked = 0;
  for (let seed = 1; seed < 80; seed++) {
    for (const motif of Object.keys(MOTIF_IMAGERY)) {
      const p = createPoem(seed, motif);
      const a = p.lines[0].slice(-1);
      const b = p.lines[1].slice(-1);
      const c = p.lines[3].slice(-1);
      assert.equal(a, b, `一、二句不押韵: ${p.lines.join(' / ')}`);
      assert.equal(b, c, `二、四句不押韵: ${p.lines.join(' / ')}`);
      assert.ok(rhymeWords.has(a), `韵字不在韵库: ${a}`);
      checked++;
    }
  }
  assert.ok(checked > 400);
});

test('诗心：第三句不押韵（起承转合）', () => {
  let thirdMatchesRhyme = 0;
  for (let seed = 1; seed < 80; seed++) {
    const p = createPoem(seed, 'plum');
    if (p.lines[2].slice(-1) === p.lines[0].slice(-1)) thirdMatchesRhyme++;
  }
  assert.ok(thirdMatchesRhyme < 8, `第三句不应与韵脚重字，实际重合 ${thirdMatchesRhyme}/80`);
});

test('诗心：同种子同母题 => 同一首诗（确定性）', () => {
  const a = createPoem(123456, 'moon', 'five');
  const b = createPoem(123456, 'moon', 'five');
  assert.deepEqual(a, b);
});

test('诗心：画诗同源 —— 诗句多含母题意象', () => {
  let coherent = 0;
  const total = 200;
  for (let i = 0; i < total; i++) {
    const motif = Object.keys(MOTIF_IMAGERY)[i % Object.keys(MOTIF_IMAGERY).length];
    const p = createPoem(Math.floor(Math.random() * 0xFFFFFFFF), motif);
    const text = p.lines.join('');
    const images = MOTIF_IMAGERY[motif].images;
    if (images.some(w => text.includes(w))) coherent++;
  }
  assert.ok(coherent >= total * 0.9, `画诗同源率过低: ${coherent}/${total}`);
});

test('诗心：题名与母题呼应', () => {
  for (const motif of Object.keys(MOTIF_IMAGERY)) {
    const p = createPoem(7, motif);
    assert.ok(p.title.includes(MOTIF_IMAGERY[motif].label), `题名应含母题名: ${p.title}`);
  }
});
