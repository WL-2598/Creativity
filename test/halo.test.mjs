import test from 'node:test';
import assert from 'node:assert/strict';
import { generateHalo, HALO_SCENES, OPTICAL_ANGLES } from '../halo/js/halo.js';

test('晕境：同种子 => 同一处天象（确定性）', () => {
  const a = generateHalo(3030);
  const b = generateHalo(3030);
  assert.deepEqual(a, b);
});

test('晕境：场景与光源参数合法', () => {
  for (const scene of Object.keys(HALO_SCENES)) {
    const h = generateHalo(100, { scene });
    assert.equal(h.scene, scene);
    assert.equal(h.sceneLabel, HALO_SCENES[scene].label);
    assert.ok(h.light.x >= 0.2 && h.light.x <= 0.75, '光源 x 留白');
    assert.ok(h.light.y >= 0.1 && h.light.y <= 0.5, '光源 y 在上方');
    assert.ok(h.light.r > 0, '光源半径为正');
    assert.ok(typeof h.lightColor === 'string' && h.glowColor.startsWith('rgba'));
  }
});

test('晕境：环带角序符合物理（日晕 < 主虹 < 副虹）', () => {
  const h = generateHalo(404);
  assert.equal(h.rings.length, 3);
  const kinds = h.rings.map(r => r.kind);
  assert.deepEqual(kinds, ['corona', 'primary', 'secondary']);
  const angles = h.rings.map(r => r.angle);
  for (let i = 1; i < angles.length; i++) {
    assert.ok(angles[i] > angles[i - 1], '环带角半径应递增');
  }
  assert.equal(angles[0], OPTICAL_ANGLES.corona);
  assert.equal(angles[1], OPTICAL_ANGLES.primary);
  assert.equal(angles[2], OPTICAL_ANGLES.secondary);
});

test('晕境：环带色序符合物理（主虹红外紫内，副虹相反）', () => {
  const h = generateHalo(505);
  const primary = h.rings.find(r => r.kind === 'primary');
  const secondary = h.rings.find(r => r.kind === 'secondary');
  assert.ok(primary.color.startsWith('rgba(255'), '主虹外缘应偏红');
  assert.ok(primary.inner.startsWith('rgba(180'), '主虹内缘应偏紫');
  assert.ok(secondary.color.startsWith('rgba(180'), '副虹外缘应偏紫');
  assert.ok(secondary.inner.startsWith('rgba(255'), '副虹内缘应偏红');
});

test('晕境：星芒与雾滴参数合法', () => {
  const h = generateHalo(606, { drops: 50, rays: 6 });
  assert.equal(h.drops.length, 50);
  assert.equal(h.rays.length, 6);
  for (const r of h.rays) {
    assert.ok(Number.isFinite(r.angle) && r.length > 0 && r.length <= 1 && r.alpha >= 0 && r.alpha <= 1);
  }
  for (const d of h.drops) {
    assert.ok(d.x >= 0 && d.x <= 1 && d.y >= 0 && d.y <= 1, '雾滴在单位格内');
    assert.ok(d.r > 0, '雾滴尺寸为正');
  }
});

test('晕境：统计与结构一致', () => {
  const h = generateHalo(707, { drops: 44, rays: 9 });
  assert.equal(h.stats.rings, h.rings.length);
  assert.equal(h.stats.rays, h.rays.length);
  assert.equal(h.stats.drops, h.drops.length);
  assert.equal(h.stats.hasRainbow, h.rings.some(r => r.kind === 'primary'));
});

test('晕境：不同种子 => 天象不同', () => {
  const sig = (s) => JSON.stringify(generateHalo(s, { drops: 40, rays: 6 }).drops);
  let diff = 0;
  for (let s = 1; s <= 12; s++) {
    if (sig(s) !== sig(s + 7000)) diff++;
  }
  assert.ok(diff >= 10, '相邻种子应多数产生不同天象');
});
