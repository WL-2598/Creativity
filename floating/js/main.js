/**
 * main.js — 浮生主控制器
 * 装配生态模拟、瓶体渲染与交互（光照、扰动、换种）。
 */
import { EcoRender } from './render.js';
import { createEcosystem, stepEcosystem, bindRng } from './ecology.js';
import { randomSeed } from '../../shared/rng.js';

const $ = id => document.getElementById(id);
const els = {
  stage: $('stage'),
  seedInput: $('seedInput'),
  unrollBtn: $('unrollBtn'),
  lightRange: $('lightRange'),
  lightVal: $('lightVal'),
  statFish: $('statFish'),
  statPlankton: $('statPlankton'),
  statPlant: $('statPlant'),
  toast: $('toast'),
};

const render = new EcoRender(els.stage);
let state = null;
let perturb = null;

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove('show'), 1500);
}

function unroll(seed) {
  state = bindRng(createEcosystem(seed, { fish: 4, plankton: 42, plant: 6 }), seed);
  render.setState(state);
  els.seedInput.value = String(seed);
  toast('生态瓶已开启');
}

/* ---------- 模拟循环 ---------- */
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state) {
    const params = { light: +els.lightRange.value, perturb };
    const stats = stepEcosystem(state, params, dt);
    perturb = null;
    els.statFish.textContent = stats.fish;
    els.statPlankton.textContent = stats.plankton;
    els.statPlant.textContent = stats.plant;
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ---------- 交互 ---------- */
els.unrollBtn.addEventListener('click', () => {
  unroll(parseInt(els.seedInput.value, 10) || randomSeed());
});
els.seedInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') els.unrollBtn.click();
});

els.lightRange.addEventListener('input', () => {
  els.lightVal.textContent = (+els.lightRange.value).toFixed(2);
});

// 拖动扰动水流
function pointerPos(e) {
  const rect = els.stage.getBoundingClientRect();
  const jar = { x: (rect.width - Math.min(rect.width * 0.5, 420)) / 2, y: 0 };
  const x = (e.clientX - rect.left - jar.x) / Math.min(rect.width * 0.5, 420);
  const y = (e.clientY - rect.top) / rect.height;
  return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
}
els.stage.addEventListener('pointerdown', e => {
  if (!state) return;
  const p = pointerPos(e);
  perturb = { x: p.x, y: p.y, strength: 0.02 };
  els.stage.setPointerCapture(e.pointerId);
});
els.stage.addEventListener('pointermove', e => {
  if (!perturb) return;
  const p = pointerPos(e);
  perturb = { x: p.x, y: p.y, strength: 0.02 };
});
els.stage.addEventListener('pointerup', () => { perturb = null; });

window.addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') els.unrollBtn.click();
});

/* ---------- 装配 ---------- */
els.lightRange.value = 0.6;
els.lightVal.textContent = '0.60';
unroll(randomSeed());
render.start();
