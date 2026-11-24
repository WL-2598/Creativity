import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSmoke, buildFlowField, sampleFlow, SMOKE_TONES } from '../smoke/js/smoke.js';

test('烟境：同种子 => 同一处烟境（确定性）', () => {
  const a = generateSmoke(7777);
  const b = generateSmoke(7777);
  assert.deepEqual(a, b);
});

test('烟境：烟源参数合法、分布不重叠', () => {
  for (let s = 1; s <= 8; s++) {
    const sc = generateSmoke(s, { sources: 4 });
    assert.equal(sc.sources.length, 4);
    for (const src of sc.sources) {
      assert.ok(src.x > 0.1 && src.x < 0.9, '烟源 x 应留白');
      assert.ok(src.y >= 0.8 && src.y <= 0.96, '烟源应在底部');
      assert.ok(src.strength > 0 && src.strength <= 1.5);
      assert.ok(src.drift >= -1 && src.drift <= 1);
      assert.ok(src.size > 0, '烟源尺寸为正');
    }
    for (let i = 0; i < sc.sources.length; i++) {
      for (let j = i + 1; j < sc.sources.length; j++) {
        const d = Math.abs(sc.sources[i].x - sc.sources[j].x);
        assert.ok(d > 0.05, '烟源之间应保持距离');
      }
    }
  }
});

test('烟境：流场尺寸与统计一致', () => {
  const sc = generateSmoke(100, { field: 32 });
  assert.equal(sc.fieldRes, 32);
  assert.equal(sc.field.length, 32 * 32);
  assert.equal(sc.stats.fieldSize, 32 * 32);
  assert.equal(sc.stats.sources, sc.sources.length);
});

test('烟境：流场值有限且确定', () => {
  const f1 = buildFlowField(31415, 24, 24);
  const f2 = buildFlowField(31415, 24, 24);
  assert.deepEqual(Array.from(f1), Array.from(f2));
  for (const v of f1) {
    assert.ok(Number.isFinite(v), '流场值应有限');
    assert.ok(v >= -Math.PI * 2 && v <= Math.PI * 2, '流场为角度值');
  }
});

test('烟境：流场采样在格内连续、边界环绕', () => {
  const field = buildFlowField(88, 16, 16);
  const v = sampleFlow(field, 16, 0.5, 0.5);
  assert.ok(Number.isFinite(v), '中心采样有限');
  // 边界环绕：x=0 与 x=1 应采样同一列
  const left = sampleFlow(field, 16, 0.001, 0.5);
  const right = sampleFlow(field, 16, 0.999, 0.5);
  assert.ok(Number.isFinite(left) && Number.isFinite(right));
  // 相邻点采样不应跳变到非有限
  for (let i = 0; i <= 10; i++) {
    assert.ok(Number.isFinite(sampleFlow(field, 16, i / 10, 0.3)));
  }
});

test('烟境：色调基调参数合法', () => {
  for (const tone of Object.keys(SMOKE_TONES)) {
    const sc = generateSmoke(202, { tone });
    assert.equal(sc.tone, tone);
    assert.equal(sc.base.length, 3);
    assert.equal(sc.sky.length, 3);
    for (const c of sc.sky) assert.ok(/^#[0-9a-f]{6}$/i.test(c), `天空色 ${c} 为 hex`);
    for (const v of sc.base) assert.ok(v >= 0 && v <= 255, '基色通道合法');
  }
});

test('烟境：不同种子 => 流场与烟源不同', () => {
  const a = generateSmoke(1, { sources: 3, field: 16 });
  const b = generateSmoke(2, { sources: 3, field: 16 });
  let fieldDiff = 0;
  for (let i = 0; i < a.field.length; i++) {
    if (Math.abs(a.field[i] - b.field[i]) > 0.01) fieldDiff++;
  }
  assert.ok(fieldDiff > 50, '流场应随种子变化');
  assert.notDeepEqual(a.sources, b.sources);
});
