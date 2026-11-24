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
  {
    key: 'crystalline',
    name: '晶境',
    latin: 'CRYSTALLINE',
    tag: '生长 × 矿质',
    desc: '一颗种子，一片矿脉。种子落下晶种，晶体按邻接法则逐格生长，聚簇成簇、次序展开，矿物色光在暗处晶闪。',
    tags: ['晶体生长', '邻接法则', '聚簇统计', '矿质色板'],
    href: 'crystalline/',
    preview: 'previewCrystalline',
  },
  {
    key: 'forma',
    name: '形境',
    latin: 'FORMA',
    tag: '植物 × 形态',
    desc: '一颗种子，一株生灵。L 系统生长出乔木、花卉、芳草与蕨类，枝干渐细、叶花落位，风中摇曳次第舒展。',
    tags: ['L 系统', '分枝生长', '形态词典', '风动摇曳'],
    href: 'forma/',
    preview: 'previewForma',
  },
  {
    key: 'nimbus',
    name: '云图',
    latin: 'NIMBUS',
    tag: '天候 × 气象',
    desc: '一颗种子，一片天空。云海漂移、雨幕斜织、闪电裂空、雪落无声，晨雾、夜雨、暮霞、雪云四种天候各成世界。',
    tags: ['程序天气', '云场噪声', '闪电枝杈', '天候风格'],
    href: 'nimbus/',
    preview: 'previewNimbus',
  },
  {
    key: 'mechanism',
    name: '机枢',
    latin: 'MECHANISM',
    tag: '机械 × 传动',
    desc: '一颗种子，一套机械。种子裁决一组相互啮合的齿轮：齿数定传动比、转向交替，外加一只钟摆，静静运转。',
    tags: ['齿轮啮合', '传动比', '钟摆动力学', '机械布局'],
    href: 'mechanism/',
    preview: 'previewMechanism',
  },
  {
    key: 'soundscape',
    name: '声境',
    latin: 'SOUNDSCAPE',
    tag: '乐谱 × 声波',
    desc: '一颗种子，一段乐谱。种子生成五声旋律与和声进行，Web Audio 实时合成演奏，声波在示波器中实时展开。',
    tags: ['程序乐谱', '五声音阶', 'Web Audio 合成', '波形可视化'],
    href: 'soundscape/',
    preview: 'previewSoundscape',
  },
  {
    key: 'texture',
    name: '织理',
    latin: 'TEXTURE',
    tag: '纹样 × 对称',
    desc: '一颗种子，一张纹样。经纬交织成编织、四色嵌合成瓷砖、层层放射成曼陀罗，三种图案各成锦面。',
    tags: ['程序纹样', '经纬编织', '马赛克镶嵌', '旋转对称'],
    href: 'texture/',
    preview: 'previewTexture',
  },
  {
    key: 'starweb',
    name: '织星',
    latin: 'STARWEB',
    tag: '星网 × 图论',
    desc: '一颗种子，一片星网。星点散布、星等分级，以最小生成树连缀成网，星官之名取连线最多的一域。',
    tags: ['图论连网', '最小生成树', '星等闪烁', '星官命名'],
    href: 'starweb/',
    preview: 'previewStarweb',
  },
  {
    key: 'print',
    name: '拓境',
    latin: 'PRINT',
    tag: '版画 × 套印',
    desc: '一颗种子，一幅版画。多块印版各成形状与墨色，按先浅后深层层套印，错位之间见手工呼吸。',
    tags: ['多版套色', '半调图案', '套印错位', '纸纹压痕'],
    href: 'print/',
    preview: 'previewPrint',
  },
  {
    key: 'pulse',
    name: '脉境',
    latin: 'PULSE',
    tag: '脉网 × 节律',
    desc: '一颗种子，一张脉网。节点各有固有节律，脉冲沿边传播，时延由距离与速度决定，如心跳与神经。',
    tags: ['节律脉动', '脉冲传播', '时延计算', '近邻连网'],
    href: 'pulse/',
    preview: 'previewPulse',
  },
  {
    key: 'halo',
    name: '晕境',
    latin: 'HALO',
    tag: '天象 × 光学',
    desc: '一颗种子，一处天象。日晕、主虹、副虹按物理角序排布，星芒射出、雾滴闪烁，晴日清月雾晨皆成景。',
    tags: ['大气光学', '双虹角序', '星芒辐射', '雾滴闪烁'],
    href: 'halo/',
    preview: 'previewHalo',
  },
  {
    key: 'smoke',
    name: '烟境',
    latin: 'SMOKE',
    tag: '流烟 × 流场',
    desc: '一颗种子，一处烟境。烟源布底、流场织空，烟羽在流场中升腾、翻卷、扩散，如烟似雾、永不重样。',
    tags: ['粒子烟羽', '流场驱动', '升腾扩散', '四色烟调'],
    href: 'smoke/',
    preview: 'previewSmoke',
  },
  {
    key: 'origami',
    name: '纸境',
    latin: 'ORIGAMI',
    tag: '折痕 × 定理',
    desc: '一颗种子，一张折痕图。横纵折痕的峰线谷线经构造赋值，每个顶点恒满足马氏定理，峰实谷虚、纸面呼吸。',
    tags: ['折痕图案', '马氏定理', '峰谷赋值', '纸色风格'],
    href: 'origami/',
    preview: 'previewOrigami',
  },
  {
    key: 'sandpit',
    name: '沙盘',
    latin: 'SANDPIT',
    tag: '沙粒 × 元胞',
    desc: '一颗种子，一处沙境。沙源落沙，元胞法则驱动沙粒从高处滑向低处，堆积自平、沙量守恒。',
    tags: ['元胞法则', '沙粒滑落', '堆积自平', '沙量守恒'],
    href: 'sandpit/',
    preview: 'previewSandpit',
  },
  {
    key: 'tide',
    name: '潮汐',
    latin: 'TIDE',
    tag: '月相 × 潮位',
    desc: '一颗种子，一处海域。月相盈亏、半日潮位曲线与浪况皆由种子裁决，潮水随潮位整体涨落。',
    tags: ['月相盈亏', '半日潮位', '大潮小潮', '海浪层叠'],
    href: 'tide/',
    preview: 'previewTide',
  },
  {
    key: 'promenade',
    name: '回廊',
    latin: 'PROMENADE',
    tag: '空间 × 透视',
    desc: '一颗种子，一条长廊。灭点、双侧柱列与拱券按纵深收敛，光束斜入，长廊随时间缓缓前行。',
    tags: ['透视长廊', '柱列拱券', '灭点收敛', '光束游移'],
    href: 'promenade/',
    preview: 'previewPromenade',
  },
  {
    key: 'floral',
    name: '花相',
    latin: 'FLORAL',
    tag: '花艺 × 构图',
    desc: '一颗种子，一席瓶花。主枝、客枝、使枝三主构图，高低错落、疏密有致，花材配色皆由种子裁决。',
    tags: ['三主构图', '花材词典', '花器形制', '疏密有致'],
    href: 'floral/',
    preview: 'previewFloral',
  },
  {
    key: 'go',
    name: '棋境',
    latin: 'GO',
    tag: '棋局 × 气数',
    desc: '一颗种子，一局围棋。星位起手、黑白交替，落子互不重叠，连通块的气数可精确计算，静默成局。',
    tags: ['星位布子', '黑白交替', '连通块', '气数计算'],
    href: 'go/',
    preview: 'previewGo',
  },
  {
    key: 'glitch',
    name: '光斑',
    latin: 'GLITCH',
    tag: '故障 × 信号',
    desc: '一颗种子，一帧故障。行位移、色散、数据块与扫描线皆由种子裁决，数字信号在失真中显影。',
    tags: ['行位移带', 'RGB 色散', '数据块错位', '扫描噪点'],
    href: 'glitch/',
    preview: 'previewGlitch',
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
  <div class="stat"><div class="num">189</div><div class="label">项自动化测试</div></div>
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
  /* 晶境：一片矿脉 */
  async previewCrystalline(canvas) {
    const { CrystalRender } = await import('./crystalline/js/render.js');
    const { growCrystals } = await import('./crystalline/js/crystal.js');
    const render = new CrystalRender(canvas);
    render.setScene(growCrystals(randomSeed(), { width: 60, height: 40, seeds: 3, steps: 90 }));
    render.start();
  },
  /* 形境：一株生灵 */
  async previewForma(canvas) {
    const { PlantRender } = await import('./forma/js/render.js');
    const { generatePlant } = await import('./forma/js/lsystem.js');
    const render = new PlantRender(canvas);
    render.setPlant(generatePlant(randomSeed(), 'tree', 4));
    render.start();
  },
  /* 云图：一片天空 */
  async previewNimbus(canvas) {
    const { WeatherRender } = await import('./nimbus/js/render.js');
    const { generateWeather } = await import('./nimbus/js/weather.js');
    const render = new WeatherRender(canvas);
    render.setWeather(generateWeather(randomSeed()));
    render.start();
  },
  /* 机枢：一套机械 */
  async previewMechanism(canvas) {
    const { MechanismRender } = await import('./mechanism/js/render.js');
    const { generateMechanism } = await import('./mechanism/js/mechanism.js');
    const render = new MechanismRender(canvas);
    render.setMechanism(generateMechanism(randomSeed(), { gears: 5 }));
    render.start();
  },
  /* 声境：一段声波 */
  async previewSoundscape(canvas) {
    const { SoundscapeRender } = await import('./soundscape/js/render.js');
    const { generateScore } = await import('./soundscape/js/melody.js');
    const render = new SoundscapeRender(canvas);
    render.setScore(generateScore(randomSeed()));
    render.start();
  },
  /* 织理：一张纹样 */
  async previewTexture(canvas) {
    const { TextureRender } = await import('./texture/js/render.js');
    const { generatePattern } = await import('./texture/js/pattern.js');
    const render = new TextureRender(canvas);
    render.setPattern(generatePattern(randomSeed()));
    render.start();
  },
  /* 织星：一片星网 */
  async previewStarweb(canvas) {
    const { StarRender } = await import('./starweb/js/render.js');
    const { generateStarfield } = await import('./starweb/js/constellation.js');
    const render = new StarRender(canvas);
    render.setField(generateStarfield(randomSeed(), { stars: 22, link: 1 }));
    render.start();
  },
  /* 拓境：一幅版画 */
  async previewPrint(canvas) {
    const { PrintRender } = await import('./print/js/render.js');
    const { generatePrint } = await import('./print/js/print.js');
    const render = new PrintRender(canvas);
    render.setPrint(generatePrint(randomSeed(), { plates: 3 }));
    render.start();
  },
  /* 脉境：一张脉网 */
  async previewPulse(canvas) {
    const { PulseRender } = await import('./pulse/js/render.js');
    const { generatePulseNet } = await import('./pulse/js/pulse.js');
    const render = new PulseRender(canvas);
    render.setNet(generatePulseNet(randomSeed(), { nodes: 14 }));
    render.start();
  },
  /* 晕境：一处天象 */
  async previewHalo(canvas) {
    const { HaloRender } = await import('./halo/js/render.js');
    const { generateHalo } = await import('./halo/js/halo.js');
    const render = new HaloRender(canvas);
    render.setScene(generateHalo(randomSeed()));
    render.start();
  },
  /* 烟境：一处烟境 */
  async previewSmoke(canvas) {
    const { SmokeRender } = await import('./smoke/js/render.js');
    const { generateSmoke } = await import('./smoke/js/smoke.js');
    const render = new SmokeRender(canvas);
    render.setScene(generateSmoke(randomSeed(), { sources: 2, field: 24 }));
    render.start();
  },
  /* 纸境：一张折痕图 */
  async previewOrigami(canvas) {
    const { OrigamiRender } = await import('./origami/js/render.js');
    const { generateOrigami } = await import('./origami/js/origami.js');
    const render = new OrigamiRender(canvas);
    render.setFold(generateOrigami(randomSeed(), { grid: 10 }));
    render.start();
  },
  /* 沙盘：一处沙境 */
  async previewSandpit(canvas) {
    const { SandRender } = await import('./sandpit/js/render.js');
    const { generateSandscape } = await import('./sandpit/js/sand.js');
    const render = new SandRender(canvas);
    render.setState(generateSandscape(randomSeed(), { width: 40, height: 22 }));
    render.start();
  },
  /* 潮汐：一处海域 */
  async previewTide(canvas) {
    const { TideRender } = await import('./tide/js/render.js');
    const { generateTide } = await import('./tide/js/tide.js');
    const render = new TideRender(canvas);
    render.setTide(generateTide(randomSeed(), { hours: 48 }));
    render.start();
  },
  /* 回廊：一条长廊 */
  async previewPromenade(canvas) {
    const { PromenadeRender } = await import('./promenade/js/render.js');
    const { generatePromenade } = await import('./promenade/js/promenade.js');
    const render = new PromenadeRender(canvas);
    render.setHall(generatePromenade(randomSeed(), { columns: 7, arches: 4 }));
    render.start();
  },
  /* 花相：一席瓶花 */
  async previewFloral(canvas) {
    const { FloralRender } = await import('./floral/js/render.js');
    const { generateFloral } = await import('./floral/js/floral.js');
    const render = new FloralRender(canvas);
    render.setArrangement(generateFloral(randomSeed(), { materials: 3 }));
    render.start();
  },
  /* 棋境：一局棋 */
  async previewGo(canvas) {
    const { GoRender } = await import('./go/js/render.js');
    const { generateGo } = await import('./go/js/go.js');
    const render = new GoRender(canvas);
    render.setGame(generateGo(randomSeed(), { size: 19 }));
    render.start();
  },
  /* 光斑：一帧故障 */
  async previewGlitch(canvas) {
    const { GlitchRender } = await import('./glitch/js/render.js');
    const { generateGlitch } = await import('./glitch/js/glitch.js');
    const render = new GlitchRender(canvas);
    render.setGlitch(generateGlitch(randomSeed(), { bands: 6, scanlines: 16 }));
    render.start();
  },
};

for (const canvas of document.querySelectorAll('canvas[data-preview]')) {
  const key = canvas.dataset.preview;
  const fn = previewers[key];
  if (fn) fn(canvas).catch(() => { /* 预览失败不影响展厅 */ });
}
