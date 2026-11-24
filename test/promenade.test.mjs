import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePromenade, HALL_TONES } from '../promenade/js/promenade.js';

test('回廊：同种子 => 同一条长廊（确定性）', () => {
  const a = generatePromenade(3131);
  const b = generatePromenade(3131);
  assert.deepEqual(a, b);
});

test('回廊：灭点位于画面上半部中央区', () => {
  for (let s = 1; s <= 8; s++) {
    const h = generatePromenade(s);
    assert.ok(h.vanish.x > 0.35 && h.vanish.x < 0.65, '灭点 x 在中央区');
    assert.ok(h.vanish.y > 0.2 && h.vanish.y < 0.55, '灭点 y 在上方');
  }
});

test('回廊：柱列参数合法、左右分列、纵深有序', () => {
  for (let s = 1; s <= 6; s++) {
    const h = generatePromenade(s, { columns: 8 });
    assert.equal(h.columns.length, 8);
    for (const c of h.columns) {
      assert.ok(c.depth > 0 && c.depth < 1, '纵深在 (0,1)');
      assert.ok(c.side === -1 || c.side === 1, '柱在左侧或右侧');
      assert.ok(c.width > 0 && c.width < 0.15, '柱径合理');
      assert.ok(c.height > 0 && c.height < 0.6, '柱高合理');
      assert.ok(c.shade >= 0.7 && c.shade <= 1.15, '受光系数合理');
    }
    // 左右两列都有
    assert.ok(h.columns.some(c => c.side === -1) && h.columns.some(c => c.side === 1), '双侧均有柱');
  }
});

test('回廊：拱券参数合法、位置有序', () => {
  const h = generatePromenade(777, { arches: 5 });
  assert.equal(h.arches.length, 5);
  for (const a of h.arches) {
    assert.ok(a.depth > 0 && a.depth < 1, '拱券纵深在 (0,1)');
    assert.ok(a.span > 0.1 && a.span < 0.3, '拱跨合理');
    assert.ok(a.height > 0 && a.height < 0.2, '拱高合理');
  }
});

test('回廊：光影方向与强度合法', () => {
  const h = generatePromenade(888);
  assert.ok(h.light.angle >= 0 && h.light.angle < Math.PI * 2, '方向角在 [0,2π)');
  assert.ok(h.light.strength > 0 && h.light.strength <= 1, '光影强度在 (0,1]');
});

test('回廊：色调与统计一致', () => {
  for (const tone of Object.keys(HALL_TONES)) {
    const h = generatePromenade(999, { tone });
    assert.equal(h.tone, tone);
    assert.equal(h.toneLabel, HALL_TONES[tone].label);
    assert.equal(h.stats.columns, h.columns.length);
    assert.equal(h.stats.arches, h.arches.length);
    assert.equal(h.stats.light, tone);
    assert.deepEqual(h.stats.depthRange, [Math.min(...h.columns.map(c => c.depth)), Math.max(...h.columns.map(c => c.depth))]);
  }
});

test('回廊：不同种子 => 长廊格局不同', () => {
  const sig = (s) => JSON.stringify(generatePromenade(s, { columns: 8, arches: 4 }));
  const seen = new Set();
  for (let s = 1; s <= 16; s++) seen.add(sig(s));
  assert.ok(seen.size >= 12, '不同种子应产生多样化的长廊格局');
});
