import test from 'node:test';
import assert from 'node:assert/strict';
import { generateStarfield } from '../starweb/js/constellation.js';

test('织星：同种子 => 同一片星网（确定性）', () => {
  const a = generateStarfield(7777);
  const b = generateStarfield(7777);
  assert.deepEqual(a.stars, b.stars);
  assert.deepEqual(a.edges, b.edges);
  assert.equal(a.name, b.name);
  assert.deepEqual(a.stats, b.stats);
});

test('织星：星点参数合法、位置在单位格内', () => {
  const f = generateStarfield(101, { stars: 30 });
  assert.equal(f.stars.length, 30);
  for (const s of f.stars) {
    assert.ok(s.x >= 0 && s.x <= 1, 'x 应在 [0,1]');
    assert.ok(s.y >= 0 && s.y <= 1, 'y 应在 [0,1]');
    assert.ok(s.size > 0, '尺寸为正');
    assert.ok(s.bright >= 0 && s.bright <= 3, '星等 0~3');
    assert.ok(typeof s.name === 'string' && s.name.length > 0, '星官名为字符串');
  }
});

test('织星：星网全域连通且无自环/重边', () => {
  for (let s = 1; s <= 12; s++) {
    const f = generateStarfield(s, { stars: 24, link: 1 });
    assert.ok(f.stats.connected, `种子 ${s}：星网应连通`);
    const seen = new Set();
    for (const e of f.edges) {
      assert.notEqual(e.a, e.b, '不应有自环');
      const key = `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`;
      assert.ok(!seen.has(key), `不应有重边：${key}`);
      seen.add(key);
    }
    // 最小生成树：n 点应恰有 n-1 条树边
    assert.equal(f.edges.length, f.stars.length - 1, '仅生成树时边数应为 n-1');
  }
});

test('织星：补边增加连线且仍连通', () => {
  const tree = generateStarfield(4242, { stars: 20, link: 1 });
  const dense = generateStarfield(4242, { stars: 20, link: 3 });
  assert.ok(dense.edges.length > tree.edges.length, '密集模式应连出更多边');
  assert.ok(dense.stats.connected, '补边后仍应连通');
});

test('织星：边端点均在星点范围内', () => {
  const f = generateStarfield(555, { stars: 16, link: 2 });
  for (const e of f.edges) {
    assert.ok(e.a >= 0 && e.a < f.stars.length, '端点 a 合法');
    assert.ok(e.b >= 0 && e.b < f.stars.length, '端点 b 合法');
    assert.ok(e.d > 0, '距离为正');
  }
});

test('织星：星官命名来自星官名录', () => {
  const f = generateStarfield(909);
  assert.ok(f.name.length > 0);
  const used = new Set(f.stars.map(s => s.name));
  assert.ok(used.has(f.name) || f.stars.length === 0, '星网之名应取自实际星官');
});

test('织星：不同种子 => 星网不同', () => {
  const sig = (s) => JSON.stringify(generateStarfield(s, { stars: 20 }).stars);
  let diff = 0;
  for (let s = 1; s <= 12; s++) {
    if (sig(s) !== sig(s + 5000)) diff++;
  }
  assert.ok(diff >= 10, '相邻种子应多数产生不同星网');
});
