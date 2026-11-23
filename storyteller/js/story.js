/**
 * story.js — 织梦的叙事核心（纯逻辑，可独立测试）
 * 由种子生成一则短篇：起承转合的章法、主题词库、
 * 同篇不重样的约束，让每一则故事自洽且独一无二。
 */
import { rngFromSeed, randInt, weightedPick } from '../../shared/rng.js';

/* ------------------------------------------------------------------ *
 * 主题词库 —— 每个主题拥有自己的场景、人物、动作、事件与余韵
 * ------------------------------------------------------------------ */
export const THEMES = {
  nightVoyage: {
    label: '夜航',
    palette: ['#0a1430', '#1c3a6e', '#5f9ed8', '#cfe4ff'],
    settings: ['无星的海', '沉睡的甲板', '摇晃的桅灯', '寂静的罗经座', '雾里的航道', '深夜的港湾'],
    characters: ['守灯人', '远行的水手', '沉默的船长', '年轻的舵手', '迷途的旅人'],
    actions: ['等待一场风', '数着浪声', '摩挲旧罗盘', '望着地平线', '守着最后一点灯火'],
    events: ['灯塔忽然亮起', '一只海鸟落在肩头', '雾里传来微弱的回应', '罗盘指向了陌生的方向', '远处浮起一点孤光'],
    moods: ['像所有未说出口的告别', '像一粒星沉入深海', '像潮水退去后的沙滩', '像一盏灯守到天明'],
  },
  stardust: {
    label: '星尘',
    palette: ['#0b0820', '#3a1f6e', '#8a5cf6', '#e2d4ff'],
    settings: ['褪色的星图', '寂静的观星台', '落满尘埃的望远镜', '银河低垂的荒野', '老钟楼的顶层'],
    characters: ['天文学徒', '拾星的孩子', '白须的观星者', '迷路的旅人', '守夜的猫'],
    actions: ['辨认旧星座', '收集散落的微光', '等待一颗流星', '擦拭蒙尘的镜片', '数着不会重复的星'],
    events: ['一颗新星悄然浮现', '星群连成了陌生的图案', '风把星图吹开一页', '深空里传来微弱的回声', '流星划过了整个夜幕'],
    moods: ['像尘埃终于落定', '像一段被遗忘的旋律', '像时间在指尖融化', '像宇宙轻轻翻了一页'],
  },
  deepSea: {
    label: '深海',
    palette: ['#021018', '#0b3d5c', '#14708e', '#9fe8f0'],
    settings: ['幽暗的海沟', '沉睡的海底森林', '微弱的潜窗', '无声的深渊', '潮汐回响的洞穴'],
    characters: ['深潜的旅人', '守海的老者', '迷航的潜水员', '收集贝壳的孩子', '与鱼群为伴的人'],
    actions: ['聆听水的呼吸', '辨认沉睡的礁影', '追逐一束下潜的光', '抚摸古老的沉船木', '在黑暗里保持清醒'],
    events: ['深处亮起一片幽蓝', '鱼群忽然四散奔逃', '沉船里浮起一串气泡', '海沟传来悠长的低鸣', '一束光从海面直落到底'],
    moods: ['像深海里未醒的梦', '像压力下凝固的时间', '像蓝色里最深的沉默', '像光沉入水底的过程'],
  },
  snowfield: {
    label: '雪原',
    palette: ['#10151c', '#3a4a5c', '#9fb6cc', '#eef4fa'],
    settings: ['落雪的旷野', '结冰的湖面', '无风的白林', '雪掩的旧路', '暮色里的雪坡'],
    characters: ['赶路的旅人', '守林的老人', '追鹿的少年', '迷途的归客', '雪地里的孤客'],
    actions: ['踏着未冻的脚印', '辨认雪下的方向', '拂去肩上的积雪', '守着将熄的火堆', '望着没有尽头的白'],
    events: ['林中惊起一片寒鸦', '雪面下透出一点绿意', '远处有灯在雪雾里明灭', '风停时雪落得更慢了', '冰湖裂开细密的纹路'],
    moods: ['像落雪覆盖了所有来路', '像呼吸凝成白雾的过程', '像寒冷里最轻的叹息', '像冬天收留了所有疲惫'],
  },
  lonelyCity: {
    label: '孤城',
    palette: ['#140d1c', '#3d2b5c', '#a06cd5', '#f0dcf0'],
    settings: ['空荡的夜街', '熄了灯的楼群', '老城的钟楼', '雨后的石板路', '黄昏的城墙'],
    characters: ['晚归的守夜人', '楼顶的歌者', '旧书店的店主', '失眠的旅人', '穿过空街的影子'],
    actions: ['数着熄去的窗', '哼一支旧曲子', '擦拭蒙尘的招牌', '望着城市的天际线', '在空街里走了很久'],
    events: ['某扇窗忽然重新亮起', '钟楼敲响了无人听的钟', '街角的猫开口似的轻唤', '雨在午夜重新落下', '一盏灯从城西亮到城东'],
    moods: ['像城市未说尽的独白', '像灯火在暗处彼此致意', '像回声空荡荡地回来', '像一座城独自醒着'],
  },
  mistyIsle: {
    label: '雾岛',
    palette: ['#0c1216', '#2e4a52', '#6fa8a0', '#e2f2f0'],
    settings: ['缠着雾的礁岛', '湿漉漉的石阶', '雾里的旧灯塔', '潮声回荡的海崖', '雾散一半的渔村'],
    characters: ['灯塔的守雾人', '老渔夫', '迷路的航者', '拾海的孩子', '雾里归来的船客'],
    actions: ['辨认雾中的航标', '等待雾散的时刻', '擦拭雾气蒙的窗', '数着潮涨潮落', '守着雾里唯一的灯'],
    events: ['雾里透出一片暖光', '远处传来隐约的汽笛', '礁石上多了一行海鸟的爪印', '灯塔在雾中明明灭灭', '雾忽然散开了一角'],
    moods: ['像雾气在指尖散开', '像潮声在岩壁间的回声', '像朦胧里最清晰的等待', '像岛屿在雾中缓缓显形'],
  },
  wasteland: {
    label: '荒原',
    palette: ['#1a1208', '#4a3418', '#c08a4a', '#f2e2c0'],
    settings: ['风蚀的戈壁', '无垠的沙海', '长着乱草的荒坡', '废弃的驿道', '落日下的台地'],
    characters: ['赶驼的旅人', '寻水的行客', '守荒的牧人', '迷路的探险者', '风沙里的孤行者'],
    actions: ['辨认风里的水汽', '追逐天边的云影', '拂去身上的沙土', '望着漫无边际的荒', '守着将熄的篝火'],
    events: ['天边涌起一朵孤云', '沙丘后浮起一线绿意', '驼铃在风里忽远忽近', '夜里的星子格外明亮', '风停时荒原安静得能听见自己'],
    moods: ['像风在荒原上走过的痕迹', '像落日沉入沙海的过程', '像荒原对旅人的沉默应答', '像所有跋涉终将抵达的安静'],
  },
  firefly: {
    label: '萤火',
    palette: ['#0a1208', '#1e4a2a', '#6ccf7e', '#e6ffe8'],
    settings: ['夏夜的溪边', '长满萤草的田埂', '老竹林的深处', '星子稀疏的坡地', '蝉鸣的篱落'],
    characters: ['捉萤的孩子', '守夜的老者', '晚归的农人', '溪边的旅人', '竹下纳凉的人'],
    actions: ['追逐浮动的微光', '守着一盏草灯', '数着草丛里的亮斑', '听夏夜的虫声', '望着光点起起落落'],
    events: ['萤火忽然聚成一片', '草丛里亮起一条流动的河', '一只萤火落在了指尖', '溪面浮起一层碎光', '所有的光都朝一个方向飞去'],
    moods: ['像夏夜在指尖发亮', '像光点在夜色里轻轻呼吸', '像童年最轻的一记回响', '像黑暗里彼此致意的温柔'],
  },
};

