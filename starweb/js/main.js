/**
 * main.js — 织星控制台
 */
import { StarRender } from './render.js';
import { generateStarfield } from './constellation.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('sky');
const render = new StarRender(canvas);

let seed = randomSeed();

function refresh() {
  const field = generateStarfield(seed, {
    stars: parseInt($('stars').value, 10),
    link: parseInt($('link').value, 10),
  });
  render.setField(field);
  $('seed').value = seed;
  $('info').textContent =
    `星网「${field.name}」 · ${field.stats.stars} 星 · ${field.stats.edges} 连线 · 均等 ${field.stats.avgBrightness.toFixed(2)} · ${field.stats.connected ? '全域连通' : '未连通'}`;
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
$('stars').addEventListener('change', refresh);
$('link').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

refresh();
render.start();
