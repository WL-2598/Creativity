import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGo, findGroup, groupLiberties, BOARD_SIZES } from '../go/js/go.js';

test('棋境：同种子 => 同一局棋（确定性）', () => {
  const a = generateGo(1313);
  const b = generateGo(1313);
  assert.deepEqual(a, b);
});

test('棋境：落子合法、互不重叠、黑白交替', () => {
  for (let s = 1; s <= 10; s++) {
    const g = generateGo(s, { size: 19 });
    assert.equal(g.size, 19);
    const seen = new Set();
    for (const stone of g.stones) {
      assert.ok(stone.x >= 0 && stone.x < 19 && stone.y >= 0 && stone.y < 19, '落子在盘内');
      assert.ok(['black', 'white'].includes(stone.color), '颜色合法');
      const key = `${stone.x},${stone.y}`;
      assert.ok(!seen.has(key), `落子不应重叠：${key}`);
      seen.add(key);
    }
    assert.ok(Math.abs(g.stats.black - g.stats.white) <= 1, '黑白手数差不超过 1');
    assert.ok(g.stats.moves === g.stones.length);
  }
});

test('棋境：星位合法且位于盘内', () => {
  for (const size of Object.values(BOARD_SIZES)) {
    const g = generateGo(50, { size });
    assert.equal(g.size, size);
    assert.ok(g.stars.length > 0, '应有星位');
    for (const [x, y] of g.stars) {
      assert.ok(x >= 0 && x < size && y >= 0 && y < size, '星位在盘内');
    }
  }
});

test('棋境：连通块与气数计算正确（手工局面）', () => {
  // 19 路盘中央一子：4 气
  const solo = [{ x: 9, y: 9, color: 'black' }];
  assert.equal(groupLiberties(solo, 19, 9, 9), 4, '中央单子应 4 气');

  // 相邻两子：6 气
  const pair = [{ x: 9, y: 9, color: 'black' }, { x: 10, y: 9, color: 'black' }];
  assert.equal(groupLiberties(pair, 19, 9, 9), 6, '横连两子应 6 气');
  assert.equal(groupLiberties(pair, 19, 10, 9), 6, '同一连通块气数一致');

  // 被围一子：0 气
  const surrounded = [
    { x: 9, y: 9, color: 'black' },
    { x: 8, y: 9, color: 'white' },
    { x: 10, y: 9, color: 'white' },
    { x: 9, y: 8, color: 'white' },
    { x: 9, y: 10, color: 'white' },
  ];
  assert.equal(groupLiberties(surrounded, 19, 9, 9), 0, '被围之子应无气');

  // 异色不连通：黑子旁边的白子不属同一连通块，黑子仅剩 3 气
  const mixed = [{ x: 9, y: 9, color: 'black' }, { x: 10, y: 9, color: 'white' }];
  assert.equal(groupLiberties(mixed, 19, 9, 9), 3, '异色不相连，各算各的气');
});

test('棋境：findGroup 返回完整连通块', () => {
  const stones = [
    { x: 9, y: 9, color: 'black' },
    { x: 10, y: 9, color: 'black' },
    { x: 10, y: 10, color: 'black' },
    { x: 11, y: 9, color: 'white' },
  ];
  const group = findGroup(stones, 9, 9);
  assert.equal(group.length, 3, '应返回三子连通块');
  assert.deepEqual(group.map(s => `${s.x},${s.y}`).sort(), ['10,10', '10,9', '9,9']);
});

test('棋境：空点查询返回 0 气', () => {
  const stones = [{ x: 9, y: 9, color: 'black' }];
  assert.equal(groupLiberties(stones, 19, 5, 5), 0, '空点无连通块，气数为 0');
});

test('棋境：不同种子 => 棋局不同', () => {
  const sig = (s) => JSON.stringify(generateGo(s, { size: 19 }).stones);
  const seen = new Set();
  for (let s = 1; s <= 16; s++) seen.add(sig(s));
  assert.ok(seen.size >= 12, '不同种子应产生多样化的棋局');
});
