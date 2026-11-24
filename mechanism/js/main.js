/**
 * main.js — 机枢控制台
 */
import { MechanismRender } from './render.js';
import { generateMechanism } from './mechanism.js';

const $ = (id) => document.getElementById(id);
const canvas = $('stage');
const render = new MechanismRender(canvas);

let seed = (Math.random() * 0xffffffff) >>> 0;
let current = null;

function refresh() {
  current = generateMechanism(seed, { gears: $('gears').value });
  render.setMechanism(current);
  $('seed').value = seed;
  $('info').textContent =
    `齿轮 ${current.stats.gears} 只 · 总齿数 ${current.stats.totalTeeth} · 传动链比 ${current.stats.gearRatio.toFixed(2)} · ${current.stats.hasPendulum ? '含摆锤' : '无摆锤'}`;
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
$('gears').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

refresh();
render.start();
