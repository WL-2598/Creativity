/**
 * audio-engine.test.mjs — 音频引擎调度冒烟测试
 * 注入极简 fake AudioContext，让引擎完整构建总线图并运行
 * 真实调度器数秒，验证声部调度、演化、参数变更路径无运行时错误。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AudioEngine } from '../starlark/js/audio/engine.js';

/* ---------- fake AudioContext ---------- */
function param() {
  return {
    value: 0,
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    linearRampToValueAtTime() {},
    setTargetAtTime() {},
    cancelScheduledValues() {},
  };
}
function node(extra = {}) {
  return Object.assign({
    connect() {}, disconnect() {},
    gain: param(), frequency: param(), Q: param(),
    detune: param(), delayTime: param(),
    threshold: param(), knee: param(), ratio: param(),
    attack: param(), release: param(),
    type: '', buffer: null, curve: null, oversample: '',
    start() {}, stop() {},
  }, extra);
}

function makeFakeCtx() {
  let now = 0;
  const ctx = {
    sampleRate: 44100,
    state: 'running',
    destination: node(),
    get currentTime() { return now; },
    advance(seconds) { now += seconds; },
    resume() { return Promise.resolve(); },
    createGain: () => node(),
    createOscillator: () => node(),
    createBiquadFilter: () => node(),
    createConvolver: () => node(),
    createDelay: () => node(),
    createDynamicsCompressor: () => node(),
    createWaveShaper: () => node(),
    createAnalyser: () => node(),
    createBufferSource: () => node(),
    createBuffer(ch, len) {
      return { getChannelData: () => new Float32Array(len) };
    },
  };
  return ctx;
}

function installFakeWindow() {
  const instance = makeFakeCtx();
  globalThis.window = { AudioContext: function () { return instance; } };
  return instance;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 测试 ---------- */
test('引擎：从启动到多小节演化，调度路径无异常', async () => {
  const ctx = installFakeWindow();
  const engine = new AudioEngine();
  try {
    await engine.start(123456, 'stellar');
    assert.ok(engine.ctx, '应创建 AudioContext');
    assert.ok(engine.bus && engine.reverb && engine.delay && engine.master, '应构建完整总线');
    assert.ok(engine.playing, '启动后应进入播放态');
    assert.ok(engine.world, '应生成音乐世界');

    // 推进约 5 秒伪时间（跨越多个小节），同时让调度器真实运行
    const startBar = engine._bar;
    for (let i = 0; i < 20; i++) {
      ctx.advance(0.25);
      await sleep(30);
    }
    assert.ok(engine._bar > startBar, `应推进小节，从 ${startBar} 到 ${engine._bar}`);
    assert.ok(engine.analyser, '应暴露分析器供可视化');
  } finally {
    engine.stop();   // 无论成败都停掉调度器，避免定时器链滞留
  }
});

test('引擎：换种子 / 换音阶 / 参数调节', async () => {
  installFakeWindow();
  const engine = new AudioEngine();
  try {
    await engine.start(777, 'dawn');

    engine.reseed(424242);
    assert.equal(engine.world.seed, 424242, 'reseed 应更换种子');

    engine.setScale('dorian');
    assert.equal(engine.world.scaleKey, 'dorian');
    assert.ok(engine.world.progression.chords.length >= 4, '换音阶后和声应重建');

    engine.setParam('density', 0.8);
    assert.equal(engine.world.density, 0.8);
    engine.setParam('brightness', 0.9);
    assert.equal(engine.world.brightness, 0.9);
  } finally {
    engine.stop();
  }
});

test('引擎：暂停后重启保持世界', async () => {
  installFakeWindow();
  const engine = new AudioEngine();
  try {
    await engine.start(555, null);
    const seed = engine.world.seed;
    engine.stop();
    await engine.start();            // 不带种子重启
    assert.equal(engine.world.seed, seed, '无种子重启应延续当前世界');
    assert.ok(engine.playing);
  } finally {
    engine.stop();
  }
});

test('引擎：autoEvolve 关闭时演化不触发', async () => {
  const ctx = installFakeWindow();
  const engine = new AudioEngine();
  engine.autoEvolve = false;
  try {
    await engine.start(888, 'mist');
    const arpBefore = engine.world.evolution.arpRotate;
    for (let i = 0; i < 24; i++) {
      ctx.advance(0.25);
      await sleep(28);
    }
    assert.equal(engine.world.evolution.arpRotate, arpBefore, '关闭呼吸时不应轮转琶音');
  } finally {
    engine.stop();
  }
});
