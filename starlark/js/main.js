/**
 * main.js — 星澜 STELLAR ECHO 主控制器
 * 装配音频引擎、视觉引擎、录音器与全部交互。
 */
import { AudioEngine } from './audio/engine.js';
import { VisualEngine } from './visual/renderer.js';
import { PALETTES } from './visual/palettes.js';
import { SCALES, MOOD_PRESETS, randomSeed, createWorld, clamp } from './audio/composition.js';
import { Recorder } from './audio/recorder.js';

/* ---------------- DOM ---------------- */
const $ = id => document.getElementById(id);
const els = {
  stage: $('stage'),
  gate: $('gate'),
  gateBtn: $('gateBtn'),
  playBtn: $('playBtn'),
  randomBtn: $('randomBtn'),
  evolveBtn: $('evolveBtn'),
  seedInput: $('seedInput'),
  applySeed: $('applySeed'),
  copySeed: $('copySeed'),
  presetRow: $('presetRow'),
  selScale: $('selScale'),
  selMode: $('selMode'),
  selPalette: $('selPalette'),
  recordBtn: $('recordBtn'),
  recInfo: $('recInfo'),
};

/* ---------------- 引擎 ---------------- */
const audio = new AudioEngine();
const visual = new VisualEngine(els.stage);
let recorder = null;
let recTimer = null;
let currentMood = null;

// 初始世界：门后面先有一个活着的宇宙
let initialSeed = randomSeed();
let world = createWorld(initialSeed);
visual.setWorld(world);
visual.setMode('nebula');
visual.setPalette('stellar');
visual.start();

/* ---------------- 工具 ---------------- */
const fmt = v => v.toFixed(2);

function setSliderFill(input) {
  const min = +input.min, max = +input.max;
  const fill = ((+input.value - min) / (max - min)) * 100;
  input.style.setProperty('--fill', `${fill}%`);
}

function syncSlidersFromWorld(w) {
  const map = {
    sTempo: [w.tempo, 1, 120],
    sDensity: [w.density, 0.1, 1],
    sBrightness: [w.brightness, 0.2, 0.95],
    sMotion: [w.motion, 0.1, 1],
    sReverb: [w.reverb, 0, 1],
    sDelay: [w.delay, 0, 0.85],
    sCutoff: [w.cutoff, 0.3, 0.95],
    sVolume: [audio.level, 0, 1],
  };
  for (const [id, [val, min, max]] of Object.entries(map)) {
    const input = $(id);
    input.value = clamp(val, min, max);
    setSliderFill(input);
    $(`v${id.slice(1)}`).textContent = fmt(val);
  }
}

function applyWorldToUI(w) {
  els.seedInput.value = String(w.seed);
  els.selScale.value = w.scaleKey;
  syncSlidersFromWorld(w);
}

/* ---------------- 预设 ---------------- */
function buildPresets() {
  for (const key of Object.keys(MOOD_PRESETS)) {
    const p = MOOD_PRESETS[key];
    const btn = document.createElement('button');
    btn.textContent = p.label;
    btn.dataset.mood = key;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-row button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMood = key;
      // 以同一颗种子 + 新心境重建世界
      startWorld(world.seed, key);
    });
    els.presetRow.appendChild(btn);
  }
}

/* ---------------- 音阶 / 视觉选择 ---------------- */
function buildSelects() {
  for (const key of Object.keys(SCALES)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = `${SCALES[key].name}`;
    els.selScale.appendChild(opt);
  }
  for (const key of Object.keys(PALETTES)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = PALETTES[key].label;
    els.selPalette.appendChild(opt);
  }
}

els.selScale.addEventListener('change', () => audio.setScale(els.selScale.value));
els.selMode.addEventListener('change', () => visual.setMode(els.selMode.value));
els.selPalette.addEventListener('change', () => visual.setPalette(els.selPalette.value));

/* ---------------- 传输控制 ---------------- */
function startWorld(seed, mood) {
  audio.start(seed, mood).then(() => {
    world = audio.world;
    visual.setWorld(world);
    applyWorldToUI(world);
  });
}

function togglePlay() {
  const playing = audio.toggle();
  els.playBtn.textContent = playing ? '❚❚ 静默' : '▶ 奏响';
  els.playBtn.classList.toggle('playing', playing);
}

