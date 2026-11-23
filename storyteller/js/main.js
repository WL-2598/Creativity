/**
 * main.js — 织梦主控制器
 * 装配星图视觉、叙事生成与打字机式显现交互。
 */
import { StoryVisual } from './visual.js';
import { createStory, THEMES } from './story.js';
import { randomSeed } from '../../shared/rng.js';

/* ---------------- DOM ---------------- */
const $ = id => document.getElementById(id);
const els = {
  stage: $('stage'),
  text: $('text'),
  title: $('storyTitle'),
  author: $('storyAuthor'),
  seedInput: $('seedInput'),
  weaveBtn: $('weaveBtn'),
  themeSel: $('themeSel'),
  replayBtn: $('replayBtn'),
};

/* ---------------- 引擎 ---------------- */
const visual = new StoryVisual(els.stage);
visual.start();

let story = null;
let revealToken = 0;   // 防止旧显现与新显现交叠

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** 打字机显现 */
async function reveal(s) {
  const token = ++revealToken;
  els.text.textContent = '';
  els.text.classList.remove('done');
  const chars = s.sentences.join('\n');
  for (let i = 0; i < chars.length; i++) {
    if (token !== revealToken) return;   // 已被新的显现取代
    const ch = chars[i];
    els.text.textContent += ch;
    // 标点处稍作停顿，模拟叙事的呼吸
    const pause = /[，。、！？：；\n]/.test(ch) ? 160 : 42;
    await sleep(pause);
  }
  if (token === revealToken) {
    els.text.classList.add('done');
  }
}

/* ---------------- 编织 ---------- */
function weave(seed, themeKey) {
  story = createStory(seed, themeKey);
  visual.setStory(story);
  els.title.textContent = `《${story.title}》`;
  els.author.textContent = `${story.themeLabel} · 种子 ${story.seed}`;
  els.seedInput.value = String(story.seed);
  // 主题色随故事流转，文字与星图同呼吸
  document.documentElement.style.setProperty('--accent', story.palette[2]);
  reveal(story);
}

/* ---------------- 控件 ---------------- */
els.weaveBtn.addEventListener('click', () => {
  weave(randomSeed(), els.themeSel.value || null);
});

els.seedInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const v = parseInt(els.seedInput.value, 10);
    if (Number.isFinite(v)) weave(v, els.themeSel.value || null);
  }
});

els.themeSel.addEventListener('change', () => {
  weave(parseInt(els.seedInput.value, 10) || randomSeed(), els.themeSel.value);
});

els.replayBtn.addEventListener('click', () => {
  if (story) reveal(story);
});

window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); if (story) reveal(story); }
  else if (e.key === 'w' || e.key === 'W') els.weaveBtn.click();
});

/* ---------------- 装配 ---------------- */
for (const key of Object.keys(THEMES)) {
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = THEMES[key].label;
  els.themeSel.appendChild(opt);
}
els.themeSel.value = '';
const opt = document.createElement('option');
opt.value = '';
opt.textContent = '随机';
els.themeSel.prepend(opt);

// 首则故事
weave(randomSeed(), null);
