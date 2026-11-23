/**
 * main.js — 晶境主控制器
 * 装配晶体生长、渲染与交互（种子、矿种、重播）。
 */
import { CrystalRender, MINERAL_PALETTES, crystalStats } from './render.js';
import { growCrystals } from './crystal.js';
import { randomSeed } from '../../shared/rng.js';

const $ = id => document.getElementById(id);
const els = {
  stage: $('stage'),
  seedInput: $('seedInput'),
  regrowBtn: $('regrowBtn'),
  paletteSel: $('paletteSel'),
  statCover: $('statCover'),
  statCluster: $('statCluster'),
  toast: $('toast'),
};

const render = new CrystalRender(els.stage);
render.start();

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove('show'), 1500);
}

function regrow() {
  const seed = parseInt(els.seedInput.value, 10) || 0;
  // 网格分辨率随画布自适应，晶面大小恒定
  const gw = Math.max(40, Math.floor(render.W / 6));
  const gh = Math.max(28, Math.floor(render.H / 6));
  const result = growCrystals(seed, { width: gw, height: gh, seeds: 4, steps: 80 });
  render.setScene(result);
  const s = crystalStats(result);
  els.statCover.textContent = (s.coverage * 100).toFixed(1) + '%';
  els.statCluster.textContent = s.clusterCount;
  toast(`已结晶 ${s.grown} 格 · ${s.clusterCount} 簇`);
}

els.regrowBtn.addEventListener('click', regrow);
els.seedInput.addEventListener('keydown', e => { if (e.key === 'Enter') regrow(); });
els.paletteSel.addEventListener('change', () => render.setPalette(els.paletteSel.value));

window.addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') regrow();
});

/* ---------- 装配 ---------- */
for (const key of Object.keys(MINERAL_PALETTES)) {
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = MINERAL_PALETTES[key].name;
  els.paletteSel.appendChild(opt);
}
els.paletteSel.value = 'amethyst';
els.seedInput.value = String(randomSeed());
regrow();
