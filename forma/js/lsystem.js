/**
 * lsystem.js — 形境的植物核心（纯逻辑，可独立测试）
 * 种子驱动的 L-系统植物：按类型（树/花/草/蕨）的递归规则，
 * 用海龟解释法生成枝干线段与叶花标记，记录生长次序供动画。
 */
import { rngFromSeed } from '../../shared/rng.js';

/* 各类型的 L-系统定义：axiom 与规则（F 为终态绘制，X 为可展开） */
const PLANT_DEFS = {
  tree: {
    label: '乔木',
    axiom: 'X',
    rules: { X: 'F+[[X]-X]-F[-FX]+X' },
    angle: 25,
    length: 90,
    lengthRatio: 0.78,
    terminal: 'leaf',
  },
  flower: {
    label: '花卉',
    axiom: 'X',
    rules: { X: 'F[+X]F[-X]FX' },
    angle: 32,
    length: 70,
    lengthRatio: 0.8,
    terminal: 'flower',
  },
  grass: {
    label: '芳草',
    axiom: 'X',
    rules: { X: 'F+XF[+X]F[-X]' },
    angle: 28,
    length: 55,
    lengthRatio: 0.82,
    terminal: 'grass',
  },
  fern: {
    label: '蕨类',
    axiom: 'X',
    rules: { X: 'F[+X][-X]FX' },
    angle: 35,
    length: 65,
    lengthRatio: 0.76,
    terminal: 'leaf',
  },
};

/**
 * 生成一株植物。
 * @returns {{segments, markers, type, depth, order, params}}
 */
export function generatePlant(seed, type = 'tree', depth = 4) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const def = PLANT_DEFS[type] || PLANT_DEFS.tree;
  const segments = [];
  const markers = [];
  let step = 0;

  // 海龟状态
  let x = 0, y = 0;
  let angle = -Math.PI / 2;   // 向上
  const stack = [];

  const forward = (len, w, d) => {
    const nx = x + Math.cos(angle) * len;
    const ny = y + Math.sin(angle) * len;
    segments.push({ x1: x, y1: y, x2: nx, y2: ny, width: w, depth: d, order: step++ });
    x = nx; y = ny;
  };

  const maxD = depth;
  const expand = (symbol, d) => {
    if (symbol === 'F') {
      // 长度与宽度都随深度递减：根部粗壮，梢部纤细
      forward(def.length * Math.pow(def.lengthRatio, Math.max(0, d - 1)) * (0.9 + rng() * 0.2),
        1 + 4 * (d / maxD), d);
      if (d === 0) {
        markers.push({ x, y, type: def.terminal, size: 3 + rng() * 4, order: step++, depth: d });
      }
    } else if (symbol === '+') {
      angle += (def.angle + (rng() - 0.5) * 6) * Math.PI / 180;
    } else if (symbol === '-') {
      angle -= (def.angle + (rng() - 0.5) * 6) * Math.PI / 180;
    } else if (symbol === '[') {
      stack.push({ x, y, angle });
    } else if (symbol === ']') {
      const st = stack.pop();
      if (st) { x = st.x; y = st.y; angle = st.angle; }
    } else if (def.rules[symbol] && d > 0) {
      // 展开规则：仅当深度未耗尽时展开，避免无限递归
      const rule = def.rules[symbol];
      for (const ch of rule) expand(ch, d - 1);
    }
  };

  for (const ch of def.axiom) expand(ch, depth);

  return { segments, markers, type, depth, order: step, params: def };
}

/** 植物包围盒 */
export function plantBounds(plant) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const consider = (px, py) => {
    minX = Math.min(minX, px); maxX = Math.max(maxX, px);
    minY = Math.min(minY, py); maxY = Math.max(maxY, py);
  };
  for (const s of plant.segments) { consider(s.x1, s.y1); consider(s.x2, s.y2); }
  for (const m of plant.markers) consider(m.x, m.y);
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

export const PLANT_TYPES = Object.keys(PLANT_DEFS);
export const PLANT_LABELS = Object.fromEntries(Object.entries(PLANT_DEFS).map(([k, v]) => [k, v.label]));
