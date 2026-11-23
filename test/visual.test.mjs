/**
 * visual.test.mjs — 视觉引擎渲染冒烟测试
 * 用 mock 画布驱动四种模式各渲染若干帧，捕获运行时错误。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VisualEngine } from '../starlark/js/visual/renderer.js';
import { createWorld } from '../starlark/js/audio/composition.js';

/* ---------- mock 环境 ---------- */
function makeMockCtx() {
  const gradient = { addColorStop() {} };
  const ctx = {
    calls: 0,
    setTransform() {}, fillRect() { this.calls++; },
    fillStyle: '', strokeStyle: '', globalCompositeOperation: '',
    globalAlpha: 1, lineWidth: 1,
    beginPath() {}, arc() {}, fill() { this.calls++; },
    stroke() { this.calls++; }, moveTo() {}, lineTo() {},
    createRadialGradient() { return gradient; },
    createLinearGradient() { return gradient; },
  };
  return ctx;
}

function installMocks() {
  globalThis.window = { addEventListener() {} };
  globalThis.performance = globalThis.performance || { now: () => Date.now() };
  globalThis.requestAnimationFrame = () => 0; // 单帧渲染，不递归
}

function makeCanvas(ctx) {
  return {
    clientWidth: 800,
    clientHeight: 600,
    getContext: () => ctx,
  };
}

/* ---------- 测试 ---------- */
test('视觉引擎：四种模式各渲染多帧无异常', async () => {
  installMocks();
  const world = createWorld(987654, 'stellar');
  for (const modeKey of ['nebula', 'ripples', 'mandala', 'trails']) {
    const ctx = makeMockCtx();
    const engine = new VisualEngine(makeCanvas(ctx));
    engine.setMode(modeKey);
    engine.setWorld(world);
    engine.start();   // running = true，允许手动驱动帧

    // 驱动 60 帧，模拟真实频率数据（全零 + 一段脉冲）
    for (let i = 0; i < 60; i++) {
      engine.updateAudio({ getByteFrequencyData: arr => arr.fill(i % 40 === 0 ? 255 : 20) });
      engine._loop();
    }
    assert.ok(ctx.calls > 100, `${modeKey} 模式应产生大量绘制调用，实际 ${ctx.calls}`);
  }
});

test('视觉引擎：换种子/模式/调色板后状态重建正常', () => {
  installMocks();
  const engine = new VisualEngine(makeCanvas(makeMockCtx()));
  engine.setMode('ripples');
  engine.setWorld(createWorld(111));
  engine.start();
  engine._loop();
  engine.setWorld(createWorld(222));
  engine._loop();
  assert.ok(true); // 未抛异常即通过
});

test('视觉引擎：无 world 时渲染循环安全空转', () => {
  installMocks();
  const engine = new VisualEngine(makeCanvas(makeMockCtx()));
  engine.start();
  engine._loop();
  assert.ok(true);
});
