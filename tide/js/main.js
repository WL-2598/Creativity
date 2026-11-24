/**
 * main.js — 潮汐控制台
 */
import { TideRender } from './render.js';
import { generateTide, TIDE_SEASONS } from './tide.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('sea');
const render = new TideRender(canvas);

let seed = randomSeed();

function refresh() {
  const seasonKey = $('season').value || null;
  const tide = generateTide(seed, {
    season: seasonKey,
    hours: parseInt($('hours').value, 10),
  });
  render.setTide(tide);
  $('seed').value = seed;
  $('info').textContent =
    `潮汐「${tide.seasonLabel}」 · 月相 ${(tide.phase * 100).toFixed(0)}% · 潮差 ${tide.stats.range.toFixed(2)} · 采样 ${tide.stats.samples} 点 · 浪高 ${tide.waves.amp.toFixed(1)}`;
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
$('season').addEventListener('change', () => { seed = randomSeed(); refresh(); });
$('hours').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

// 季节按钮
const bar = $('seasonbar');
for (const [key, S] of Object.entries(TIDE_SEASONS)) {
  const b = document.createElement('button');
  b.textContent = S.label;
  b.addEventListener('click', () => { seed = randomSeed(); $('season').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
