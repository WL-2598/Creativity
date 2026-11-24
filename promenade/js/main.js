/**
 * main.js — 回廊控制台
 */
import { PromenadeRender } from './render.js';
import { generatePromenade, HALL_TONES } from './promenade.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('hall');
const render = new PromenadeRender(canvas);

let seed = randomSeed();

function refresh() {
  const toneKey = $('tone').value || null;
  const hall = generatePromenade(seed, {
    tone: toneKey,
    columns: parseInt($('columns').value, 10),
    arches: parseInt($('arches').value, 10),
  });
  render.setHall(hall);
  $('seed').value = seed;
  $('info').textContent =
    `长廊「${hall.toneLabel}」 · ${hall.stats.columns} 柱 · ${hall.stats.arches} 拱 · 灭点 (${(hall.vanish.x * 100).toFixed(0)}%, ${(hall.vanish.y * 100).toFixed(0)}%) · 光影 ${(hall.light.strength * 100).toFixed(0)}%`;
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
$('tone').addEventListener('change', () => { seed = randomSeed(); refresh(); });
$('columns').addEventListener('change', refresh);
$('arches').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

// 色调按钮
const bar = $('tonebar');
for (const [key, T] of Object.entries(HALL_TONES)) {
  const b = document.createElement('button');
  b.textContent = T.label;
  b.addEventListener('click', () => { seed = randomSeed(); $('tone').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
