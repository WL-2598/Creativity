/**
 * lumen.test.mjs — 流光光带核心测试
 * 确定性、结构合法性、数量钳制与包围盒。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateRibbons, ribbonBounds } from '../lumen/js/lumen.js';

test('光带：同种子 => 同一组丝带（确定性）', () => {
  const a = generateRibbons(2468, { count: 6, W: 800, H: 600 });
  const b = generateRibbons(2468, { count: 6, W: 800, H: 600 });
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
});

test('光带：结构合法（点数、宽度、色相在界内）', () => {
  for (let seed = 1; seed < 40; seed++) {
    const ribbons = generateRibbons(seed, { count: 6, W: 800, H: 600 });
    assert.equal(ribbons.length, 6);
    for (const r of ribbons) {
      assert.ok(r.points.length >= 40, '光带应有足够折点');
      assert.ok(r.width > 0);
      assert.ok(r.hue >= 0 && r.hue < 1);
      for (const p of r.points) {
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
      }
    }
  }
});

test('光带：数量被钳制在合法区间', () => {
  const tooMany = generateRibbons(5, { count: 99, W: 800, H: 600 });
  assert.ok(tooMany.length <= 14);
  const few = generateRibbons(5, { count: -3, W: 800, H: 600 });
  assert.ok(few.length >= 1);
});

test('光带：包围盒覆盖画布尺度（丝带绵延）', () => {
  const ribbons = generateRibbons(77, { count: 5, W: 800, H: 600 });
  const b = ribbonBounds(ribbons);
  assert.ok(b.maxX - b.minX > 200, `丝带应绵延: ${b.maxX - b.minX}`);
  assert.ok(b.maxY - b.minY > 100, `丝带应绵延: ${b.maxY - b.minY}`);
});

test('光带：不同种子 => 不同光带', () => {
  const sets = new Set();
  for (let i = 0; i < 40; i++) {
    const ribbons = generateRibbons(Math.floor(Math.random() * 0xFFFFFFFF), { count: 5, W: 800, H: 600 });
    sets.add(JSON.stringify(ribbons).slice(0, 240));
  }
  assert.ok(sets.size > 35, '随机种子应产生多样光带');
});
