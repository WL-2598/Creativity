/**
 * main.js — 声境控制台
 */
import { SoundscapeRender } from './render.js';
import { generateScore, SCALE_TYPES } from './melody.js';

const $ = (id) => document.getElementById(id);
const canvas = $('wave');
const render = new SoundscapeRender(canvas);

let seed = (Math.random() * 0xffffffff) >>> 0;
let current = null;
let playing = false;

function refresh() {
  current = generateScore(seed, { style: $('style').value || null });
  render.setScore(current);
  $('seed').value = seed;
  $('info').textContent =
    `调式「${current.styleLabel}」 · ${current.bpm} BPM · ${current.bars} 小节 · ${current.stats.notes} 音符`;
}

function randomize() {
  seed = (Math.random() * 0xffffffff) >>> 0;
  refresh();
}

function togglePlay() {
  render.ensureAudio();
  if (playing) {
    render.audio.suspend();
    playing = false;
    $('play').textContent = '演奏';
  } else {
    render.audio.resume();
    playing = true;
    $('play').textContent = '暂停';
  }
  render.start();
}

$('random').addEventListener('click', randomize);
$('play').addEventListener('click', togglePlay);
$('seed').addEventListener('change', () => {
  seed = (parseInt($('seed').value, 10) >>> 0) || 1;
  refresh();
});
$('style').addEventListener('change', () => { seed = (Math.random() * 0xffffffff) >>> 0; refresh(); });
$('volume').addEventListener('input', () => render.setVolume(parseFloat($('volume').value)));
window.addEventListener('keydown', (e) => {
  if (e.key === ' ' && !/input|textarea/i.test(e.target.tagName)) { e.preventDefault(); togglePlay(); }
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

// 风格按钮
const bar = $('stylebar');
for (const [key, S] of Object.entries(SCALE_TYPES)) {
  const b = document.createElement('button');
  b.textContent = S.label;
  b.addEventListener('click', () => { seed = (Math.random() * 0xffffffff) >>> 0; $('style').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
