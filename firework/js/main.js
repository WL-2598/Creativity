/**
 * main.js — 焰火控制台
 */
import { FireworkRender } from './render.js';
import { generateFireworks, FIREWORK_TONES } from './firework.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('sky');
const render = new FireworkRender(canvas);

let seed = randomSeed();

function refresh() {
  const toneKey = $('tone').value || null;
  const show = generateFireworks(seed, {
    tone: toneKey,
    count: parseInt($('count').value, 10),
  });
  render.setShow(show);
  $('seed').value = seed;
  $('info').textContent =
    `焰火「${show.toneLabel}」 · ${show.stats.count} 枚 · 粒子 ${show.stats.particles} · 二次爆裂 ${show.stats.withSecondary} 枚 · 总时长 ${show.stats.maxDelay.toFixed(1)}s`;
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
$('count').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

// 色调按钮
const bar = $('tonebar');
for (const [key, T] of Object.entries(FIREWORK_TONES)) {
  const b = document.createElement('button');
  b.textContent = T.label;
  b.addEventListener('click', () => { seed = randomSeed(); $('tone').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
