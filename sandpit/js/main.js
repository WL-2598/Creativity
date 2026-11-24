/**
 * main.js — 沙盘控制台
 */
import { SandRender } from './render.js';
import { generateSandscape } from './sand.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('pit');
const render = new SandRender(canvas);

let seed = randomSeed();

function refresh() {
  const state = generateSandscape(seed, {
    width: parseInt($('width').value, 10),
    height: parseInt($('height').value, 10),
  });
  render.setState(state);
  $('seed').value = seed;
  $('info').textContent =
    `沙境 · ${state.width}×${state.height} 格 · 沙量 ${state.stats.sand} · 峰高 ${state.stats.peak} · 谷深 ${state.stats.valley} · 沙源列 ${state.source}`;
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
$('width').addEventListener('change', refresh);
$('height').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

refresh();
render.start();
