/**
 * main.js — 形境主控制器
 * 装配 L-系统植物生成、渲染与交互（种子、类型、色系、风）。
 */
import { PlantRender, PALETTES } from './render.js';
import { generatePlant, PLANT_TYPES, PLANT_LABELS } from './lsystem.js';
import { randomSeed } from '../../shared/rng.js';

const $ = id => document.getElementById(id);
const els = {
  stage: $('stage'),
  seedInput: $('seedInput'),
  plantBtn: $('plantBtn'),
  typeSel: $('typeSel'),
  paletteSel: $('paletteSel'),
  windRange: $('windRange'),
  windVal: $('windVal'),
  toast: $('toast'),
};

const render = new PlantRender(els.stage);
render.start();

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove('show'), 1500);
}

function regrow() {
  const seed = parseInt(els.seedInput.value, 10) || 0;
  const plant = generatePlant(seed, els.typeSel.value, 4);
  render.setPlant(plant);
  toast(`已栽下一株${PLANT_LABELS[plant.type]} · ${plant.segments.length} 笔`);
}

els.plantBtn.addEventListener('click', regrow);
els.seedInput.addEventListener('keydown', e => { if (e.key === 'Enter') regrow(); });
els.typeSel.addEventListener('change', regrow);
els.paletteSel.addEventListener('change', () => render.setPalette(els.paletteSel.value));

els.windRange.addEventListener('input', () => {
  els.windVal.textContent = els.windRange.value;
  els.windRange.style.setProperty('--fill', `${((+els.windRange.value - 0) / 1) * 100}%`);
  render.setWind(+els.windRange.value);
});

window.addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') regrow();
});

/* ---------- 装配 ---------- */
for (const key of PLANT_TYPES) {
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = PLANT_LABELS[key];
  els.typeSel.appendChild(opt);
}
for (const key of Object.keys(PALETTES)) {
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = PALETTES[key].name;
  els.paletteSel.appendChild(opt);
}
els.typeSel.value = 'tree';
els.paletteSel.value = 'forest';
els.windRange.value = 0.5;
els.windVal.textContent = '0.5';
els.windRange.style.setProperty('--fill', '50%');
render.setWind(0.5);

els.seedInput.value = String(randomSeed());
regrow();
