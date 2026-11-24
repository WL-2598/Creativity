/**
 * story.test.mjs — 织梦叙事核心与视觉冒烟测试
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStory, THEMES } from '../storyteller/js/story.js';
import { StoryVisual } from '../storyteller/js/visual.js';

/* ---------- 叙事核心 ---------- */
test('叙事：同种子同主题 => 同一则故事（确定性）', () => {
  const a = createStory(12345, 'stardust');
  const b = createStory(12345, 'stardust');
  assert.deepEqual(a, b);
});

test('叙事：结构完整（起承转合 4~5 句）', () => {
  for (let seed = 1; seed < 60; seed++) {
    const s = createStory(seed);
    assert.ok(s.sentences.length >= 4 && s.sentences.length <= 5);
    for (const line of s.sentences) {
      assert.ok(line.length >= 6, `句子过短: ${line}`);
      assert.ok(line.endsWith('。'), `句子应以句号收束: ${line}`);
    }
  }
});

test('叙事：主体四句意象不重复（约束生效）', () => {
  let violations = 0;
  for (let seed = 1; seed < 100; seed++) {
    const s = createStory(seed);
    // 只校验主体四句（起承转合）；第五句补笔允许呼应首句
    const text = s.sentences.slice(0, 4).join('');
    const T = THEMES[s.theme];
    const counts = {};
    for (const bank of ['settings', 'characters', 'actions', 'events', 'moods']) {
      for (const w of T[bank]) {
        let c = 0, i = -1;
        while ((i = text.indexOf(w, i + 1)) !== -1) c++;
        if (c > 1) counts[w] = c;
      }
    }
    if (Object.keys(counts).length > 0) violations++;
  }
  assert.ok(violations === 0, `主体四句存在意象重复: ${violations}/100`);
});

test('叙事：主题词库自洽（人物/事件均来自所属主题）', () => {
  for (const key of Object.keys(THEMES)) {
    const s = createStory(999, key);
    assert.equal(s.theme, key);
    assert.equal(s.themeLabel, THEMES[key].label);
    assert.deepEqual(s.palette, THEMES[key].palette);
    // 场景与人物应来自该主题词库
    const text = s.sentences.join('');
    const hasSetting = THEMES[key].settings.some(w => text.includes(w));
    const hasCharacter = THEMES[key].characters.some(w => text.includes(w));
    assert.ok(hasSetting, `${key} 缺少场景意象`);
    assert.ok(hasCharacter, `${key} 缺少人物`);
  }
});

test('叙事：题名格式与主题色板合法', () => {
  for (let seed = 1; seed < 40; seed++) {
    const s = createStory(seed);
    assert.match(s.title, /^.{2,4}$/);
    assert.equal(s.palette.length, 4);
    for (const c of s.palette) assert.match(c, /^#[0-9a-f]{6}$/i);
  }
});

test('叙事：不同种子 => 不同故事', () => {
  const titles = new Set();
  for (let i = 0; i < 100; i++) {
    titles.add(createStory(Math.floor(Math.random() * 0xFFFFFFFF)).sentences.join(''));
  }
  assert.ok(titles.size > 95, '随机种子应产生高度多样的故事');
});

/* ---------- 视觉冒烟 ---------- */
function makeMockCtx() {
  const gradient = { addColorStop() {} };
  return new Proxy({}, {
    get(_, prop) {
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => gradient;
      if (prop === 'fillStyle' || prop === 'strokeStyle' || prop === 'globalCompositeOperation') return '';
      if (prop === 'globalAlpha' || prop === 'lineWidth') return 1;
      return () => {};
    },
    set() { return true; },
  });
}

test('视觉：星图渲染多帧无异常，主题色可切换', () => {
  globalThis.window = { addEventListener() {}, devicePixelRatio: 1 };
  globalThis.requestAnimationFrame = () => 0;
  const visual = new StoryVisual({ clientWidth: 800, clientHeight: 600, getContext: () => makeMockCtx() });
  visual.setStory(createStory(42, 'firefly'));
  visual.start();
  for (let i = 0; i < 30; i++) visual._loop();
  assert.equal(visual.palette[2], THEMES.firefly.palette[2]);
});
