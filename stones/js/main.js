/**
 * main.js — 石阵控制台
 */
import { StonesRender } from './render.js';
import { generateStoneField, STONE_ERAS, shadowOf } from './stones.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('field');
const render = new StonesRender(canvas);

let seed = randomSeed();

function refresh() {
  const eraKey = $('era').value || null;
  const field = generateStoneField(seed, {
    era: eraKey,
    count: parseInt($('count').value, 10),
  });
  render.setField(field);
  $('seed').value = seed;
  const sample = field.stones[0];
  const sh = sample ? shadowOf(sample, field.sun.az0, field.sun.elev) : { len: 0 };
  $('info').textContent =
    `石阵「${field.eraLabel}」 · ${field.stats.stones} 柱 · 日轨 ${(field.sun.az1 - field.sun.az0).toFixed(2)} rad · 首柱影长 ${sh.len.toFixed(2)}`;
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
$('era').addEventListener('change', () => { seed = randomSeed(); refresh(); });
$('count').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

// 时辰按钮
const bar = $('erabar');
for (const [key, E] of Object.entries(STONE_ERAS)) {
  const b = document.createElement('button');
  b.textContent = E.label;
  b.addEventListener('click', () => { seed = randomSeed(); $('era').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
