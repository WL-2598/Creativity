import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFloral, FLOWER_MATERIALS, VESSELS } from '../floral/js/floral.js';

test('花相：同种子 => 同一席花艺（确定性）', () => {
  const a = generateFloral(2025);
  const b = generateFloral(2025);
  assert.deepEqual(a, b);
});

test('花相：三主构图齐备且主枝最高', () => {
  for (let s = 1; s <= 8; s++) {
    const A = generateFloral(s);
    const roles = A.stems.map(x => x.role).sort();
    assert.deepEqual(roles, ['envoy', 'guest', 'main'], '应含主枝、客枝、使枝各一');
    const main = A.stems.find(x => x.role === 'main');
    const guest = A.stems.find(x => x.role === 'guest');
    const envoy = A.stems.find(x => x.role === 'envoy');
    assert.ok(main.height > guest.height, '主枝应高于客枝');
    assert.ok(guest.height > envoy.height, '客枝应高于使枝');
  }
});

test('花相：枝条参数合法、颜色取自花材调色板', () => {
  for (let s = 1; s <= 6; s++) {
    const A = generateFloral(s);
    const all = [...A.stems, ...A.fillers];
    for (const stem of all) {
      assert.ok(stem.height > 0 && stem.height < 0.9, '枝高在 (0,0.9)');
      assert.ok(stem.spread > 0 && stem.spread < 0.5, '开度合理');
      assert.ok(stem.angle >= -1 && stem.angle <= 1.2, '角度合理');
      assert.ok(stem.flowers >= 1, '每枝至少一朵');
      const mat = FLOWER_MATERIALS[stem.material];
      assert.ok(mat.colors.includes(stem.color), '花色应取自花材调色板');
      assert.ok(['dot', 'petal', 'leaf'].includes(stem.form), '花型合法');
    }
  }
});

test('花相：花材选择不重复、数量受配置约束', () => {
  for (let s = 1; s <= 8; s++) {
    const A = generateFloral(s, { materials: 3 });
    assert.equal(A.materials.length, 3);
    assert.equal(new Set(A.materials).size, 3, '花材不应重复');
    for (const m of A.materials) {
      assert.ok(Object.values(FLOWER_MATERIALS).some(x => x.label === m), '花材名应来自词典');
    }
  }
});

test('花相：花器与统计一致', () => {
  for (const vessel of Object.keys(VESSELS)) {
    const A = generateFloral(404, { vessel });
    assert.equal(A.vessel, vessel);
    assert.equal(A.vesselLabel, VESSELS[vessel].label);
    assert.equal(A.stats.stems, A.stems.length);
    assert.equal(A.stats.fillers, A.fillers.length);
    assert.equal(A.stats.flowers, [...A.stems, ...A.fillers].reduce((a, x) => a + x.flowers, 0));
    assert.equal(A.stats.materials, A.materials.length);
  }
});

test('花相：花量与构图密度合理', () => {
  const A = generateFloral(606);
  assert.ok(A.stats.flowers >= 3, '总花量不应过少');
  assert.ok(A.stats.flowers <= 30, '总花量不应过多');
  assert.ok(A.stats.mainHeight > 0.5, '主枝高度应显著');
});

test('花相：不同种子 => 花艺构图不同', () => {
  const sig = (s) => JSON.stringify(generateFloral(s, { materials: 3 }));
  const seen = new Set();
  for (let s = 1; s <= 16; s++) seen.add(sig(s));
  assert.ok(seen.size >= 12, '不同种子应产生多样化的花艺构图');
});
