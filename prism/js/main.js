/**
 * main.js — 棱镜主控制器
 * 装配几何生成、渲染与交互（种子、对称、深度、色板、旋转）。
 */
import { PrismRender, PALETTES } from './render.js';
import { generateGeometry } from './geometry.js';
import { randomSeed } from '../../shared/rng.js';

const $ = id => document.getElementById(id);
const els = {
  stage: $('stage'),
  seedInput: $('seedInput'),
  forgeBtn: $('forgeBtn'),
  symRange: $('symRange'),
  symVal: $('symVal'),
  depthRange: $('depthRange'),
  depthVal: $('depthVal'),
  speedRange: $('speedRange'),
  speedVal: $('speedVal'),
  paletteSel: $('paletteSel'),
  toast: $('toast'),
};

const render = new PrismRender(els.stage);
render.start();

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove('show'), 1500);
}

function forge() {
  const seed = parseInt(els.seedInput.value, 10) || 0;
  const { elements } = generateGeometry(seed, {
    symmetry: +els.symRange.value,
    depth: +els.depthRange.value,
  });
  render.setScene(elements);
  toast(`已铸就 ${elements.length} 笔几何`);
}

/* ---------- 控件 ---------- */
els.forgeBtn.addEventListener('click', forge);
els.seedInput.addEventListener('keydown', e => { if (e.key === 'Enter') forge(); });

for (const [range, valEl] of [[els.symRange, els.symVal], [els.depthRange, els.depthVal], [els.speedRange, els.speedVal]]) {
  range.addEventListener('input', () => {
    valEl.textContent = range.value;
    const fill = ((+range.value - +range.min) / (+range.max - +range.min)) * 100;
    range.style.setProperty('--fill', `${fill}%`);
    if (range === els.speedRange) render.setRotateSpeed(+range.value / 20);
  });
}

els.paletteSel.addEventListener('change', () => {
  render.setPalette(els.paletteSel.value);
});

window.addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') forge();
});

/* ---------- 装配 ---------- */
for (const key of Object.keys(PALETTES)) {
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = { aurora: '极光', ocean: '深海', ember: '余烬', ink: '水墨' }[key];
  els.paletteSel.appendChild(opt);
}
els.paletteSel.value = 'aurora';
els.symRange.value = 6; els.symVal.textContent = '6';
els.depthRange.value = 3; els.depthVal.textContent = '3';
els.speedRange.value = 1; els.speedVal.textContent = '1';
els.symRange.style.setProperty('--fill', '40%');
els.depthRange.style.setProperty('--fill', '40%');
els.speedRange.style.setProperty('--fill', '17%');
render.setRotateSpeed(0.05);

els.seedInput.value = String(randomSeed());
forge();
