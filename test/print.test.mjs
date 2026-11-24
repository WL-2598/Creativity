import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePrint, PRINT_STYLES, PLATE_TYPES } from '../print/js/print.js';

const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.6 + (n & 255) * 0.1;
};

test('拓境：同种子 => 同一幅版画（确定性）', () => {
  const a = generatePrint(8888);
  const b = generatePrint(8888);
  assert.deepEqual(a, b);
});

test('拓境：印版参数合法、形状取自词典、墨色取自调色板', () => {
  for (const style of Object.keys(PRINT_STYLES)) {
    const p = generatePrint(500, { style, plates: 4 });
    assert.equal(p.style, style);
    assert.equal(p.plates.length, 4);
    assert.equal(p.order.length, 4);
    for (const plate of p.plates) {
      assert.ok(PLATE_TYPES.includes(plate.type), `形状 ${plate.type} 合法`);
      assert.ok(plate.density > 0 && plate.density <= 0.75, '密度合法');
      assert.ok(p.inks.includes(plate.ink), '墨色应在调色板内');
      assert.ok(Number.isFinite(plate.offset.x) && Number.isFinite(plate.offset.y));
    }
  }
});

test('拓境：套印顺序为先浅后深', () => {
  const p = generatePrint(600, { plates: 4 });
  const orderedLum = p.order.map(i => lum(p.plates[i].ink));
  for (let i = 1; i < orderedLum.length; i++) {
    assert.ok(orderedLum[i] >= orderedLum[i - 1], '墨色应按亮度升序套印（先浅后深）');
  }
});

test('拓境：套印顺序是完整且不重复的印版排列', () => {
  for (let s = 1; s <= 12; s++) {
    const p = generatePrint(s, { plates: 3 });
    assert.deepEqual(
      [...p.order].sort((a, b) => a - b),
      p.plates.map(x => x.index),
      'order 应恰为全部印版索引各一次'
    );
  }
});

test('拓境：统计与结构一致', () => {
  const p = generatePrint(700, { plates: 5 });
  assert.equal(p.stats.plates, 5);
  assert.equal(p.stats.layers, 5);
  assert.equal(p.stats.coverage, p.plates.reduce((a, x) => a + x.density, 0));
});

test('拓境：印版数量受配置约束（2~5）', () => {
  for (let s = 1; s <= 16; s++) {
    const p = generatePrint(s, { plates: 2 });
    assert.equal(p.plates.length, 2);
    const auto = generatePrint(s);
    assert.ok(auto.plates.length >= 2 && auto.plates.length <= 5, '默认印版数在 2~5');
  }
});

test('拓境：不同种子 => 版画不同', () => {
  const sig = (s) => JSON.stringify(generatePrint(s, { plates: 3 }).plates);
  let diff = 0;
  for (let s = 1; s <= 12; s++) {
    if (sig(s) !== sig(s + 8000)) diff++;
  }
  assert.ok(diff >= 10, '相邻种子应多数产生不同版画');
});
