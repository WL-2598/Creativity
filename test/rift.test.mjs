/**
 * rift.test.mjs — 裂隙地形核心测试
 * 确定性、高程边界、地形起伏、水系寻径。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  makeNoise, fbm, generateTerrain, findRivers, terrainStats, CONTOUR_LEVELS,
} from '../rift/js/terrain.js';

test('噪声：值噪声与 fbm 落在 [0,1]', () => {
  const noise = makeNoise(42);
  for (let i = 0; i < 200; i++) {
    const x = (Math.random() - 0.5) * 20;
    const y = (Math.random() - 0.5) * 20;
    const n = noise(x, y);
    const f = fbm(noise, x, y);
    assert.ok(n >= 0 && n <= 1, `噪声越界: ${n}`);
    assert.ok(f >= 0 && f <= 1, `fbm 越界: ${f}`);
  }
});

test('地形：同种子 => 同一高度场（确定性）', () => {
  const a = generateTerrain(2026, 64, 48);
  const b = generateTerrain(2026, 64, 48);
  assert.deepEqual(Array.from(a.grid), Array.from(b.grid));
});

test('地形：高程全部落在 [0,1] 且有起伏', () => {
  for (let seed = 1; seed < 25; seed++) {
    const t = generateTerrain(seed, 80, 60);
    assert.equal(t.grid.length, 80 * 60);
    const s = terrainStats(t);
    assert.ok(s.min >= 0 && s.max <= 1, `高程越界: [${s.min}, ${s.max}]`);
    assert.ok(s.range > 0.3, `地形应有明显起伏: range ${s.range}`);
  }
});

test('地形：不同种子 => 不同山河', () => {
  const a = generateTerrain(111, 48, 36);
  const b = generateTerrain(222, 48, 36);
  assert.notDeepEqual(Array.from(a.grid), Array.from(b.grid));
});

test('水系：能从高处寻得脉络，且沿下降方向', () => {
  const t = generateTerrain(808, 80, 60);
  const rivers = findRivers(t, 4);
  assert.ok(rivers.length >= 1, '至少应寻得一条水系');
  for (const river of rivers) {
    assert.ok(river.points.length > 4);
    // 水系应整体向下：终点不高于起点
    const start = t.grid[river.points[0].y * t.width + river.points[0].x];
    const end = t.grid[river.points[river.points.length - 1].y * t.width + river.points[river.points.length - 1].x];
    assert.ok(end <= start + 1e-9, `水系应沿下降方向: ${start} → ${end}`);
    // 路径坐标合法
    for (const p of river.points) {
      assert.ok(p.x >= 0 && p.y >= 0 && p.x < t.width && p.y < t.height);
    }
  }
});

test('等高线级单调分布', () => {
  for (let i = 1; i < CONTOUR_LEVELS.length; i++) {
    assert.ok(CONTOUR_LEVELS[i] > CONTOUR_LEVELS[i - 1]);
  }
});

test('地形：大尺寸生成稳定（性能与边界）', () => {
  const t = generateTerrain(31415, 200, 150);
  assert.equal(t.grid.length, 200 * 150);
  const s = terrainStats(t);
  assert.ok(s.range > 0.3);
  const rivers = findRivers(t, 4);
  assert.ok(rivers.length >= 1);
});
