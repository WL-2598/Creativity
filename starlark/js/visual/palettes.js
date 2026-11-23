/**
 * palettes.js — 视觉调色板
 * 每套调色板是一个色彩宇宙，与音乐世界同受种子统御。
 */

export const PALETTES = {
  deepsea: {
    label: '深海',
    colors: ['#041421', '#0b3d5c', '#14708e', '#39c6c0', '#b8f0ee'],
    bg: '#020810',
  },
  dawn: {
    label: '晨曦',
    colors: ['#1d1030', '#4d2c6e', '#b25c8a', '#ee9a6b', '#ffe3b0'],
    bg: '#0e0820',
  },
  rainforest: {
    label: '雨林',
    colors: ['#03140c', '#0d4029', '#2a8a52', '#7de39a', '#e8ffd0'],
    bg: '#020c07',
  },
  stellar: {
    label: '星际',
    colors: ['#05010f', '#1c0a4a', '#4a1f9c', '#8a5cf6', '#c9b6ff'],
    bg: '#03010a',
  },
  mist: {
    label: '迷雾',
    colors: ['#101319', '#26313d', '#4a5a6a', '#8fa8bc', '#e8f1f7'],
    bg: '#0c0f13',
  },
  aurora: {
    label: '极光',
    colors: ['#020c0c', '#063b35', '#1f9e6e', '#6cf0b0', '#d9fff0'],
    bg: '#010808',
  },
  sakura: {
    label: '绯樱',
    colors: ['#1a0812', '#541636', '#b33c6a', '#f088a8', '#ffd8e8'],
    bg: '#120610',
  },
  ember: {
    label: '余烬',
    colors: ['#140604', '#4a0f06', '#9c2b0a', '#f06a1e', '#ffe0a0'],
    bg: '#0e0403',
  },
  ink: {
    label: '水墨',
    colors: ['#0a0a0a', '#2e2e33', '#7a7a82', '#cfcfd4', '#f5f5f7'],
    bg: '#08080a',
  },
};

/** 由调色板生成一个 canvas 渐变（垂直或径向） */
export function paletteGradient(ctx, colors, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
  return g;
}

/** 在调色板中按 t∈[0,1] 插值取色 */
export function paletteColor(colors, t) {
  const n = colors.length;
  const pos = ((t % 1) + 1) % 1 * (n - 1);
  const i = Math.floor(pos);
  const f = pos - i;
  const a = hexToRgb(colors[i]);
  const b = hexToRgb(colors[Math.min(n - 1, i + 1)]);
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`;
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
