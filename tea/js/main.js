/**
 * main.js — 茶境控制台
 */
import { TeaRender } from './render.js';
import { generateTeaSet, CLOTH_COLORS } from './tea.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('seat');
const render = new TeaRender(canvas);

let seed = randomSeed();

function refresh() {
  const set = generateTeaSet(seed, {
    guests: parseInt($('guests').value, 10),
    cloth: $('cloth').value || null,
  });
  render.setSet(set);
  $('seed').value = seed;
  $('info').textContent =
    `茶席「${set.clothLabel}」 · ${set.glazeLabel} · ${set.stats.guests} 客盏 · 器物 ${set.stats.vessels} · 茶点 ${set.stats.sweets}`;
}

function randomize() {
  seed = randomSeed();
  refresh();
}

$('random').addEventListener('click', randomize);
$('seed').addEventListener('change', () => {
  seed = (parseInt($('seed').value, 10) >>> 0) || 1;
  refresh();
});
$('cloth').addEventListener('change', () => { seed = randomSeed(); refresh(); });
$('guests').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

// 席布按钮
const bar = $('clothbar');
for (const [key, C] of Object.entries(CLOTH_COLORS)) {
  const b = document.createElement('button');
  b.textContent = C.label;
  b.addEventListener('click', () => { seed = randomSeed(); $('cloth').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
