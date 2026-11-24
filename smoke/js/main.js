/**
 * main.js — 烟境控制台
 */
import { SmokeRender } from './render.js';
import { generateSmoke, SMOKE_TONES } from './smoke.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('scene');
const render = new SmokeRender(canvas);

let seed = randomSeed();

function refresh() {
  const toneKey = $('tone').value || null;
  const scene = generateSmoke(seed, {
    tone: toneKey,
    sources: parseInt($('sources').value, 10),
    field: parseInt($('field').value, 10),
  });
  render.setScene(scene);
  $('seed').value = seed;
  $('info').textContent =
    `烟境「${scene.toneLabel}」 · ${scene.stats.sources} 烟源 · 流场 ${scene.fieldRes}×${scene.fieldRes} · 粒子无上限持续升腾`;
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
$('sources').addEventListener('change', refresh);
$('field').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

// 色调按钮
const bar = $('tonebar');
for (const [key, T] of Object.entries(SMOKE_TONES)) {
  const b = document.createElement('button');
  b.textContent = T.label;
  b.addEventListener('click', () => { seed = randomSeed(); $('tone').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
