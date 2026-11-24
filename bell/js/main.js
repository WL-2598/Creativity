/**
 * main.js — 钟磬控制台
 */
import { BellRender } from './render.js';
import { generateBells, BELL_SCALES } from './bell.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('bells');
const render = new BellRender(canvas);

let seed = randomSeed();

function refresh() {
  const set = generateBells(seed, {
    scale: $('scale').value || null,
    count: parseInt($('count').value, 10),
  });
  render.setSet(set);
  $('seed').value = seed;
  $('info').textContent =
    `编钟「${set.scaleLabel}」 · ${set.stats.bells} 钟 · 小曲 ${set.stats.beats} 拍 · 音域 ${set.stats.minFreq.toFixed(0)}–${set.stats.maxFreq.toFixed(0)} Hz`;
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
$('scale').addEventListener('change', () => { seed = randomSeed(); refresh(); });
$('count').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

// 调式按钮
const bar = $('scalebar');
for (const [key, S] of Object.entries(BELL_SCALES)) {
  const b = document.createElement('button');
  b.textContent = S.label;
  b.addEventListener('click', () => { seed = randomSeed(); $('scale').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
