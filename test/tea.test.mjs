import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTeaSet, CLOTH_COLORS, GLAZES } from '../tea/js/tea.js';

test('茶境：同种子 => 同一席茶（确定性）', () => {
  const a = generateTeaSet(3030);
  const b = generateTeaSet(3030);
  assert.deepEqual(a, b);
});

test('茶境：器物参数合法、位置在席内', () => {
  for (let s = 1; s <= 8; s++) {
    const set = generateTeaSet(s, { guests: 4 });
    assert.equal(set.vessels.length, 4 + 1 + 1 + 1 + 1); // 壶+4盏+托+炉+瓶
    for (const v of set.vessels) {
      assert.ok(v.x > 0.1 && v.x < 0.9, `器物 x 在席内：${v.type}`);
      assert.ok(v.y > 0.25 && v.y < 0.85, `器物 y 在席内：${v.type}`);
      assert.ok(v.r > 0 && v.r <= 0.12, `器物尺寸合理：${v.type}`);
      assert.ok(Object.keys(GLAZES).includes(v.glaze), `釉色合法：${v.type}`);
    }
    for (const sw of set.sweets) {
      assert.ok(sw.x > 0.2 && sw.x < 0.8, '茶点在席内');
      assert.ok(sw.r > 0, '茶点尺寸为正');
    }
  }
});

test('茶境：器物互不重叠（茶托托壶除外）', () => {
  for (let s = 1; s <= 10; s++) {
    const set = generateTeaSet(s, { guests: 6 });
    const big = set.vessels.filter(v => v.type !== 'cup');
    for (let i = 0; i < big.length; i++) {
      for (let j = i + 1; j < big.length; j++) {
        // 茶托托壶：有意的上下叠放
        if ((big[i].type === 'teapot' && big[j].type === 'coaster') ||
            (big[i].type === 'coaster' && big[j].type === 'teapot')) continue;
        const d = Math.hypot(big[i].x - big[j].x, big[i].y - big[j].y);
        assert.ok(d > big[i].r + big[j].r, `器物 ${big[i].type} 与 ${big[j].type} 不应重叠`);
      }
    }
    // 盏与盏之间
    const cups = set.vessels.filter(v => v.type === 'cup');
    for (let i = 0; i < cups.length; i++) {
      for (let j = i + 1; j < cups.length; j++) {
        const d = Math.hypot(cups[i].x - cups[j].x, cups[i].y - cups[j].y);
        assert.ok(d > cups[i].r + cups[j].r, `盏 ${i} 与 ${j} 不应重叠`);
      }
    }
  }
});

test('茶境：茶壶居主位、茶盏列客位', () => {
  const set = generateTeaSet(505, { guests: 4 });
  const pot = set.vessels.find(v => v.type === 'teapot');
  const cups = set.vessels.filter(v => v.type === 'cup');
  assert.equal(cups.length, 4);
  // 壶在中央
  assert.ok(Math.abs(pot.x - 0.5) < 0.01, '茶壶应居中');
  // 盏分列左右
  const left = cups.filter(c => c.x < 0.5).length;
  const right = cups.filter(c => c.x > 0.5).length;
  assert.ok(left >= 1 && right >= 1, '茶盏应左右分列');
  // 盏在壶的前方（y 更大）
  assert.ok(cups.every(c => c.y > pot.y), '茶盏应列于茶壶前方');
});

test('茶境：席布与釉色取自词典', () => {
  for (const cloth of Object.keys(CLOTH_COLORS)) {
    const set = generateTeaSet(606, { cloth });
    assert.equal(set.cloth, cloth);
    assert.equal(set.clothLabel, CLOTH_COLORS[cloth].label);
    assert.ok(/^#[0-9a-f]{6}$/i.test(set.clothColor));
    assert.ok(Object.keys(GLAZES).includes(set.glaze));
    assert.equal(set.glazeLabel, GLAZES[set.glaze].label);
  }
});

test('茶境：客位数受配置约束（2~8）', () => {
  for (let s = 1; s <= 12; s++) {
    const two = generateTeaSet(s, { guests: 2 });
    assert.equal(two.stats.cups, 2);
    const auto = generateTeaSet(s);
    assert.ok(auto.stats.guests >= 2 && auto.stats.guests <= 8, '默认客位在 2~8');
  }
});

test('茶境：统计与结构一致、不同种子编排不同', () => {
  const set = generateTeaSet(707, { guests: 6 });
  assert.equal(set.stats.vessels, set.vessels.length);
  assert.equal(set.stats.sweets, set.sweets.length);
  assert.equal(set.stats.guests, 6);
  const sig = (s) => JSON.stringify(generateTeaSet(s, { guests: 4 }));
  const seen = new Set();
  for (let s = 1; s <= 16; s++) seen.add(sig(s));
  assert.ok(seen.size >= 12, '不同种子应产生多样化的茶席编排');
});
