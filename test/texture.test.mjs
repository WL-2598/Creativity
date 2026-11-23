import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePattern, PATTERN_KINDS } from '../texture/js/pattern.js';

test('织理：同种子 => 同一张纹样（确定性）', () => {
  for (const kind of Object.keys(PATTERN_KINDS)) {
    const a = generatePattern(6001, { kind });
    const b = generatePattern(6001, { kind });
    assert.deepEqual(a, b, `${kind} 同种子应完全一致`);
  }
});

test('织理：编织图案合法（格子为 0/1，尺寸匹配）', () => {
  const p = generatePattern(101, { kind: 'weave' });
  assert.equal(p.kind, 'weave');
  assert.equal(p.cells.length, p.size);
  for (let y = 0; y < p.size; y++) {
    assert.equal(p.cells[y].length, p.size);
    for (const v of p.cells[y]) assert.ok(v === 0 || v === 1, '编织格应为 0/1');
  }
  assert.equal(p.stats.cells, p.size * p.size);
  assert.ok(p.colors.warp && p.colors.weft && p.colors.ground);
});

test('织理：编织既有规律也有随机（非纯棋盘）', () => {
  // 统计足够多样本，必然出现扰动后的非棋盘图案
  const nonChecker = 0;
  let found = false;
  for (let s = 1; s <= 40 && !found; s++) {
    const p = generatePattern(s, { kind: 'weave', size: 10 });
    let pure = true;
    for (let y = 0; y < p.size && pure; y++) {
      for (let x = 0; x < p.size && pure; x++) {
        if (p.cells[y][x] !== ((x + y) % 2)) pure = false;
      }
    }
    if (!pure) found = true;
  }
  assert.ok(found, '应能生成非纯棋盘的交织图案');
});

test('织理：瓷砖图案合法（类型 1~4，调色板 4 色）', () => {
  const p = generatePattern(202, { kind: 'tile' });
  assert.equal(p.kind, 'tile');
  assert.equal(p.palette.length, 4);
  for (let y = 0; y < p.size; y++) {
    for (const v of p.cells[y]) assert.ok(v >= 1 && v <= 4, '瓷砖类型应在 1~4');
  }
  assert.equal(p.stats.cells, p.size * p.size);
});

test('织理：曼陀罗合法（对称数 6~11，半径递增，元素类型合法）', () => {
  const p = generatePattern(303, { kind: 'mandala', size: 6 });
  assert.equal(p.kind, 'mandala');
  assert.equal(p.rings.length, 6);
  let prevR = 0;
  for (const ring of p.rings) {
    assert.ok(ring.symmetry >= 6 && ring.symmetry <= 11, '对称数应在 6~11');
    assert.ok(ring.radius > prevR, '半径应逐层递增');
    assert.ok(['petal', 'dot'].includes(ring.element), '元素类型合法');
    assert.ok(p.palette.includes(ring.color), '颜色应在调色板内');
    prevR = ring.radius;
  }
  assert.equal(p.stats.rings, 6);
});

test('织理：三种类型均能生成，且形态互不相同', () => {
  const weave = generatePattern(404, { kind: 'weave' });
  const tile = generatePattern(404, { kind: 'tile' });
  const mandala = generatePattern(404, { kind: 'mandala' });
  const sigs = [weave.kind, tile.kind, mandala.kind];
  assert.deepEqual(sigs, ['weave', 'tile', 'mandala']);
  assert.notEqual(weave.kindLabel, mandala.kindLabel);
});

test('织理：默认种子在三种类型间分布', () => {
  const counts = { weave: 0, tile: 0, mandala: 0 };
  for (let s = 1; s <= 30; s++) counts[generatePattern(s).kind]++;
  for (const k of Object.keys(counts)) assert.ok(counts[k] > 0, `类型 ${k} 应至少出现一次`);
});
