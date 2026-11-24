/**
 * main.js — 晕境控制台
 */
import { HaloRender } from './render.js';
import { generateHalo, HALO_SCENES } from './halo.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('sky');
const render = new HaloRender(canvas);

let seed = randomSeed();

function refresh() {
  const sceneKey = $('scene').value || null;
  const scene = generateHalo(seed, {
    scene: sceneKey,
    drops: parseInt($('drops').value, 10),
    rays: parseInt($('rays').value, 10),
  });
  render.setScene(scene);
  $('seed').value = seed;
  $('info').textContent =
    `天象「${scene.sceneLabel}」 · ${scene.stats.rings} 环带 · ${scene.stats.rays} 星芒 · ${scene.stats.drops} 雾滴 · ${scene.stats.hasRainbow ? '含双虹' : '无虹'}`;
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
$('scene').addEventListener('change', () => { seed = randomSeed(); refresh(); });
$('drops').addEventListener('change', refresh);
$('rays').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

// 场景按钮
const bar = $('scenebar');
for (const [key, S] of Object.entries(HALO_SCENES)) {
  const b = document.createElement('button');
  b.textContent = S.label;
  b.addEventListener('click', () => { seed = randomSeed(); $('scene').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
