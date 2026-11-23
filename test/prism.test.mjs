/**
 * prism.test.mjs — 棱镜几何核心测试
 * 确定性、结构合法性、对称性与边界。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateGeometry, compositionRadius } from '../prism/js/geometry.js';

test('几何：同种子同参数 => 同一构图（确定性）', () => {
  const a = generateGeometry(31337, { symmetry: 6, depth: 4 });
  const b = generateGeometry(31337, { symmetry: 6, depth: 4 });
  assert.equal(a.elements.length, b.elements.length);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
});

test('几何：元素结构合法（坐标有限、宽度非负）', () => {
  for (let seed = 1; seed < 40; seed++) {
    const { elements } = generateGeometry(seed, { symmetry: 5, depth: 4 });
    assert.ok(elements.length > 0, '应生成元素');
    for (const el of elements) {
      assert.ok(['line', 'poly', 'arc'].includes(el.kind));
      assert.ok(el.width > 0);
      assert.ok(el.depth >= 0);
      for (const p of el.points) {
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
        if (el.kind === 'arc') assert.ok(p.r > 0 && p.a1 > p.a0);
      }
      if (el.kind === 'line') assert.equal(el.points.length, 2);
      if (el.kind === 'poly') assert.ok(el.points.length >= 3);
    }
  }
});

test('几何：对称数决定元素规模（m 重对称 => 约 m 倍元素）', () => {
  const low = generateGeometry(88, { symmetry: 2, depth: 3 });
  const high = generateGeometry(88, { symmetry: 8, depth: 3 });
  // 单瓣元素数相同，总元素数应随对称数显著增加
  assert.ok(high.elements.length > low.elements.length * 2,
    `对称 8 的元素数应显著多于对称 2：${low.elements.length} → ${high.elements.length}`);
});

test('几何：深度增加，元素更繁复', () => {
  const d2 = generateGeometry(66, { symmetry: 4, depth: 2 });
  const d5 = generateGeometry(66, { symmetry: 4, depth: 5 });
  assert.ok(d5.elements.length > d2.elements.length);
});

test('几何：参数被钳制在合法区间', () => {
  const a = generateGeometry(1, { symmetry: 99, depth: 99 });
  assert.ok(a.symmetry <= 12 && a.symmetry >= 2);
  assert.ok(a.depth <= 6 && a.depth >= 1);
  const b = generateGeometry(1, { symmetry: 0, depth: 0 });
  assert.ok(b.symmetry >= 2 && b.depth >= 1);
});

test('几何：构图包围半径有限且非零', () => {
  for (let seed = 1; seed < 30; seed++) {
    const { elements } = generateGeometry(seed, { symmetry: 6, depth: 4 });
    const R = compositionRadius(elements);
    assert.ok(R > 0 && R < 1e4, `包围半径应有限: ${R}`);
  }
});

test('几何：不同种子 => 构图不同', () => {
  const sets = new Set();
  for (let i = 0; i < 50; i++) {
    const { elements } = generateGeometry(Math.floor(Math.random() * 0xFFFFFFFF), { symmetry: 6, depth: 4 });
    sets.add(JSON.stringify(elements).slice(0, 300));
  }
  assert.ok(sets.size > 45, '随机种子应产生多样构图');
});
