/**
 * main.js — 脉境控制台
 */
import { PulseRender } from './render.js';
import { generatePulseNet } from './pulse.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('stage');
const render = new PulseRender(canvas);

let seed = randomSeed();

function refresh() {
  const net = generatePulseNet(seed, {
    nodes: parseInt($('nodes').value, 10),
    edges: parseInt($('edges').value, 10),
    speed: parseFloat($('speed').value),
  });
  render.setNet(net);
  $('seed').value = seed;
  $('info').textContent =
    `脉网 · ${net.stats.nodes} 节点 · ${net.stats.edges} 边 · 均等 ${net.stats.avgFreq.toFixed(0)} bpm · 平均时延 ${net.stats.avgDelay.toFixed(2)} · ${net.stats.connectivity ? '全域连通' : '未连通'}`;
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
$('nodes').addEventListener('change', refresh);
$('edges').addEventListener('change', refresh);
$('speed').addEventListener('input', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

refresh();
render.start();
