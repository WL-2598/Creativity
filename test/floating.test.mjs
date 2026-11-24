/**
 * floating.test.mjs — 浮生生态核心测试
 * 确定性、种群有界、捕食与繁衍、光照响应。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createEcosystem, stepEcosystem, bindRng,
  ORG_FISH, ORG_PLANKTON, ORG_PLANT,
} from '../floating/js/ecology.js';

function run(seed, steps, light = 0.6, perturb = null) {
  const state = bindRng(createEcosystem(seed, { fish: 4, plankton: 42, plant: 6 }), seed);
  for (let i = 0; i < steps; i++) {
    stepEcosystem(state, { light, perturb }, 1 / 30);
  }
  return state;
}

test('生态：同种子同参数 => 演化轨迹完全一致（确定性）', () => {
  const a = run(777, 200);
  const b = run(777, 200);
  assert.equal(a.organisms.length, b.organisms.length);
  for (let i = 0; i < a.organisms.length; i++) {
    assert.ok(Math.abs(a.organisms[i].x - b.organisms[i].x) < 1e-9);
    assert.ok(Math.abs(a.organisms[i].y - b.organisms[i].y) < 1e-9);
  }
});

test('生态：长期演化无 NaN，种群有界', () => {
  const state = run(42, 600);
  assert.ok(state.organisms.length <= state.maxPop, '种群不应超过上限');
  for (const o of state.organisms) {
    assert.ok(Number.isFinite(o.x) && Number.isFinite(o.y), '坐标应有限');
    assert.ok(o.energy > 0, '存活个体能量应为正');
    assert.ok(o.x >= 0 && o.x <= 1 && o.y >= 0 && o.y <= 1, '坐标应在瓶内');
  }
});

test('生态：游鱼能捕食浮游', () => {
  // 高鱼量、低浮游初始，观察浮游被消耗
  const state = bindRng(createEcosystem(9, { fish: 10, plankton: 20, plant: 4 }), 9);
  const initial = state.organisms.filter(o => o.type === ORG_PLANKTON).length;
  for (let i = 0; i < 300; i++) stepEcosystem(state, { light: 0.5, perturb: null }, 1 / 30);
  const after = state.organisms.filter(o => o.type === ORG_PLANKTON).length;
  assert.ok(after < initial, `浮游应被消耗：${initial} → ${after}`);
});

test('生态：充足光照下生物得以繁衍存续', () => {
  const state = bindRng(createEcosystem(21, { fish: 2, plankton: 10, plant: 3 }), 21);
  for (let i = 0; i < 400; i++) stepEcosystem(state, { light: 1.0, perturb: null }, 1 / 30);
  assert.ok(state.organisms.length > 0, '生态不应完全崩溃');
  assert.ok(state.organisms.some(o => o.type === ORG_PLANT), '水草应在光照下存续');
});

test('生态：无光环境走向沉寂', () => {
  const state = bindRng(createEcosystem(5, { fish: 3, plankton: 20, plant: 4 }), 5);
  for (let i = 0; i < 900; i++) stepEcosystem(state, { light: 0, perturb: null }, 1 / 30);
  assert.ok(state.organisms.length < 15, `无光下种群应大幅衰减: ${state.organisms.length}`);
});

test('生态：扰动影响鱼群游动方向', () => {
  const state = bindRng(createEcosystem(33, { fish: 6, plankton: 30, plant: 4 }), 33);
  const fish = state.organisms.find(o => o.type === ORG_FISH);
  const before = { vx: fish.vx, vy: fish.vy };
  // 在鱼附近施加扰动
  stepEcosystem(state, { light: 0.6, perturb: { x: fish.x + 0.01, y: fish.y, strength: 0.05 } }, 1 / 30);
  assert.ok(
    Math.abs(fish.vx - before.vx) > 1e-4 || Math.abs(fish.vy - before.vy) > 1e-4,
    '扰动应改变鱼的速度'
  );
});

test('生态：统计计数与实际种群一致', () => {
  const state = run(88, 100);
  const count = t => state.organisms.filter(o => o.type === t).length;
  assert.equal(state.stats.fish, count(ORG_FISH));
  assert.equal(state.stats.plankton, count(ORG_PLANKTON));
  assert.equal(state.stats.plant, count(ORG_PLANT));
});
