/**
 * go.js — 棋境的棋局核心（纯逻辑，可独立测试）
 * 种子裁决一局围棋：棋盘星位与黑白落子，连通块与气数可精确计算。
 */
import { rngFromSeed } from '../../shared/rng.js';

export const BOARD_SIZES = { small: 9, standard: 19, large: 21 };

/** 标准星位坐标（19 路与 13 路通用模板，按棋盘居中） */
const STAR_POINTS_19 = [[3, 3], [3, 9], [3, 15], [9, 3], [9, 9], [9, 15], [15, 3], [15, 9], [15, 15]];
const STAR_POINTS_9 = [[2, 2], [2, 6], [6, 2], [6, 6], [4, 4]];

/**
 * 生成一局棋：星位布子 + 黑白交替的种子落子。
 * @param {number} seed
 * @param {{size?: number}} opts size: 9 | 19 | 21
 */
export function generateGo(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const size = opts.size === 9 ? 9 : opts.size === 21 ? 21 : BOARD_SIZES.standard;
  const starTemplate = size <= 9 ? STAR_POINTS_9 : STAR_POINTS_19.map(([x, y]) =>
    size === 21 ? [x + 1, y + 1] : [x, y]
  );
  const stars = starTemplate.filter(([x, y]) => x < size && y < size);

  // 落子：星位起手，黑白交替向邻近空点扩散，互不重叠
  const stones = [];
  const occupied = new Set();
  const key = (x, y) => `${x},${y}`;
  let color = 'black';
  const seeds = [...stars];
  const moves = Math.min(size * 3, 18 + Math.floor(rng() * 22));
  for (let i = 0; i < moves; i++) {
    // 从已有棋子的邻点中选空点
    const candidates = [];
    for (const s of stones) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = s.x + dx, ny = s.y + dy;
        if (nx >= 0 && ny >= 0 && nx < size && ny < size && !occupied.has(key(nx, ny))) {
          candidates.push([nx, ny]);
        }
      }
    }
    // 开局尚无棋子时，从星位起手（若星位已被占，换一颗星位）
    if (candidates.length === 0 && seeds.length) {
      let placed = null;
      while (seeds.length && !placed) {
        const candidate = seeds.shift();
        if (!occupied.has(key(candidate[0], candidate[1]))) placed = candidate;
      }
      if (!placed) break;
      const [x, y] = placed;
      stones.push({ x, y, color });
      occupied.add(key(x, y));
      color = color === 'black' ? 'white' : 'black';
      continue;
    }
    if (candidates.length === 0) break;
    const [x, y] = candidates[Math.floor(rng() * candidates.length)];
    stones.push({ x, y, color });
    occupied.add(key(x, y));
    color = color === 'black' ? 'white' : 'black';
  }

  return {
    size,
    stars,
    stones,
    stats: {
      moves: stones.length,
      black: stones.filter(s => s.color === 'black').length,
      white: stones.filter(s => s.color === 'white').length,
      stars: stars.length,
    },
  };
}

/** 取某点的连通块（同色四邻连通） */
export function findGroup(stones, x, y) {
  const color = stones.find(s => s.x === x && s.y === y)?.color;
  if (!color) return null;
  const seen = new Set([`${x},${y}`]);
  const stack = [[x, y]];
  const group = [];
  while (stack.length) {
    const [cx, cy] = stack.pop();
    group.push({ x: cx, y: cy });
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      const k = `${nx},${ny}`;
      if (!seen.has(k) && stones.some(s => s.x === nx && s.y === ny && s.color === color)) {
        seen.add(k);
        stack.push([nx, ny]);
      }
    }
  }
  return group;
}

/** 计算连通块的气数（相邻空点数，重合空点只计一次） */
export function groupLiberties(stones, size, x, y) {
  const group = findGroup(stones, x, y);
  if (!group) return 0;
  const libs = new Set();
  for (const s of group) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = s.x + dx, ny = s.y + dy;
      if (nx >= 0 && ny >= 0 && nx < size && ny < size && !stones.some(o => o.x === nx && o.y === ny)) {
        libs.add(`${nx},${ny}`);
      }
    }
  }
  return libs.size;
}
