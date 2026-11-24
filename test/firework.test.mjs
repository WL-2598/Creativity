import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFireworks, FIREWORK_TONES } from '../firework/js/firework.js';

test('焰火：同种子 => 同一场焰火（确定性）', () => {
  const a = generateFireworks(7070);
  const b = generateFireworks(7070);
  assert.deepEqual(a, b);
});

test('焰火：焰火参数合法', () => {
  for (let s = 1; s <= 8; s++) {
    const show = generateFireworks(s, { count: 5 });
    assert.equal(show.fireworks.length, 5);
    for (const fw of show.fireworks) {
      assert.ok(fw.delay >= 0, '发射延迟非负');
      assert.ok(fw.x >= 0.1 && fw.x <= 0.85, '横向位置留白');
      assert.ok(fw.explodeY >= 0.1 && fw.explodeY <= 0.48, '爆点在上方天空');
      assert.ok(fw.particles >= 40 && fw.particles <= 130, '粒子数在 40~130');
      assert.ok(show.palette.includes(fw.color), '颜色取自调色板');
      assert.equal(typeof fw.secondary, 'boolean');
      assert.ok(fw.gravity > 0 && fw.gravity <= 0.7, '重力合理');
      assert.ok(fw.trail > 0 && fw.trail <= 1, '拖尾合理');
    }
  }
});

test('焰火：发射延迟单调不减', () => {
  for (let s = 1; s <= 10; s++) {
    const show = generateFireworks(s);
    for (let i = 1; i < show.fireworks.length; i++) {
      assert.ok(show.fireworks[i].delay >= show.fireworks[i - 1].delay, '延迟应单调不减');
    }
  }
});

test('焰火：焰火数量受配置约束（2~12）', () => {
  for (let s = 1; s <= 16; s++) {
    const two = generateFireworks(s, { count: 2 });
    assert.equal(two.fireworks.length, 2);
    const auto = generateFireworks(s);
    assert.ok(auto.fireworks.length >= 2 && auto.fireworks.length <= 12, '默认数量在 2~12');
  }
});

test('焰火：色调与统计一致', () => {
  for (const tone of Object.keys(FIREWORK_TONES)) {
    const show = generateFireworks(808, { tone, count: 4 });
    assert.equal(show.tone, tone);
    assert.equal(show.toneLabel, FIREWORK_TONES[tone].label);
    assert.equal(show.stats.count, show.fireworks.length);
    assert.equal(show.stats.withSecondary, show.fireworks.filter(f => f.secondary).length);
    assert.equal(show.stats.maxDelay, show.fireworks[show.fireworks.length - 1].delay);
    // 粒子总数 = 各枚粒子数 ×（二次爆裂计 2 倍）
    const expect = show.fireworks.reduce((a, f) => a + f.particles * (f.secondary ? 2 : 1), 0);
    assert.equal(show.stats.particles, expect);
  }
});

test('焰火：色调调色板各有五色', () => {
  for (const tone of Object.keys(FIREWORK_TONES)) {
    const T = FIREWORK_TONES[tone];
    assert.equal(T.palette.length, 5, `${tone} 调色板应为五色`);
    for (const c of T.palette) assert.ok(/^#[0-9a-f]{6}$/i.test(c), `颜色 ${c} 为 hex`);
  }
});

test('焰火：不同种子 => 焰火编排不同', () => {
  const sig = (s) => JSON.stringify(generateFireworks(s, { count: 6 }).fireworks);
  const seen = new Set();
  for (let s = 1; s <= 16; s++) seen.add(sig(s));
  assert.ok(seen.size >= 12, '不同种子应产生多样化的焰火编排');
});
