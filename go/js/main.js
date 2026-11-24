/**
 * main.js — 棋境控制台
 */
import { GoRender } from './render.js';
import { generateGo, groupLiberties } from './go.js';
import { randomSeed } from '../../shared/rng.js';

const $ = (id) => document.getElementById(id);
const canvas = $('board');
const render = new GoRender(canvas);

let seed = randomSeed();

function refresh() {
  const game = generateGo(seed, { size: parseInt($('size').value, 10) });
  render.setGame(game);
  $('seed').value = seed;
  // 统计首子气数
  const first = game.stones[0];
  const libs = first ? groupLiberties(game.stones, game.size, first.x, first.y) : 0;
  $('info').textContent =
    `棋局 · ${game.size} 路 · 星位 ${game.stats.stars} · 落子 ${game.stats.moves}（黑 ${game.stats.black} / 白 ${game.stats.white}）· 首子气数 ${libs}`;
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
$('size').addEventListener('change', refresh);
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r' && !/input|textarea/i.test(e.target.tagName)) randomize();
});

refresh();
render.start();
