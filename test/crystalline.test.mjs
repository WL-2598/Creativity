/**
 * crystalline.test.mjs — 晶境生长核心测试
 * 确定性、生长发生、晶簇连通、覆盖率与统计一致。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { growCrystals, crystalStats } from '../crystalline/js/crystal.js';

function grow(seed, w = 60, h = 40) {
  return growCrystals(seed, { width: w, height: h, seeds: 4, steps: 80 });
}

test('晶体：同种子 => 同一结晶（确定性）', () => {
  const a = grow(555, 60, 40);
  const b = grow(555, 60, 40);
  assert.deepEqual(Array.from(a.grid), Array.from(b.grid));
  assert.deepEqual(Array.from(a.order), Array.from(b.order));
});

test('晶体：生长确实发生（覆盖率大于晶种）', () => {
  for (let seed = 1; seed < 30; seed++) {
    const r = grow(seed);
    const s = crystalStats(r);
    assert.ok(s.coverage > 0.02, `覆盖率过低: ${s.coverage}`);
    assert.ok(s.grown > 4, `生长应超过晶种数量: ${s.grown}`);
  }
});

test('晶体：每个晶簇连通（簇内无孤立孤岛）', () => {
  const r = grow(123, 64, 48);
  const { grid, width, height } = r;
  // 对每个簇做 BFS，验证所有同簇格子连通
  const seen = new Int32Array(grid.length);
  for (let i = 0; i < grid.length; i++) {
    const cid = grid[i];
    if (cid === 0 || seen[i] === cid) continue;
    // BFS
    const stack = [i];
    seen[i] = cid;
    let count = 0;
    while (stack.length) {
      const cur = stack.pop();
      count++;
      const cx = cur % width, cy = Math.floor(cur / width);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const ni = ny * width + nx;
          if (grid[ni] === cid && seen[ni] !== cid) { seen[ni] = cid; stack.push(ni); }
        }
      }
    }
    // 簇内所有格子都应被 BFS 访问到
    const total = Array.from(grid).filter(g => g === cid).length;
    assert.equal(count, total, `簇 ${cid} 存在不连通的孤岛`);
  }
});

test('晶体：生长次序单调且与网格一致', () => {
  const r = grow(88);
  const { order, grid } = r;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] > 0) {
      assert.ok(order[i] >= 0, '已生长格子应有生长次序');
    } else {
      assert.equal(order[i], -1, '未生长格子次序应为 -1');
    }
  }
  // 次序从 0 连续递增
  const orders = Array.from(order).filter(o => o >= 0).sort((a, b) => a - b);
  for (let i = 0; i < orders.length; i++) assert.equal(orders[i], i);
});

test('晶体：统计与网格一致', () => {
  const r = grow(321, 50, 36);
  const s = crystalStats(r);
  const grown = Array.from(r.grid).filter(g => g > 0).length;
  assert.equal(s.grown, grown);
  assert.ok(s.coverage > 0 && s.coverage <= 1);
  assert.ok(s.maxCluster >= 1);
  assert.ok(s.clusterCount >= 1 && s.clusterCount <= r.clusters);
});

test('晶体：不同种子 => 不同结晶', () => {
  const sets = new Set();
  for (let i = 0; i < 30; i++) {
    const r = grow(Math.floor(Math.random() * 0xFFFFFFFF), 48, 36);
    sets.add(Array.from(r.grid).join(','));
  }
  assert.ok(sets.size > 25, '随机种子应产生多样结晶');
});
