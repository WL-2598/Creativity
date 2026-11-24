/**
 * main.js — 影戏控制台
 */
import { ShadowRender } from './render.js';
import { generatePuppets, SHADOW_TONES } from './shadow.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('screen');
const render = new ShadowRender(canvas);

let seed = randomSeed();

function refresh() {
  const set = generatePuppets(seed, {
    count: parseInt($('count').value, 10),
    tone: $('tone').value || null,
  });
  render.setSet(set);
  $('seed').value = seed;
  $('info').textContent =
    `影戏「${set.toneLabel}」 · ${set.stats.puppets} 影 · 关节 ${set.stats.joints} · 灯火巡行，影随光长`;
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

// 灯调按钮
const bar = $('tonebar');
for (const [key, T] of Object.entries(SHADOW_TONES)) {
  const b = document.createElement('button');
  b.textContent = T.label;
  b.addEventListener('click', () => { seed = randomSeed(); $('tone').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
