import test from 'node:test';
import assert from 'node:assert/strict';
import { generateStoneField, shadowOf, STONE_ERAS } from '../stones/js/stones.js';

test('石阵：同种子 => 同一处石阵（确定性）', () => {
  const a = generateStoneField(6060);
  const b = generateStoneField(6060);
  assert.deepEqual(a, b);
});

test('石阵：石柱参数合法、互不重叠、环绕中心', () => {
  for (let s = 1; s <= 8; s++) {
    const f = generateStoneField(s, { count: 8 });
    assert.equal(f.stones.length, 8);
    for (const st of f.stones) {
      assert.ok(st.x > 0.1 && st.x < 0.9, '石柱在画面内');
      assert.ok(st.y > 0.1 && st.y < 0.9, '石柱在画面内');
      assert.ok(st.h > 0 && st.h < 0.5, '柱高合理');
      assert.ok(st.w > 0 && st.w < 0.06, '柱宽合理');
      assert.ok(st.tilt >= -0.25 && st.tilt <= 0.25, '倾角合理');
      // 环绕中心：与中心距离大于 0.05
      assert.ok(Math.hypot(st.x - 0.5, st.y - 0.5) > 0.05, '石柱应环绕中心');
    }
    for (let i = 0; i < f.stones.length; i++) {
      for (let j = i + 1; j < f.stones.length; j++) {
        assert.ok(Math.hypot(f.stones[i].x - f.stones[j].x, f.stones[i].y - f.stones[j].y) > 0.08,
          `石柱 ${i} 与 ${j} 不应重叠`);
      }
    }
  }
});

test('石阵：日轨参数合法', () => {
  for (let s = 1; s <= 8; s++) {
    const f = generateStoneField(s);
    assert.ok(f.sun.az1 > f.sun.az0, '日轨应为一段弧');
    assert.ok(f.sun.elev > 0 && f.sun.elev < Math.PI / 2, '高度角在 (0, π/2)');
    assert.ok(f.stats.sunRange > 0);
  }
});

test('石阵：阴影方向与太阳方位相反', () => {
  const st = { x: 0.5, y: 0.5, h: 0.2, w: 0.03, tilt: 0 };
  const az = 0.8;
  const sh = shadowOf(st, az, 0.6);
  // 影子向量应指向太阳方位 + π
  const ang = Math.atan2(sh.dy, sh.dx);
  const diff = ((ang - (az + Math.PI)) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  assert.ok(diff < 1e-9, `阴影方向应与日方位相反（偏差 ${diff}）`);
});

test('石阵：影长 = 柱高 ÷ tan(高度角)', () => {
  const st = { x: 0.5, y: 0.5, h: 0.3, w: 0.03, tilt: 0 };
  for (const elev of [0.3, 0.6, 1.0]) {
    const sh = shadowOf(st, 1.0, elev);
    const expect = st.h / Math.tan(elev);
    assert.ok(Math.abs(sh.len - expect) < 1e-9, `高度角 ${elev}：影长应为 ${expect.toFixed(4)}`);
  }
});

test('石阵：高度角趋平则影长趋大（有上限）', () => {
  const st = { x: 0.5, y: 0.5, h: 0.3, w: 0.03, tilt: 0 };
  const low = shadowOf(st, 1.0, 0.05);
  const high = shadowOf(st, 1.0, 1.4);
  assert.ok(low.len > high.len, '低悬太阳影长应更长');
  assert.ok(low.len <= 1.5 && high.len <= 1.5, '影长有上限');
});

test('石阵：不同种子与时辰 => 石阵不同', () => {
  const sig = (s) => JSON.stringify(generateStoneField(s, { count: 8 }).stones);
  const seen = new Set();
  for (let s = 1; s <= 16; s++) seen.add(sig(s));
  assert.ok(seen.size >= 12, '不同种子应产生多样化的石阵');
  for (const era of Object.keys(STONE_ERAS)) {
    const f = generateStoneField(99, { era });
    assert.equal(f.era, era);
    assert.equal(f.eraLabel, STONE_ERAS[era].label);
  }
});
