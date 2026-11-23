/**
 * forma.test.mjs — 形境 L-系统植物测试
 * 确定性、结构合法、深度约束、叶花标记与类型差异。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePlant, plantBounds, PLANT_TYPES } from '../forma/js/lsystem.js';

test('植物：同种子同类型 => 同一株（确定性）', () => {
  const a = generatePlant(9527, 'tree', 4);
  const b = generatePlant(9527, 'tree', 4);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
});

test('植物：所有类型均生成合法结构', () => {
  for (const type of PLANT_TYPES) {
    for (let seed = 1; seed < 20; seed++) {
      const p = generatePlant(seed, type, 4);
      assert.ok(p.segments.length > 0, `${type} 应生成枝干`);
      for (const s of p.segments) {
        assert.ok(Number.isFinite(s.x1) && Number.isFinite(s.y1));
        assert.ok(Number.isFinite(s.x2) && Number.isFinite(s.y2));
        assert.ok(s.width > 0);
        assert.ok(s.depth >= 0 && s.depth <= 4);
        assert.ok(s.order >= 0);
      }
    }
  }
});

test('植物：递归深度约束生效（线段深度不超过设定）', () => {
  for (let depth = 1; depth <= 5; depth++) {
    const p = generatePlant(42, 'tree', depth);
    for (const s of p.segments) {
      assert.ok(s.depth <= depth, `深度越界: ${s.depth} > ${depth}`);
    }
  }
});

test('植物：叶花标记落在终梢且结构完整', () => {
  for (const type of PLANT_TYPES) {
    const p = generatePlant(7, type, 4);
    assert.ok(p.markers.length > 0, `${type} 应有叶花标记`);
    for (const m of p.markers) {
      assert.ok(['leaf', 'flower', 'grass'].includes(m.type));
      assert.ok(m.size > 0);
      assert.ok(m.depth === 0, '标记应位于终梢（深度 0）');
    }
  }
});

test('植物：枝干宽度随深度递减（上细下粗）', () => {
  const p = generatePlant(123, 'tree', 5);
  // 根段（depth 大者反而靠根部？这里 depth 是展开层级：depth 大 = 更早的段）
  // 检查宽度与深度负相关：深度越大（越靠近根部）宽度越大
  const byDepth = {};
  for (const s of p.segments) {
    byDepth[s.depth] = Math.max(byDepth[s.depth] ?? 0, s.width);
  }
  const depths = Object.keys(byDepth).map(Number).sort((a, b) => b - a);
  for (let i = 0; i + 1 < depths.length; i++) {
    assert.ok(byDepth[depths[i]] >= byDepth[depths[i + 1]] * 0.9,
      `深度 ${depths[i]} 的宽度应不小于深度 ${depths[i + 1]}`);
  }
});

test('植物：不同类型 => 不同形态', () => {
  const plants = PLANT_TYPES.map(t => generatePlant(555, t, 4));
  for (let i = 0; i < plants.length; i++) {
    for (let j = i + 1; j < plants.length; j++) {
      // 以完整结构签名比较，避免仅计数巧合
      const sig = (p) => JSON.stringify({ s: p.segments.length, m: p.markers.length, b: plantBounds(p) });
      assert.notEqual(sig(plants[i]), sig(plants[j]), `${PLANT_TYPES[i]} 与 ${PLANT_TYPES[j]} 形态应不同`);
    }
  }
});

test('植物：包围盒有限且包含所有顶点', () => {
  const p = generatePlant(314, 'fern', 4);
  const b = plantBounds(p);
  assert.ok(Number.isFinite(b.minX) && b.maxX > b.minX);
  assert.ok(Number.isFinite(b.minY) && b.maxY > b.minY);
  for (const s of p.segments) {
    assert.ok(s.x1 >= b.minX - 1e-6 && s.x2 <= b.maxX + 1e-6);
    assert.ok(s.y1 >= b.minY - 1e-6 && s.y2 <= b.maxY + 1e-6);
  }
});
