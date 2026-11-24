import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSandscape, stepSand, isStable, sandTotal } from '../sandpit/js/sand.js';

test('沙盘：同种子 => 同一处沙境（确定性）', () => {
  const a = generateSandscape(1234);
  const b = generateSandscape(1234);
  assert.deepEqual([...a.heights], [...b.heights]);
  assert.equal(a.source, b.source);
  assert.deepEqual(a.stats, b.stats);
});

test('沙盘：初始状态参数合法', () => {
  for (let s = 1; s <= 8; s++) {
    const sc = generateSandscape(s);
    assert.ok(sc.width >= 8 && sc.width <= 120, '宽度合法');
    assert.ok(sc.height >= 6 && sc.height <= 80, '高度合法');
    for (let x = 0; x < sc.width; x++) {
      assert.ok(sc.heights[x] >= 0 && sc.heights[x] < sc.height, `列 ${x} 高度在 [0,${sc.height})`);
    }
    assert.ok(sc.source >= 1 && sc.source <= sc.width - 2, '沙源在边界内');
    assert.equal(sc.stats.sand, sandTotal(sc));
  }
});

test('沙盘：元胞步进确定且守恒', () => {
  const sc = generateSandscape(555, { width: 30, height: 20 });
  const before = sandTotal(sc);
  const copy = { ...sc, heights: Uint16Array.from(sc.heights) };
  const r1 = stepSand(sc);
  const r2 = stepSand(copy);
  assert.equal(r1, r2, '同状态同一步进应一致');
  assert.deepEqual([...sc.heights], [...copy.heights], '步进结果确定');
  assert.equal(sandTotal(sc), before, '沙量守恒');
});

test('沙盘：趋于稳定态且步数有限', () => {
  for (let s = 1; s <= 8; s++) {
    const sc = generateSandscape(s, { width: 24, height: 16 });
    const start = sandTotal(sc);
    let steps = 0;
    while (!isStable(sc) && steps < 5000) {
      stepSand(sc);
      steps++;
    }
    assert.ok(isStable(sc), `种子 ${s}：应在有限步内稳定`);
    assert.ok(steps < 5000, `种子 ${s}：收敛步数有限（${steps}）`);
    assert.equal(sandTotal(sc), start, '稳定后沙量守恒');
    // 稳定态：任意相邻高度差 ≤ 1
    for (let x = 0; x < sc.width - 1; x++) {
      assert.ok(Math.abs(sc.heights[x] - sc.heights[x + 1]) <= 1, `稳定后列 ${x} 与 ${x + 1} 高度差应 ≤ 1`);
    }
  }
});

test('沙盘：稳定态下步进不再移动', () => {
  const sc = generateSandscape(777, { width: 20, height: 14 });
  while (!isStable(sc)) stepSand(sc);
  assert.equal(stepSand(sc), false, '稳定态步进应无移动');
});

test('沙盘：统计与结构一致', () => {
  const sc = generateSandscape(888, { width: 36, height: 22 });
  assert.equal(sc.stats.cells, sc.width);
  assert.equal(sc.stats.sand, [...sc.heights].reduce((a, b) => a + b, 0));
  assert.equal(sc.stats.peak, Math.max(...sc.heights));
  assert.equal(sc.stats.valley, Math.min(...sc.heights));
});

test('沙盘：不同种子 => 沙丘形态不同', () => {
  const sig = (s) => JSON.stringify(generateSandscape(s, { width: 40, height: 24 }).heights);
  const seen = new Set();
  for (let s = 1; s <= 16; s++) seen.add(sig(s));
  assert.ok(seen.size >= 12, '不同种子应产生多样化的沙丘形态');
});
