import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOrigami, FOLD_STYLES } from '../origami/js/origami.js';

/** 独立计算某顶点的峰谷数（测试自验，不依赖实现内部函数） */
function vertexCounts(segments, x, y) {
  const lines = [];
  for (const s of segments) {
    if (s.type === 'row') {
      if (s.y1 === y && s.x1 <= x && x <= s.x2) lines.push(s);
    } else {
      if (s.x1 === x && s.y1 <= y && y <= s.y2) lines.push(s);
    }
  }
  const peaks = lines.filter(l => l.peak).length;
  return { peaks, valleys: lines.length - peaks, degree: lines.length };
}

test('纸境：同种子 => 同一张折痕图（确定性）', () => {
  const a = generateOrigami(6060);
  const b = generateOrigami(6060);
  assert.deepEqual(a, b);
});

test('纸境：马氏定理成立（每个顶点峰谷差恒为 2）', () => {
  for (let s = 1; s <= 12; s++) {
    for (const families of ['rowcol', 'row', 'col']) {
      const f = generateOrigami(s, { grid: 10, families });
      for (let x = 1; x < f.grid - 1; x++) {
        for (let y = 1; y < f.grid - 1; y++) {
          const c = vertexCounts(f.segments, x, y);
          assert.ok(c.degree >= 2, `种子 ${s} ${families}：顶点 (${x},${y}) 应至少有两条折痕`);
          assert.equal(Math.abs(c.peaks - c.valleys), 2,
            `种子 ${s} ${families}：顶点 (${x},${y}) 峰 ${c.peaks} 谷 ${c.valleys} 应差 2`);
        }
      }
    }
  }
});

test('纸境：峰谷标记均为布尔、端点在网格内', () => {
  const f = generateOrigami(707, { grid: 8 });
  for (const s of f.segments) {
    assert.equal(typeof s.peak, 'boolean');
    assert.ok(s.x1 >= 0 && s.y1 >= 0 && s.x2 <= f.grid && s.y2 <= f.grid, '端点在网格内');
    assert.ok(['row', 'col'].includes(s.type));
  }
});

test('纸境：折痕数量与网格、族一致', () => {
  const f = generateOrigami(808, { grid: 6, families: 'rowcol' });
  // 横纵全折：每方向 (n+1) 条线 × n 段
  assert.equal(f.stats.folds, 2 * 6 * 7);
  const rowOnly = generateOrigami(808, { grid: 6, families: 'row' });
  assert.equal(rowOnly.stats.folds, 6 * 7);
  assert.equal(rowOnly.stats.families, 1);
  assert.equal(f.stats.families, 2);
});

test('纸境：统计与结构一致、风格参数合法', () => {
  for (const style of Object.keys(FOLD_STYLES)) {
    const f = generateOrigami(909, { grid: 6, style });
    assert.equal(f.style, style);
    assert.equal(f.styleLabel, FOLD_STYLES[style].label);
    assert.ok(/^#[0-9a-f]{6}$/i.test(f.paper) && /^#[0-9a-f]{6}$/i.test(f.lineColor));
    assert.equal(f.stats.grid, f.grid);
    assert.equal(f.stats.folds, f.segments.length);
    assert.ok(f.stats.maekawaVertices >= 0);
  }
});

test('纸境：峰线与谷线均存在（图非平凡）', () => {
  for (let s = 1; s <= 10; s++) {
    const f = generateOrigami(s, { grid: 8 });
    const peaks = f.segments.filter(x => x.peak).length;
    const valleys = f.segments.filter(x => !x.peak).length;
    assert.ok(peaks > 0 && valleys > 0, `种子 ${s}：峰谷折痕均应存在`);
  }
});

test('纸境：不同种子 => 折痕肌理不同', () => {
  // 完整签名（含网格规模与峰谷标记），种子应产生多样肌理
  const sig = (s) => JSON.stringify(generateOrigami(s).segments);
  const seen = new Set();
  for (let s = 1; s <= 24; s++) seen.add(sig(s));
  assert.ok(seen.size >= 10, '不同种子应产生多样化的折痕肌理');
});
