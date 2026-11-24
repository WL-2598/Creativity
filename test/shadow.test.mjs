import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePuppets, puppetJoints, projectShadowX, SHADOW_TONES } from '../shadow/js/shadow.js';

test('影戏：同种子 => 同一组皮影（确定性）', () => {
  const a = generatePuppets(2020);
  const b = generatePuppets(2020);
  assert.deepEqual(a, b);
});

test('影戏：皮影参数合法', () => {
  for (let s = 1; s <= 10; s++) {
    const set = generatePuppets(s, { count: 3 });
    assert.equal(set.puppets.length, 3);
    for (const p of set.puppets) {
      assert.ok(p.x > 0.15 && p.x < 0.85, '皮影横位在幕内');
      assert.ok(p.y > 0.4 && p.y < 0.9, '皮影基线在幕内');
      assert.ok(p.scale > 0.8 && p.scale <= 1.3, '缩放合理');
      assert.ok(p.torsoLen > 0 && p.torsoLen < 0.4, '躯干长度合理');
      assert.ok(p.headR > 0 && p.headR < 0.08, '头径合理');
      for (const key of ['armU', 'armL', 'legU', 'legL']) {
        assert.ok(p[key] > 0 && p[key] < 0.25, `${key} 长度为正`);
      }
      for (const key of ['a1', 'a2', 'b1', 'b2']) {
        assert.ok(Math.abs(p[key]) <= Math.PI, `${key} 角度在 [-π, π]`);
      }
    }
  }
});

test('影戏：关节点由骨架连通且位置在幕内', () => {
  const set = generatePuppets(303, { count: 2 });
  for (const p of set.puppets) {
    const j = puppetJoints(p);
    for (const pt of Object.values(j)) {
      assert.ok(pt.x >= -0.05 && pt.x <= 1.05, `关节 x 在幕内：${pt.x.toFixed(3)}`);
      assert.ok(pt.y >= -0.05 && pt.y <= 1.05, `关节 y 在幕内：${pt.y.toFixed(3)}`);
      assert.ok(pt.w > 0, '关节线宽为正');
    }
    // 头在躯干之上
    assert.ok(j.head.y < j.shoulder.y, '头在肩之上');
    // 四肢自躯干伸出
    assert.ok(j.elbowR.y > j.shoulder.y - 0.01, '右肘在肩之下');
    assert.ok(j.kneeR.y > j.hip.y - 0.01, '右膝在髋之下');
  }
});

test('影戏：投影公式——灯在正上方时影在正下，灯偏则影长', () => {
  // 灯在正上方：影与本体同横坐标
  assert.ok(Math.abs(projectShadowX(0.5, 0.4, 0.5, 0.1, 0.9) - 0.5) < 1e-9, '灯在正上方，影不横移');
  // 灯在左侧：影子向右伸
  const sh = projectShadowX(0.5, 0.4, 0.2, 0.1, 0.9);
  assert.ok(sh > 0.5, '灯偏左，影向右伸');
  // 灯在右侧：影子向左伸
  const sh2 = projectShadowX(0.5, 0.4, 0.8, 0.1, 0.9);
  assert.ok(sh2 < 0.5, '灯偏右，影向左伸');
});

test('影戏：影长随灯高角单调——灯越低影越长', () => {
  const low = projectShadowX(0.5, 0.2, 0.2, 0.3, 0.9);
  const high = projectShadowX(0.5, 0.2, 0.2, 0.1, 0.9);
  assert.ok(low > high, '灯越低，影越长');
  // 同一灯位：越高的皮影影越长
  const short = projectShadowX(0.5, 0.6, 0.2, 0.1, 0.9);
  const tall = projectShadowX(0.5, 0.2, 0.2, 0.1, 0.9);
  assert.ok(tall > short, '皮影越高，影越长');
});

test('影戏：灯调与统计一致', () => {
  for (const tone of Object.keys(SHADOW_TONES)) {
    const set = generatePuppets(404, { tone, count: 4 });
    assert.equal(set.tone, tone);
    assert.equal(set.toneLabel, SHADOW_TONES[tone].label);
    assert.equal(set.light, SHADOW_TONES[tone].light);
    assert.equal(set.stats.puppets, set.puppets.length);
    assert.equal(set.stats.joints, set.puppets.length * 11);
  }
});

test('影戏：不同种子 => 皮影编排不同', () => {
  const sig = (s) => JSON.stringify(generatePuppets(s, { count: 3 }).puppets);
  const seen = new Set();
  for (let s = 1; s <= 16; s++) seen.add(sig(s));
  assert.ok(seen.size >= 12, '不同种子应产生多样化的皮影编排');
});
