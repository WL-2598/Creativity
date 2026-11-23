/**
 * gallery.js — 银河展厅驱动
 * 渲染展品卡片，并为每件展品接入其真实引擎的实时预览。
 */
import { rngFromSeed, randomSeed } from './shared/rng.js';

/* ---------------- 展品档案 ---------------- */
const EXHIBITS = [
  {
    key: 'starlark',
    name: '星澜',
    latin: 'STELLAR ECHO',
    tag: '声音 × 视觉',
    desc: '一颗种子，一个音乐宇宙。纯合成生成式环境音乐与实时视觉宇宙，声画同源，持续呼吸演化，永不重复。',
    tags: ['生成式音乐', 'Web Audio', '实时视觉', 'WAV 录音'],
    href: 'starlark/',
    preview: 'previewStarlark',
  },
  {
    key: 'inkflow',
    name: '墨韵',
    latin: 'INK RESONANCE',
    tag: '墨色 × 诗心',
    desc: '一座宣纸宇宙。种子生成水墨画卷与同源绝句，可落笔、题诗、换墨、落印，画与诗共享同一条脉络。',
    tags: ['水墨渲染', '格律诗词', '笔触交互', '画诗同源'],
    href: 'inkflow/',
    preview: 'previewInk',
  },
  {
    key: 'storyteller',
    name: '织梦',
    latin: 'STORYWEAVER',
    tag: '叙事 × 星图',
    desc: '一颗种子织出一则星夜短篇。主题、人物、事件、余韵皆由种子生成，打字机式逐字显现，星图随之流转。',
    tags: ['生成式叙事', '打字机显现', '星图视觉', '主题词库'],
    href: 'storyteller/',
    preview: 'previewStory',
  },
];

/* ---------------- 渲染卡片 ---------------- */
const hall = document.getElementById('hall');
for (const ex of EXHIBITS) {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <div class="preview">
      <span class="tag">${ex.tag}</span>
      <canvas data-preview="${ex.key}"></canvas>
    </div>
    <div class="card-body">
      <div class="card-name">${ex.name}</div>
      <div class="card-latin">${ex.latin}</div>
      <div class="card-desc">${ex.desc}</div>
      <div class="card-tags">${ex.tags.map(t => `<span>${t}</span>`).join('')}</div>
      <a class="card-link" href="${ex.href}">进入展品 <span class="arrow">→</span></a>
    </div>
  `;
  hall.appendChild(card);
}

/* 统计 */
document.getElementById('stats').innerHTML = `
  <div class="stat"><div class="num">${EXHIBITS.length}</div><div class="label">件展品</div></div>
  <div class="stat"><div class="num">38</div><div class="label">项自动化测试</div></div>
  <div class="stat"><div class="num">0</div><div class="label">外部依赖</div></div>
`;

/* ---------------- 实时预览 ---------------- */
const previewers = {
  /* 星澜：小型星云 */
  async previewStarlark(canvas) {
    const { VisualEngine } = await import('./starlark/js/visual/renderer.js');
    const { createWorld } = await import('./starlark/js/audio/composition.js');
    const engine = new VisualEngine(canvas);
    engine.setMode('nebula');
    engine.setPalette('stellar');
    engine.setWorld(createWorld(randomSeed()));
    engine.start();
  },
  /* 墨韵：一帧远山 */
  async previewInk(canvas) {
    const { InkRenderer } = await import('./inkflow/js/ink.js');
    const { generateMotif } = await import('./inkflow/js/motifs.js');
    const ink = new InkRenderer(canvas);
    const strokes = generateMotif(rngFromSeed(randomSeed()), 'mountain', ink.W, ink.H);
    ink.setScene(strokes, 1, 0.55);
    ink.start();
  },
  /* 织梦：主题星图 */
  async previewStory(canvas) {
    const { StoryVisual } = await import('./storyteller/js/visual.js');
    const { createStory } = await import('./storyteller/js/story.js');
    const visual = new StoryVisual(canvas);
    const story = createStory(randomSeed(), 'stardust');
    visual.setStory(story);
    visual.start();
  },
};

for (const canvas of document.querySelectorAll('canvas[data-preview]')) {
  const key = canvas.dataset.preview;
  const fn = previewers[key];
  if (fn) fn(canvas).catch(() => { /* 预览失败不影响展厅 */ });
}
