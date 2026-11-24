/**
 * main.js — 纸境控制台
 */
import { OrigamiRender } from './render.js';
import { generateOrigami, FOLD_STYLES, FAMILY_LABELS } from './origami.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('paper');
const render = new OrigamiRender(canvas);

let seed = randomSeed();

function refresh() {
  const fold = generateOrigami(seed, {
    grid: parseInt($('grid').value, 10),
    style: $('style').value || null,
    families: $('families').value,
  });
  render.setFold(fold);
  $('seed').value = seed;
  $('info').textContent =
    `折纸「${fold.styleLabel}」 · ${fold.grid}×${fold.grid} 格 · 折痕 ${fold.stats.folds} · 马氏顶点 ${fold.stats.maekawaVertices}/${fold.stats.maekawaTotal} 全满足`;
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
$('grid').addEventListener('change', refresh);
$('style').addEventListener('change', () => { seed = randomSeed(); refresh(); });
$('families').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

// 风格按钮
const bar = $('stylebar');
for (const [key, S] of Object.entries(FOLD_STYLES)) {
  const b = document.createElement('button');
  b.textContent = S.label;
  b.addEventListener('click', () => { seed = randomSeed(); $('style').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
