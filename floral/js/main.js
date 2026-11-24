/**
 * main.js — 花相控制台
 */
import { FloralRender } from './render.js';
import { generateFloral, VESSELS } from './floral.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('scene');
const render = new FloralRender(canvas);

let seed = randomSeed();

function refresh() {
  const arrangement = generateFloral(seed, {
    vessel: $('vessel').value || null,
    materials: parseInt($('materials').value, 10),
  });
  render.setArrangement(arrangement);
  $('seed').value = seed;
  $('info').textContent =
    `花相「${arrangement.materials.join('、')}」 · ${arrangement.vesselLabel} · ${arrangement.stats.stems} 主枝 · ${arrangement.stats.fillers} 辅枝 · ${arrangement.stats.flowers} 朵`;
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
$('vessel').addEventListener('change', () => { seed = randomSeed(); refresh(); });
$('materials').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

// 花器按钮
const bar = $('vesselbar');
for (const [key, V] of Object.entries(VESSELS)) {
  const b = document.createElement('button');
  b.textContent = V.label;
  b.addEventListener('click', () => { seed = randomSeed(); $('vessel').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