/* ------------------------------------------------------------------ *
 * 叙事结构：起承转合
 * 1 起：场景 + 人物 + 动作
 * 2 承：景象 + 状态
 * 3 转：事件（"直到…"）
 * 4 合：余韵（"像…"）
 * 5-6 附：心境补笔（可选）
 * ------------------------------------------------------------------ */
const NARRATIVE = {
  opening: [
    '{setting}，{character}正{action}。',
    '{setting}上，{character}还在{action}。',
    '已是{setting}，{character}仍在{action}。',
  ],
  continuing: [
    '风掠过{scene}，把一切吹得很远。',
    '四周只有{scene}，安静得能听见自己的呼吸。',
    '{scene}在夜色里起伏，像没有尽头的呼吸。',
  ],
  turning: [
    '直到{event}。',
    '忽然，{event}。',
    '就在这时，{event}。',
  ],
  closing: [
    '{mood}，这便是这一夜的全部。',
    '{mood}，没有人追问缘由。',
    '{mood}，故事到这里便安静了。',
  ],
  extras: [
    '此后，{character}再没有提起过那一夜。',
    '许多年后，{character}仍会想起{setting}。',
    '而{scene}依旧，仿佛什么都没发生过。',
  ],
};

// 每个主题的"景象"词，供 continuing/extras 使用
const THEME_SCENES = {
  nightVoyage: ['起伏的浪', '远处的灯火', '深色的水面', '微明的天际'],
  stardust: ['低垂的银河', '蒙尘的星图', '寂静的天顶', '微光的荒野'],
  deepSea: ['幽暗的水流', '沉睡的礁影', '下潜的光柱', '无声的海沟'],
  snowfield: ['起伏的雪野', '结冰的湖面', '落雪的林梢', '无垠的白'],
  lonelyCity: ['空荡的长街', '熄灯的楼群', '湿亮的石板', '远处的天际'],
  mistyIsle: ['缠绕的雾气', '湿漉的石阶', '明明灭灭的航标', '潮声回荡的崖壁'],
  wasteland: ['起伏的沙海', '风蚀的台地', '漫无边际的荒草', '落日的余晖'],
  firefly: ['浮动的微光', '长草的田埂', '稀疏的星子', '发亮的溪面'],
};

