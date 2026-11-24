/**
 * poetry.js — 墨韵的诗心（纯逻辑，可独立测试）
 * 由种子生成五言/七言绝句：起承转合的章法、押韵、与画卷母题
 * 联动的意象，实现"画与诗同源"。
 */
import { rngFromSeed, randInt, weightedPick } from '../../shared/rng.js';

/* ------------------------------------------------------------------ *
 * 母题意象库 —— 画卷画什么，诗中便取什么意象，画诗同源
 * ------------------------------------------------------------------ */
export const MOTIF_IMAGERY = {
  mountain: { label: '远山', images: ['山', '云', '岭', '松', '泉', '石', '雾', '烟', '峰', '岫'] },
  bamboo:   { label: '修竹', images: ['竹', '风', '节', '叶', '阴', '霜', '声', '影', '枝', '翠'] },
  plum:     { label: '疏梅', images: ['梅', '雪', '香', '枝', '月', '寒', '影', '清', '花', '霜'] },
  orchid:   { label: '幽兰', images: ['兰', '谷', '香', '露', '风', '叶', '幽', '清', '芳', '烟'] },
  moon:     { label: '明月', images: ['月', '云', '光', '露', '风', '星', '江', '清', '天', '波'] },
  boat:     { label: '孤舟', images: ['舟', '江', '水', '波', '风', '岸', '云', '远', '潮', '津'] },
  crane:    { label: '孤鹤', images: ['鹤', '云', '风', '松', '影', '天', '远', '清', '峰', '烟'] },
  rain:     { label: '听雨', images: ['雨', '窗', '风', '声', '灯', '夜', '烟', '凉', '云', '阶'] },
};

/* ------------------------------------------------------------------ *
 * 韵部（取平水韵之意，以词库成组）—— 绝句一、二、四句同韵
 * ------------------------------------------------------------------ */
export const RHYME_GROUPS = {
  ong:  { label: '东韵', words: ['空', '风', '中', '声', '光', '长', '行', '生', '轻', '清', '明', '丛'] },
  an:   { label: '寒韵', words: ['山', '云', '烟', '天', '川', '边', '船', '眠', '连', '寒', '篇', '前', '烟'] },
  ang:  { label: '阳韵', words: ['阳', '香', '霜', '乡', '方', '黄', '凉', '苍', '芳', '光', '长', '堂'] },
  i:    { label: '支韵', words: ['枝', '池', '迟', '时', '知', '丝', '吹', '随', '垂', '宜', '奇', '微', '篱'] },
  ei:   { label: '微韵', words: ['归', '飞', '微', '衣', '稀', '依', '晖', '扉', '违', '非', '围', '飞'] },
};

const GENERIC_IMAGES = ['烟', '云', '风', '露', '霜', '月', '星', '波', '雪', '光', '影', '声', '天', '江', '林', '水'];

/* ------------------------------------------------------------------ *
 * 句式模板
 * rhyme  —— 押韵句（一、二、四句），尾字取自韵部
 * plain  —— 不押韵句（第三句"转"），尾字为普通意象/虚字
 * 每段[$景]为一个单字意象槽
 * ------------------------------------------------------------------ */
const LINE_TEMPLATES = {
  five: {
    rhyme: [
      '[$景][$景]过[$景]$韵',
      '[$景][$景]隐[$景]$韵',
      '[$景][$景]照[$景]$韵',
      '[$景][$景]入[$景]$韵',
      '一[$景][$景]随$韵',
      '半[$景]生[$景]$韵',
      '[$景][$景]度[$景]$韵',
    ],
    plain: [
      '[$景][$景][$景]见[$景]',
      '[$景][$景][$景]起[$景]',
      '[$景][$景][$景]落[$景]',
      '[$景][$景]对[$景]坐',
      '[$景]随[$景][$景]远',
    ],
  },
  seven: {
    rhyme: [
      '[$景][$景][$景][$景]过[$景]$韵',
      '半[$景][$景]照[$景][$景]$韵',
      '[$景][$景][$景]隐[$景][$景]$韵',
      '一[$景][$景]随[$景][$景]$韵',
      '[$景][$景][$景]凝[$景][$景]$韵',
      '满[$景][$景]送[$景][$景]$韵',
    ],
    plain: [
      '[$景][$景][$景][$景]见[$景][$景]',
      '[$景][$景][$景][$景]起[$景]声',
      '[$景][$景][$景]对[$景][$景]远',
      '[$景][$景][$景]落[$景][$景]深',
    ],
  },
};

/** 从意象库取一字（母题意象为主，通用意象为辅） */
function pickImage(rng, motifImages) {
  const useMotif = rng() < 0.7;
  const pool = useMotif ? motifImages : GENERIC_IMAGES;
  return weightedPick(rng, pool.map(w => ({ w: 1, x: w }))).x;
}

/** 把模板填充为一句：按出现顺序以意象填[$景]，韵字填$韵 */
function buildLine(rng, template, motifImages, rhymeWord) {
  const imgs = template.split('[$景]').slice(1).map(() => pickImage(rng, motifImages));
  const chunks = template.split('[$景]');
  let out = chunks[0];
  for (let k = 1; k < chunks.length; k++) out += imgs[k - 1] + chunks[k];
  return out.replace('$韵', rhymeWord);
}

/** 题名：母题意象 + 心境词 */
const TITLE_WORDS = ['夜游', '闲坐', '晚望', '早行', '独坐', '偶题', '山中', '江上', '雨后', '雪夜', '风前', '月下', '途中', '即事'];

/**
 * 生成一首绝句。
 * @returns {{title:string, lines:string[], form:'five'|'seven', motif:string, rhyme:string}}
 */
export function createPoem(seed, motifKey = 'mountain', form = null) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const imagery = MOTIF_IMAGERY[motifKey] || MOTIF_IMAGERY.mountain;
  const images = imagery.images;
  const fmt = form || (rng() < 0.5 ? 'five' : 'seven');

  // 选定韵部（一、二、四句同韵）
  const rhymeKeys = Object.keys(RHYME_GROUPS);
  const rhymeKey = weightedPick(rng, rhymeKeys.map(k => ({ w: 1, x: k }))).x;
  const rhymeWord = weightedPick(rng, RHYME_GROUPS[rhymeKey].words.map(w => ({ w: 1, x: w }))).x;

  const tpl = LINE_TEMPLATES[fmt];
  const lines = [];
  for (let i = 0; i < 4; i++) {
    // 第三句为"转"，不押韵
    const template = i === 2
      ? tpl.plain[randInt(rng, 0, tpl.plain.length - 1)]
      : tpl.rhyme[randInt(rng, 0, tpl.rhyme.length - 1)];
    lines.push(buildLine(rng, template, images, rhymeWord));
  }

  const title = imagery.label + weightedPick(rng, TITLE_WORDS.map(w => ({ w: 1, x: w }))).x;
  return { title, lines, form: fmt, motif: motifKey, rhyme: RHYME_GROUPS[rhymeKey].label };
}

/** 校验诗句字数是否合律 */
export function lineLength(line, form) {
  return line.length === (form === 'seven' ? 7 : 5);
}