els.playBtn.addEventListener('click', () => {
  if (!audio.ctx) {
    // 首次奏响：从门后的世界开始（audio.start 完成即进入播放态）
    startWorld(world.seed, currentMood).then(() => {
      els.playBtn.textContent = '❚❚ 静默';
      els.playBtn.classList.add('playing');
    });
  } else {
    togglePlay();
  }
});

els.randomBtn.addEventListener('click', () => {
  const seed = randomSeed();
  startWorld(seed, currentMood);
});

els.evolveBtn.addEventListener('click', () => {
  audio.autoEvolve = !audio.autoEvolve;
  els.evolveBtn.classList.toggle('on', audio.autoEvolve);
  els.evolveBtn.textContent = `呼吸 · ${audio.autoEvolve ? '开' : '关'}`;
});

els.applySeed.addEventListener('click', () => {
  const v = parseInt(els.seedInput.value, 10);
  if (Number.isFinite(v)) startWorld(clamp(v >>> 0, 0, 0xFFFFFFFF), currentMood);
});

els.seedInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') els.applySeed.click();
});

els.copySeed.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(String(world.seed));
    els.copySeed.textContent = '✓';
    setTimeout(() => (els.copySeed.textContent = '⧉'), 1400);
  } catch { /* 剪贴板不可用时忽略 */ }
});

/* ---------------- 滑块 ---------------- */
const sliderMap = {
  sTempo: ['tempo', 1], sDensity: ['density', 2], sBrightness: ['brightness', 2],
  sMotion: ['motion', 2], sReverb: ['reverb', 2], sDelay: ['delay', 2],
  sCutoff: ['cutoff', 2], sVolume: [null, 2],
};
for (const [id, [param, dp]] of Object.entries(sliderMap)) {
  const input = $(id);
  input.addEventListener('input', () => {
    const val = +input.value;
    setSliderFill(input);
    $(`v${id.slice(1)}`).textContent = fmt(val);
    if (param) audio.setParam(param, val);
    else audio.level = val;
  });
}

/* ---------------- 录音 ---------------- */
async function toggleRecord() {
  if (!audio.ctx) return;
  if (!recorder) recorder = new Recorder(audio.ctx, audio.master.shaper);

  if (!recorder.recording) {
    els.recordBtn.textContent = '● 停止并保存';
    els.recordBtn.classList.add('recording');
    recorder.start();
    const t0 = Date.now();
    recTimer = setInterval(() => {
      const s = Math.floor((Date.now() - t0) / 1000);
      els.recInfo.textContent = `录音中 ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }, 500);
  } else {
    els.recordBtn.classList.remove('recording');
    clearInterval(recTimer);
    els.recInfo.textContent = '正在编织留痕…';
    const result = await recorder.stop();
    els.recordBtn.textContent = '○ 开始录音';
    if (result && result.wav) {
      const url = URL.createObjectURL(result.wav);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stellar-echo-${world.seed}-${Date.now()}.wav`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      els.recInfo.textContent = `已保存 ${result.duration.toFixed(1)} 秒 WAV`;
    } else {
      els.recInfo.textContent = '未录制';
    }
  }
}
els.recordBtn.addEventListener('click', toggleRecord);

/* ---------------- 键盘 ---------------- */
window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); els.playBtn.click(); }
  else if (e.key === 'r' || e.key === 'R') els.randomBtn.click();
  else if (e.key === 'e' || e.key === 'E') els.evolveBtn.click();
});

/* ---------------- 启动门 ---------------- */
els.gateBtn.addEventListener('click', async () => {
  els.gate.classList.add('hidden');
  if (!audio.ctx) {
    startWorld(world.seed, currentMood);
    els.playBtn.textContent = '❚❚ 静默';
    els.playBtn.classList.add('playing');
  }
  // 渲染循环里的视觉始终运行；音频引擎由用户手势唤醒
  const tick = () => {
    if (audio.ctx) visual.updateAudio(audio.analyser);
    requestAnimationFrame(tick);
  };
  tick();
});

/* ---------------- 装配 ---------------- */
buildSelects();
buildPresets();
applyWorldToUI(world);