function fill(rng, template, ctx) {
  let out = template;
  for (const key of ['setting', 'character', 'action', 'event', 'mood', 'scene']) {
    const token = `{${key}}`;
    if (out.includes(token)) {
      out = out.split(token).join(ctx[key]);
    }
  }
  return out;
}

function pick(rng, arr) {
  return weightedPick(rng, arr.map(w => ({ w: 1, x: w }))).x;
}

/**
 * 生成一则故事。
 * @returns {{title, theme, sentences, palette, seed}}
 */
export function createStory(seed, themeKey = null) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const themes = Object.keys(THEMES);
  const key = themeKey && THEMES[themeKey] ? themeKey : pick(rng, themes);
  const T = THEMES[key];
  const scenes = THEME_SCENES[key];

  // 同篇不重样：记录已用词汇
  const used = new Set();
  const take = (arr) => {
    for (let i = 0; i < 8; i++) {
      const w = pick(rng, arr);
      if (!used.has(w)) { used.add(w); return w; }
    }
    const w = arr[randInt(rng, 0, arr.length - 1)];
    used.add(w);
    return w;
  };

  const ctx = {
    setting: take(T.settings),
    character: take(T.characters),
    action: take(T.actions),
    event: take(T.events),
    mood: take(T.moods),
    scene: take(scenes),
  };

  const sentences = [];
  sentences.push(fill(rng, pick(rng, NARRATIVE.opening), ctx));
  sentences.push(fill(rng, pick(rng, NARRATIVE.continuing), ctx));
  sentences.push(fill(rng, pick(rng, NARRATIVE.turning), ctx));
  sentences.push(fill(rng, pick(rng, NARRATIVE.closing), ctx));
  if (rng() < 0.5) sentences.push(fill(rng, pick(rng, NARRATIVE.extras), ctx));

  // 题名：主题词 + 心境词
  const titleWords = ['记', '夜', '事', '影', '痕', '声', '梦', '约'];
  const title = T.label + pick(rng, titleWords);

  return { title, theme: key, themeLabel: T.label, sentences, palette: T.palette, seed: seed >>> 0 };
}
