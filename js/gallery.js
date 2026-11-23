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
  {
    key: 'floating',
    name: '浮生',
    latin: 'FLOATING LIVES',
    tag: '生态 × 涌现',
    desc: '一瓶之中，万物自生。种子在瓶中布下浮游、游鱼与水草，它们在光照下生长、捕食、群游、繁衍与死亡，涌现生机。',
    tags: ['生态模拟', '涌现行为', '种群动态', '玻璃瓶渲染'],
    href: 'floating/',
    preview: 'previewFloating',
  },
  {
    key: 'prism',
    name: '棱镜',
    latin: 'PRISM',
    tag: '几何 × 辉光',
    desc: '种子为轴，几何为枝。递归分生与多重对称铸就精密辉光的几何构图，于缓缓旋转中显现数学之美。',
    tags: ['递归分形', '对称构图', '辉光渲染', '参数调控'],
    href: 'prism/',
    preview: 'previewPrism',
  },
  {
    key: 'lumen',
    name: '流光',
    latin: 'LUMEN',
    tag: '光绘 × 磷光',
    desc: '执光为笔，暗处生辉。种子点亮流光丝带，亦可执笔绘光，让磷光在深夜里游走绵长。',
    tags: ['光绘艺术', '辉光丝带', '执笔绘光', '光色流转'],
    href: 'lumen/',
    preview: 'previewLumen',
  },
  {
    key: 'rift',
    name: '裂隙',
    latin: 'RIFT',
    tag: '山河 × 地图',
    desc: '一纸之间，山河自成。种子生成分形地形，等高线、水系、林雪与图框在其中静默生长。',
    tags: ['程序地形', '等高线', '水系寻径', '地图美学'],
    href: 'rift/',
    preview: 'previewRift',
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
  <div class="stat"><div class="num">64</div><div class="label">项自动化测试</div></div>
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
  /* 浮生：生态瓶 */
  async previewFloating(canvas) {
    const { EcoRender } = await import('./floating/js/render.js');
    const { createEcosystem, bindRng } = await import('./floating/js/ecology.js');
    const render = new EcoRender(canvas);
    const state = bindRng(createEcosystem(randomSeed(), { fish: 3, plankton: 24, plant: 4 }), 1);
    render.setState(state);
    render.start();
  },
  /* 棱镜：几何构图 */
  async previewPrism(canvas) {
    const { PrismRender } = await import('./prism/js/render.js');
    const { generateGeometry } = await import('./prism/js/geometry.js');
    const render = new PrismRender(canvas);
    const { elements } = generateGeometry(randomSeed(), { symmetry: 6, depth: 3 });
    render.setScene(elements);
    render.start();
  },
  /* 流光：光带 */
  async previewLumen(canvas) {
    const { LumenRender } = await import('./lumen/js/render.js');
    const { generateRibbons } = await import('./lumen/js/lumen.js');
    const render = new LumenRender(canvas);
    render.setRibbons(generateRibbons(randomSeed(), { count: 5, W: render.W, H: render.H }));
    render.start();
  },
  /* 裂隙：山河图 */
  async previewRift(canvas) {
    const { RiftRender } = await import('./rift/js/render.js');
    const { generateTerrain, findRivers } = await import('./rift/js/terrain.js');
    const render = new RiftRender(canvas);
    const terrain = generateTerrain(randomSeed(), 120, 84);
    render.setTerrain(terrain, findRivers(terrain, 3));
    render.start();
  },
};

for (const canvas of document.querySelectorAll('canvas[data-preview]')) {
  const key = canvas.dataset.preview;
  const fn = previewers[key];
  if (fn) fn(canvas).catch(() => { /* 预览失败不影响展厅 */ });
}
