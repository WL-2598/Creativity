import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTide, TIDE_SEASONS, TIDE_PERIODS } from '../tide/js/tide.js';

test('潮汐：同种子 => 同一处海域（确定性）', () => {
  const a = generateTide(4444);
  const b = generateTide(4444);
  assert.deepEqual(a, b);
});

test('潮汐：月相与月轮参数合法', () => {
  for (let s = 1; s <= 8; s++) {
    const T = generateTide(s);
    assert.ok(T.phase >= 0 && T.phase <= 1, '月相在 [0,1]');
    assert.ok(T.moon.x >= 0.2 && T.moon.x <= 0.8, '月轮 x 留白');
    assert.ok(T.moon.y >= 0.1 && T.moon.y <= 0.47, '月轮在上方天空');
    assert.ok(T.moon.r > 0, '月轮半径为正');
  }
});

test('潮汐：潮位曲线周期自洽（半日潮主导）', () => {
  const T = generateTide(900, { hours: 48 });
  assert.equal(T.tide.length, 97); // 0..48 步进 0.5 → 97 点
  // 线性插值取任意时刻潮位
  const at = (h) => {
    const i = Math.floor(h / 0.5);
    const a = T.tide[i], b = T.tide[Math.min(i + 1, T.tide.length - 1)];
    const f = (h - a.t) / (b.t - a.t || 1);
    return a.level + (b.level - a.level) * f;
  };
  // 半日潮周期 12.4h：曲线在 12.4h 位移后应高度自相似
  const half = TIDE_PERIODS.semidiurnal;
  const diff = Math.abs(at(0) - at(half));
  assert.ok(diff < Math.abs(at(0) - at(3)), '半日潮应使 12.4h 处回归相近水位');
  // 曲线值域与统计一致
  for (const p of T.tide) {
    assert.ok(p.level >= T.stats.minTide - 1e-9 && p.level <= T.stats.maxTide + 1e-9, '潮位在值域内');
  }
});

test('潮汐：三种潮汐类型的振幅基调成立', () => {
  const spring = generateTide(11, { season: 'spring' });
  const neap = generateTide(11, { season: 'neap' });
  assert.equal(spring.season, 'spring');
  assert.equal(neap.season, 'neap');
  assert.ok(spring.stats.range >= neap.stats.range, '大潮潮差应不小于小潮');
  assert.ok(spring.stats.isSpring, '大潮标记正确');
  assert.ok(!neap.stats.isSpring, '小潮不应标记为大潮');
});

test('潮汐：浪况参数合法', () => {
  const T = generateTide(222);
  assert.ok(T.waves.amp > 0 && T.waves.amp < 30, '浪高合理');
  assert.ok(T.waves.freq > 0, '波频为正');
  assert.ok(T.waves.speed > 0, '波速为正');
  assert.ok(T.waves.sharp >= 0 && T.waves.sharp <= 1, '浪形尖锐度在 [0,1]');
});

test('潮汐：统计与结构一致', () => {
  const T = generateTide(333, { hours: 24 });
  assert.equal(T.stats.hours, 24);
  assert.equal(T.stats.samples, T.tide.length);
  assert.equal(T.stats.maxTide, Math.max(...T.tide.map(p => p.level)));
  assert.equal(T.stats.minTide, Math.min(...T.tide.map(p => p.level)));
  assert.ok(Math.abs(T.stats.range - (T.stats.maxTide - T.stats.minTide)) < 1e-9);
});

test('潮汐：不同种子 => 月相与浪况不同', () => {
  const sig = (s) => JSON.stringify(generateTide(s, { hours: 24 }).tide);
  const seen = new Set();
  for (let s = 1; s <= 16; s++) seen.add(sig(s));
  assert.ok(seen.size >= 12, '不同种子应产生多样化的潮位曲线');
});
