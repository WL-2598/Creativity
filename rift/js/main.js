/**
 * main.js — 裂隙主控制器
 * 装配地形生成、地图渲染与交互（种子、风格）。
 */
import { RiftRender } from './render.js';
import { generateTerrain, findRivers } from './terrain.js';
import { randomSeed } from '../../shared/rng.js';

const $ = id => document.getElementById(id);
const els = {
  stage: $('stage'),
  seedInput: $('seedInput'),
  chartBtn: $('chartBtn'),
  styleSel: $('styleSel'),
  toast: $('toast'),
};

const render = new RiftRender(els.stage);
render.start();

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove('show'), 1500);
}

function chart() {
  const seed = parseInt(els.seedInput.value, 10) || 0;
  const terrain = generateTerrain(seed);
  const rivers = findRivers(terrain, 4);
  render.setTerrain(terrain, rivers);
  toast(`山河已成 · 高程 ${terrain.width}×${terrain.height}`);
}

els.chartBtn.addEventListener('click', chart);
els.seedInput.addEventListener('keydown', e => { if (e.key === 'Enter') chart(); });
els.styleSel.addEventListener('change', () => render.setStyle(els.styleSel.value));

window.addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') chart();
});

/* ---------- 装配 ---------- */
for (const [key, label] of [['ink', '墨线'], ['color', '彩图'], ['night', '夜图']]) {
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = label;
  els.styleSel.appendChild(opt);
}
els.styleSel.value = 'ink';
els.seedInput.value = String(randomSeed());
chart();
