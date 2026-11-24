/**
 * ink-render.test.mjs — 墨韵笔法与渲染冒烟测试
 * 笔触生成合法性 + mock 画布驱动真实渲染引擎。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateMotif, MOTIF_KEYS, inkColor } from '../inkflow/js/motifs.js';
import { InkRenderer } from '../inkflow/js/ink.js';
import { rngFromSeed } from '../starlark/js/audio/composition.js';

/* ---------- 笔法母题 ---------- */
test('笔法：所有母题均生成合法笔触', () => {
  for (const motif of MOTIF_KEYS) {
    for (let seed = 1; seed < 20; seed++) {
      const strokes = generateMotif(rngFromSeed(seed), motif, 800, 600);
      assert.ok(strokes.length > 0, `${motif} 应生成笔触`);
      for (const s of strokes) {
        assert.ok(Array.isArray(s.points) && s.points.length > 0, '笔触应有折点');
        assert.ok(s.ink >= 0 && s.ink <= 1, `墨色应在 [0,1]: ${s.ink}`);
        assert.ok(s.width >= 0);
        for (const p of s.points) {
          assert.ok(p.x >= -60 && p.x <= 860, `x 越界: ${p.x}`);
          assert.ok(p.y >= -60 && p.y <= 660, `y 越界: ${p.y}`);
        }
      }
    }
  }
});

test('笔法：晕染与点状笔触具备绘制参数', () => {
  for (const motif of MOTIF_KEYS) {
    const strokes = generateMotif(rngFromSeed(5), motif, 800, 600);
    for (const s of strokes) {
      if (s.kind === 'wash') assert.ok(s.points[0].r > 0, '晕染应有半径');
      if (s.kind === 'dot') assert.ok(s.width > 0);
    }
  }
});

test('墨色：浓度映射到合理的 rgba', () => {
  const c0 = inkColor(0);
  const c1 = inkColor(1);
  assert.match(c0, /^rgba\(/);
  assert.match(c1, /^rgba\(/);
  // 浓墨应明显比清墨深
  const g0 = parseInt(c0.match(/rgba\((\d+)/)[1]);
  const g1 = parseInt(c1.match(/rgba\((\d+)/)[1]);
  assert.ok(g1 < g0, '浓墨灰度应低于清墨');
});

/* ---------- 渲染冒烟 ---------- */
function makeMockCtx() {
  const gradient = { addColorStop() {} };
  return new Proxy({}, {
    get(_, prop) {
      if (prop === 'getImageData') return () => ({ data: new Uint8ClampedArray(800 * 600 * 4) });
      if (prop === 'canvas') return { width: 800, height: 600 };
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => gradient;
      // 属性读取返回合理默认值
      if (['fillStyle', 'strokeStyle', 'font', 'textAlign', 'textBaseline', 'lineCap', 'lineJoin', 'globalCompositeOperation'].includes(prop)) return '';
      if (['lineWidth', 'globalAlpha'].includes(prop)) return 1;
      return () => {};
    },
    set() { return true; },
  });
}

function installMocks() {
  globalThis.window = { addEventListener() {}, devicePixelRatio: 1 };
  globalThis.requestAnimationFrame = () => 0;
  globalThis.document = {
    createElement: () => {
      const c = { width: 0, height: 0, getContext: () => makeMockCtx() };
      return c;
    },
  };
}

function makeCanvas() {
  return { clientWidth: 800, clientHeight: 600, getContext: () => makeMockCtx() };
}

test('渲染：展卷 → 渲染多帧无异常', () => {
  installMocks();
  const ink = new InkRenderer(makeCanvas());
  const strokes = generateMotif(rngFromSeed(99), 'mountain', ink.W, ink.H);
  ink.setScene(strokes, 99, 0.6);
  ink.start();
  for (let i = 0; i < 30; i++) ink._loop();
  assert.ok(ink.strokes.length > 0);
});

test('渲染：落笔 / 换墨 / 净纸 / 落印 全路径', () => {
  installMocks();
  const ink = new InkRenderer(makeCanvas());
  ink.start();
  ink.beginBrush(100, 100);
  ink.extendBrush(120, 120);
  ink.extendBrush(150, 140);
  ink.endBrush();
  assert.ok(ink.strokes.length >= 1, '落笔应产生笔触');

  ink.setTone(0.2);
  assert.equal(ink.tone, 0.2);

  ink.stamp('韵');
  ink._loop();

  ink.clear();
  assert.equal(ink.strokes.length, 0);
});

test('渲染：粒子晕染随时间消散', () => {
  installMocks();
  const ink = new InkRenderer(makeCanvas());
  ink.start();
  ink.beginBrush(50, 50);
  ink.extendBrush(60, 60);
  ink.extendBrush(70, 55);
  ink.endBrush();
  const born = ink.particles.length;
  assert.ok(born > 0, '落笔应产生晕染粒子');
  for (let i = 0; i < 120; i++) ink._loop();
  assert.ok(ink.particles.length < born, '粒子应逐渐消散');
});
