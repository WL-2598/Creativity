/**
 * main.js — 墨韵主控制器
 * 装配画卷渲染、诗心生成与全部交互：展卷、落笔、换墨、题诗、盖印。
 */
import { InkRenderer } from './ink.js';
import { generateMotif, MOTIF_KEYS } from './motifs.js';
import { createPoem, MOTIF_IMAGERY, lineLength } from './poetry.js';
import { rngFromSeed, randomSeed } from '../../shared/rng.js';

/* ---------------- DOM ---------------- */
const $ = id => document.getElementById(id);
const els = {
  stage: $('stage'),
  seedInput: $('seedInput'),
  enterBtn: $('enterBtn'),
  motifSel: $('motifSel'),
  modeBtn: $('modeBtn'),
  inkBtn: $('inkBtn'),
  poemBtn: $('poemBtn'),
  stampBtn: $('stampBtn'),
  clearBtn: $('clearBtn'),
  inkLabel: $('inkLabel'),
  poemPanel: $('poemPanel'),
  poemTitle: $('poemTitle'),
  poemBody: $('poemBody'),
  poemMeta: $('poemMeta'),
  toast: $('toast'),
};

/* ---------------- 引擎 ---------------- */
const ink = new InkRenderer(els.stage);
ink.start();

// 五色墨：清、淡、重、浓、焦
const INK_TONES = [
  { name: '清墨', tone: 0.18 },
  { name: '淡墨', tone: 0.4 },
  { name: '重墨', tone: 0.62 },
  { name: '浓墨', tone: 0.82 },
  { name: '焦墨', tone: 1.0 },
];
let inkIndex = 2;
let brushMode = false;
let poem = null;

/* ---------------- 工具 ---------------- */
function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove('show'), 1600);
}

function renderPoem(p) {
  poem = p;
  els.poemTitle.textContent = p.title;
  // 竖排四句
  els.poemBody.textContent = '';
  p.lines.forEach(line => {
    const span = document.createElement('span');
    span.textContent = line;
    els.poemBody.appendChild(span);
  });
  els.poemMeta.textContent = `${p.form === 'seven' ? '七言' : '五言'}绝句 · ${p.rhyme}`;
  els.poemPanel.classList.add('show');
}

/* ---------------- 展卷 ---------- */
function unroll() {
  const seed = parseInt(els.seedInput.value, 10) || 0;
  const motifKey = els.motifSel.value;
  const rng = rngFromSeed(seed);
  const strokes = generateMotif(rng, motifKey, ink.W, ink.H);
  ink.clear();
  ink.setScene(strokes, seed, INK_TONES[inkIndex].tone);
  const p = createPoem(seed, motifKey, null);
  renderPoem(p);
  toast(`《${p.title}》已展卷`);
}

/* ---------------- 落笔 ---------- */
function setBrushMode(on) {
  brushMode = on;
  els.stage.classList.toggle('brush', on);
  els.modeBtn.textContent = on ? '收笔 · 观卷' : '落笔';
  els.modeBtn.classList.toggle('on', on);
  if (!on) ink.endBrush();
}

function pos(e) {
  const rect = els.stage.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  return { x: p.clientX - rect.left, y: p.clientY - rect.top };
}

els.stage.addEventListener('pointerdown', e => {
  if (!brushMode) return;
  const p = pos(e);
  ink.beginBrush(p.x, p.y);
  els.stage.setPointerCapture(e.pointerId);
});
els.stage.addEventListener('pointermove', e => {
  if (!brushMode || !ink.brush) return;
  const p = pos(e);
  ink.extendBrush(p.x, p.y);
});
els.stage.addEventListener('pointerup', () => ink.endBrush());
els.stage.addEventListener('pointercancel', () => ink.endBrush());

/* ---------------- 控件 ---------- */
els.enterBtn.addEventListener('click', unroll);
els.seedInput.addEventListener('keydown', e => { if (e.key === 'Enter') unroll(); });

els.motifSel.addEventListener('change', () => {
  els.motifSel.dataset.dirty = '1';
  unroll();
});

els.modeBtn.addEventListener('click', () => setBrushMode(!brushMode));

els.inkBtn.addEventListener('click', () => {
  inkIndex = (inkIndex + 1) % INK_TONES.length;
  ink.setTone(INK_TONES[inkIndex].tone);
  els.inkLabel.textContent = INK_TONES[inkIndex].name;
  toast(`已换为${INK_TONES[inkIndex].name}`);
});

els.poemBtn.addEventListener('click', () => {
  if (!poem) return;
  // 五言/七言再题一阕
  const p = createPoem(parseInt(els.seedInput.value, 10) || 0, els.motifSel.value,
    poem.form === 'seven' ? 'five' : 'seven');
  renderPoem(p);
  toast(`再题${p.form === 'seven' ? '七言' : '五言'}一阕`);
});

els.stampBtn.addEventListener('click', () => {
  ink.stamp(poem ? poem.lines[poem.lines.length - 1].slice(-1) : '印');
  toast('已落印');
});

els.clearBtn.addEventListener('click', () => {
  ink.clear();
  toast('宣纸已净');
});

window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); els.modeBtn.click(); }
  else if (e.key === 's' || e.key === 'S') els.stampBtn.click();
  else if (e.key === 'c' || e.key === 'C') els.clearBtn.click();
});

/* ---------------- 装配 ---------------- */
for (const key of MOTIF_KEYS) {
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = MOTIF_IMAGERY[key].label;
  els.motifSel.appendChild(opt);
}

// 默认：随机种子 + 种子派生母题，自动展卷
const seed = randomSeed();
els.seedInput.value = String(seed);
const motifFromSeed = MOTIF_KEYS[seed % MOTIF_KEYS.length];
els.motifSel.value = motifFromSeed;
els.inkLabel.textContent = INK_TONES[inkIndex].name;
unroll();
