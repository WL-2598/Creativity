import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePulseNet } from '../pulse/js/pulse.js';

test('脉境：同种子 => 同一张脉网（确定性）', () => {
  const a = generatePulseNet(4242);
  const b = generatePulseNet(4242);
  assert.deepEqual(a, b);
});

test('脉境：节点参数合法', () => {
  const net = generatePulseNet(101, { nodes: 20 });
  assert.equal(net.nodes.length, 20);
  for (const n of net.nodes) {
    assert.ok(n.x > 0 && n.x <= 1, 'x 在 (0,1]');
    assert.ok(n.y > 0 && n.y <= 1, 'y 在 (0,1]');
    assert.ok(n.freq > 0 && n.freq <= 120, '节拍在 0~120 bpm');
    assert.ok(n.size > 0, '尺寸为正');
    assert.ok(Number.isFinite(n.phase), '相位有限');
  }
});

test('脉境：边合法（无自环、无重边、端点在范围内）', () => {
  for (let s = 1; s <= 10; s++) {
    const net = generatePulseNet(s, { nodes: 16 });
    const seen = new Set();
    for (const e of net.edges) {
      assert.notEqual(e.a, e.b, '不应有自环');
      assert.ok(e.a >= 0 && e.a < net.nodes.length);
      assert.ok(e.b >= 0 && e.b < net.nodes.length);
      const key = `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`;
      assert.ok(!seen.has(key), `不应有重边：${key}`);
      seen.add(key);
    }
  }
});

test('脉境：传播时延 = 距离 / 速度', () => {
  const speed = 0.8;
  const net = generatePulseNet(202, { nodes: 12, speed });
  assert.equal(net.speed, speed);
  for (const e of net.edges) {
    const d = Math.hypot(net.nodes[e.a].x - net.nodes[e.b].x, net.nodes[e.a].y - net.nodes[e.b].y);
    assert.ok(Math.abs(e.delay - d / speed) < 1e-9, '时延应等于距离除以速度');
    assert.ok(e.delay > 0, '时延为正');
  }
});

test('脉境：脉网全域连通', () => {
  for (let s = 1; s <= 16; s++) {
    const net = generatePulseNet(s);
    assert.ok(net.stats.connectivity, `种子 ${s}：脉网应连通`);
    assert.equal(net.stats.nodes, net.nodes.length);
    assert.equal(net.stats.edges, net.edges.length);
  }
});

test('脉境：每节点至少有一条边', () => {
  for (let s = 1; s <= 10; s++) {
    const net = generatePulseNet(s, { nodes: 10 });
    for (let i = 0; i < net.nodes.length; i++) {
      assert.ok(net.edges.some(e => e.a === i || e.b === i), `节点 ${i} 应至少有一条边`);
    }
  }
});

test('脉境：不同种子 => 脉网不同', () => {
  const sig = (s) => JSON.stringify(generatePulseNet(s, { nodes: 14 }).nodes);
  let diff = 0;
  for (let s = 1; s <= 12; s++) {
    if (sig(s) !== sig(s + 9000)) diff++;
  }
  assert.ok(diff >= 10, '相邻种子应多数产生不同脉网');
});
