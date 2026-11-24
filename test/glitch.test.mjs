import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGlitch, GLITCH_SCENES } from '../glitch/js/glitch.js';

test('光斑：同种子 => 同一帧故障（确定性）', () => {
  const a = generateGlitch(5150);
  const b = generateGlitch(5150);
  assert.deepEqual(a, b);
});

test('光斑：位移带参数合法', () => {
  for (let s = 1; s <= 8; s++) {
    const g = generateGlitch(s, { bands: 8 });
    assert.equal(g.bands.length, 8);
    for (const b of g.bands) {
      assert.ok(b.y >= 0 && b.y <= 1, '带中心在 [0,1]');
      assert.ok(b.h > 0 && b.h <= 0.12, '带高合理');
      assert.ok(b.shift >= -0.12 && b.shift <= 0.12, '位移在 [-0.12,0.12]');
      assert.ok(b.rgb === 1 || b.rgb === -1, '通道变体合法');
      assert.ok(b.amp > 0 && b.amp <= 2, '带强度合理');
    }
  }
});

test('光斑：色散、扫描线与噪点参数合法', () => {
  for (let s = 1; s <= 8; s++) {
    const g = generateGlitch(s, { scanlines: 20 });
    assert.equal(g.scanlines, 20);
    assert.ok(g.chroma > 0 && g.chroma <= 0.03, '色散强度合理');
    assert.ok(g.noise > 0 && g.noise <= 0.15, '噪点密度合理');
  }
});

test('光斑：数据块参数合法', () => {
  for (let s = 1; s <= 12; s++) {
    const g = generateGlitch(s);
    for (const b of g.blocks) {
      assert.ok(b.x >= 0 && b.x <= 1 && b.y >= 0 && b.y <= 1, '数据块位置在 [0,1]');
      assert.ok(b.w > 0 && b.h > 0, '数据块尺寸为正');
      assert.ok(b.shift >= -0.1 && b.shift <= 0.1, '数据块位移合理');
    }
  }
});

test('光斑：场景与统计一致', () => {
  for (const scene of Object.keys(GLITCH_SCENES)) {
    const g = generateGlitch(606, { scene, bands: 5, scanlines: 12 });
    assert.equal(g.scene, scene);
    assert.equal(g.sceneLabel, GLITCH_SCENES[scene].label);
    assert.equal(g.base.length, 3);
    assert.equal(g.stats.bands, g.bands.length);
    assert.equal(g.stats.scanlines, g.scanlines);
    assert.equal(g.stats.blocks, g.blocks.length);
    assert.equal(g.stats.chroma, g.chroma);
    assert.equal(g.stats.noise, g.noise);
  }
});

test('光斑：带数量受配置约束（2~14）', () => {
  for (let s = 1; s <= 16; s++) {
    const g = generateGlitch(s, { bands: 2 });
    assert.equal(g.bands.length, 2);
    const auto = generateGlitch(s);
    assert.ok(auto.bands.length >= 2 && auto.bands.length <= 14, '默认带数在 2~14');
  }
});

test('光斑：不同种子 => 故障参数不同', () => {
  const sig = (s) => JSON.stringify(generateGlitch(s, { bands: 6, scanlines: 16 }));
  const seen = new Set();
  for (let s = 1; s <= 16; s++) seen.add(sig(s));
  assert.ok(seen.size >= 12, '不同种子应产生多样化的故障参数');
});
