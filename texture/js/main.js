/**
 * main.js — 织理控制台
 */
import { TextureRender } from './render.js';
import { generatePattern, PATTERN_KINDS } from './pattern.js';

const $ = (id) => document.getElementById(id);
const canvas = $('canvas');
const render = new TextureRender(canvas);

let seed = (Math.random() * 0xffffffff) >>> 0;

function refresh() {
  const kind = $('kind').value || null;
  const pattern = generatePattern(seed, { kind });
  render.setPattern(pattern);
  $('seed').value = seed;
  $('info').textContent =
    `图案「${pattern.kindLabel}」 · ${pattern.stats ? Object.entries(pattern.stats).map(([k, v]) => `${k} ${v}`).join(' · ') : ''}`;
}

function randomize() {
  seed = (Math.random() * 0xffffffff) >>> 0;
  refresh();
}

$('random').addEventListener('click', randomize);
$('seed').addEventListener('change', () => {
  seed = (parseInt($('seed').value, 10) >>> 0) || 1;
  refresh();
});
$('kind').addEventListener('change', () => { seed = (Math.random() * 0xffffffff) >>> 0; refresh(); });
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

// 类型按钮
const bar = $('kindbar');
for (const [key, K] of Object.entries(PATTERN_KINDS)) {
  const b = document.createElement('button');
  b.textContent = K.label;
  b.addEventListener('click', () => { seed = (Math.random() * 0xffffffff) >>> 0; $('kind').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
