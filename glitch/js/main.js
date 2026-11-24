/**
 * main.js — 光斑控制台
 */
import { GlitchRender } from './render.js';
import { generateGlitch, GLITCH_SCENES } from './glitch.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('frame');
const render = new GlitchRender(canvas);

let seed = randomSeed();

function refresh() {
  const sceneKey = $('scene').value || null;
  const glitch = generateGlitch(seed, {
    scene: sceneKey,
    bands: parseInt($('bands').value, 10),
    scanlines: parseInt($('scanlines').value, 10),
  });
  render.setGlitch(glitch);
  $('seed').value = seed;
  $('info').textContent =
    `光斑「${glitch.sceneLabel}」 · 位移带 ${glitch.stats.bands} · 扫描线 ${glitch.stats.scanlines} · 数据块 ${glitch.stats.blocks} · 色散 ${(glitch.stats.chroma * 1000).toFixed(1)}`;
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
$('bands').addEventListener('change', refresh);
$('scanlines').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

// 场景按钮
const bar = $('scenebar');
for (const [key, S] of Object.entries(GLITCH_SCENES)) {
  const b = document.createElement('button');
  b.textContent = S.label;
  b.addEventListener('click', () => { seed = randomSeed(); $('scene').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
