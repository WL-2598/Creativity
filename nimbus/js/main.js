/**
 * main.js — 云图控制台
 */
import { WeatherRender } from './render.js';
import { generateWeather, WEATHER_STYLES } from './weather.js';

const $ = (id) => document.getElementById(id);
const canvas = $('sky');
const render = new WeatherRender(canvas);

let seed = (Math.random() * 0xffffffff) >>> 0;
let current = null;

function refresh() {
  const styleKey = $('style').value || null;
  current = generateWeather(seed, styleKey);
  render.setWeather(current);
  $('seed').value = seed;
  $('info').textContent =
    `天气「${current.styleLabel}」 · 雨势 ${Math.round(current.rainRate * 100)}% · 风力 ${current.wind.toFixed(1)} · 闪电 ${current.lightningRate > 0.3 ? '频繁' : current.lightningRate > 0 ? '偶发' : '无'}`;
  $('style').value = current.style;
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
$('style').addEventListener('change', () => {
  seed = (Math.random() * 0xffffffff) >>> 0;
  refresh();
});
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

// 风格按钮
const bar = $('stylebar');
for (const [key, S] of Object.entries(WEATHER_STYLES)) {
  const b = document.createElement('button');
  b.textContent = S.label;
  b.addEventListener('click', () => { seed = (Math.random() * 0xffffffff) >>> 0; $('style').value = key; refresh(); });
  bar.appendChild(b);
}

refresh();
render.start();
