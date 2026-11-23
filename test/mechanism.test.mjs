import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMechanism } from '../mechanism/js/mechanism.js';

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

test('机枢：同种子 => 同一套机构（确定性）', () => {
  const a = generateMechanism(20250);
  const b = generateMechanism(20250);
  assert.deepEqual(a.gears, b.gears);
  assert.deepEqual(a.pendulum, b.pendulum);
  assert.deepEqual(a.stats, b.stats);
});

test('机枢：齿数与半径合法', () => {
  const m = generateMechanism(999, { gears: 6 });
  assert.equal(m.gears.length, 6);
  for (const g of m.gears) {
    assert.ok(g.teeth >= 12 && g.teeth <= 44, `齿数 ${g.teeth} 应在 12~44`);
    assert.ok(g.radius > 0, '半径为正');
    assert.ok(Number.isFinite(g.phase), '相位有限');
  }
});

test('机枢：相邻齿轮啮合（间距 = 半径和 + 间隙）', () => {
  const m = generateMechanism(31337, { gears: 7 });
  const gap = 8;
  for (let i = 1; i < m.gears.length; i++) {
    const d = dist(m.gears[i], m.gears[i - 1]);
    assert.ok(
      Math.abs(d - (m.gears[i].radius + m.gears[i - 1].radius + gap)) < 0.001,
      `第 ${i} 与第 ${i - 1} 只齿轮应恰好啮合`
    );
  }
});

test('机枢：任意两只齿轮不重叠', () => {
  for (let s = 1; s <= 30; s++) {
    const m = generateMechanism(s, { gears: 8 });
    for (let i = 0; i < m.gears.length; i++) {
      for (let j = i + 1; j < m.gears.length; j++) {
        const d = dist(m.gears[i], m.gears[j]);
        assert.ok(d >= m.gears[i].radius + m.gears[j].radius - 0.001,
          `种子 ${s}：第 ${i} 与第 ${j} 只齿轮重叠`);
      }
    }
  }
});

test('机枢：传动比 = 齿数反比、转向交替', () => {
  const m = generateMechanism(8888, { gears: 5 });
  for (let i = 0; i < m.gears.length; i++) {
    // |ω| × 齿数 = 常数（模数恒定）
    const v = Math.abs(m.gears[i].speed) * m.gears[i].teeth;
    assert.ok(Math.abs(v - 0.25 * m.gears[0].teeth) < 1e-9, `齿轮 ${i} 传动比应为齿数反比`);
    assert.equal(Math.sign(m.gears[i].speed), i % 2 === 0 ? 1 : -1, `齿轮 ${i} 转向应交替`);
  }
});

test('机枢：统计信息与结构一致', () => {
  const m = generateMechanism(4242, { gears: 5 });
  assert.equal(m.stats.gears, m.gears.length);
  assert.equal(m.stats.totalTeeth, m.gears.reduce((a, g) => a + g.teeth, 0));
  assert.ok(m.stats.gearRatio > 0);
  assert.equal(m.stats.hasPendulum, !!m.pendulum);
  assert.ok(m.pendulum.length > 0 && m.pendulum.amp > 0);
});

test('机枢：不同种子 => 齿数序列不同', () => {
  const sig = (s) => generateMechanism(s, { gears: 4 }).gears.map(g => g.teeth).join(',');
  const seen = new Set();
  for (let s = 1; s <= 24; s++) seen.add(sig(s));
  assert.ok(seen.size >= 20, '不同种子应产生多样化的齿数序列');
});
