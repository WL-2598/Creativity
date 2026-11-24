/**
 * main.js — 流光主控制器
 * 装配光带生成、辉光渲染与交互（种子、光色、执笔绘光）。
 */
import { LumenRender, PALETTES } from './render.js';
import { generateRibbons } from './lumen.js';
import { randomSeed } from '../../shared/rng.js';

const $ = id => document.getElementById(id);
const els = {
  stage: $('stage'),
  seedInput: $('seedInput'),
  relightBtn: $('relightBtn'),
  modeBtn: $('modeBtn'),
  clearBtn: $('clearBtn'),
  widthRange: $('widthRange'),
  widthVal: $('widthVal'),
  paletteSel: $('paletteSel'),
  toast: $('toast'),
};

const render = new LumenRender(els.stage);
render.start();

let brushMode = false;

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove('show'), 1500);
}

function relight() {
  const seed = parseInt(els.seedInput.value, 10) || 0;
  const ribbons = generateRibbons(seed, { count: 7, W: render.W, H: render.H });
  render.setRibbons(ribbons);
  toast(`已点亮 ${ribbons.length} 条流光`);
}

/* ---------- 执笔绘光 ---------- */
function setBrushMode(on) {
  brushMode = on;
  els.stage.classList.toggle('brush', on);
  els.modeBtn.textContent = on ? '收笔 · 观光' : '执笔绘光';
  els.modeBtn.classList.toggle('on', on);
  if (!on) render.endStroke();
}

function pos(e) {
  const rect = els.stage.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

els.stage.addEventListener('pointerdown', e => {
  if (!brushMode) return;
  const p = pos(e);
  render.beginStroke(p.x, p.y, +els.widthRange.value);
  els.stage.setPointerCapture(e.pointerId);
});
els.stage.addEventListener('pointermove', e => {
  if (!brushMode || !render._current) return;
  const p = pos(e);
  render.extendStroke(p.x, p.y);
});
els.stage.addEventListener('pointerup', () => render.endStroke());
els.stage.addEventListener('pointercancel', () => render.endStroke());

/* ---------- 控件 ---------- */
els.relightBtn.addEventListener('click', relight);
els.seedInput.addEventListener('keydown', e => { if (e.key === 'Enter') relight(); });
els.modeBtn.addEventListener('click', () => setBrushMode(!brushMode));
els.clearBtn.addEventListener('click', () => {
  render.clearStrokes();
  toast('光迹已净');
});

els.widthRange.addEventListener('input', () => {
  els.widthVal.textContent = els.widthRange.value;
  els.widthRange.style.setProperty('--fill', `${((+els.widthRange.value - 1) / 9) * 100}%`);
});

els.paletteSel.addEventListener('change', () => render.setPalette(els.paletteSel.value));

window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); els.modeBtn.click(); }
  else if (e.key === 'r' || e.key === 'R') relight();
});

/* ---------- 装配 ---------- */
for (const key of Object.keys(PALETTES)) {
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = { aurora: '极光', ember: '余烬', ocean: '深海', sakura: '绯樱' }[key];
  els.paletteSel.appendChild(opt);
}
els.paletteSel.value = 'aurora';
els.widthRange.value = 4;
els.widthVal.textContent = '4';
els.widthRange.style.setProperty('--fill', '33%');

els.seedInput.value = String(randomSeed());
relight();
