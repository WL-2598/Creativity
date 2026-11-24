/**
 * main.js — 拓境控制台
 */
import { PrintRender } from './render.js';
import { generatePrint, PRINT_STYLES } from './print.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('paper');
const render = new PrintRender(canvas);

let seed = randomSeed();

function refresh() {
  const styleKey = $('style').value || null;
  const print = generatePrint(seed, { style: styleKey, plates: parseInt($('plates').value, 10) });
  render.setPrint(print);
  $('seed').value = seed;
  $('info').textContent =
    `版画「${print.styleLabel}」 · ${print.stats.plates} 版 · ${print.stats.layers} 层套印 · 总覆盖率 ${print.stats.coverage.toFixed(2)}`;
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
$('style').addEventListener('change', () => { seed = randomSeed(); refresh(); });
$('plates').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

// 风格按钮
const bar = $('stylebar');
for (const [key, S] of Object.entries(PRINT_STYLES)) {
  const b = document.createElement('button');
  b.textContent = S.label;
  b.addEventListener('click', () => { seed = randomSeed(); $('style').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
