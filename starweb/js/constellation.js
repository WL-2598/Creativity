/**
 * constellation.js — 织星的星网核心（纯逻辑，可独立测试）
 * 种子裁决一片星空：星点位置、亮度与命名，并以最小生成树连成星座网。
 */
import { rngFromSeed } from '../../shared/rng.js';

/** 二十八星官命名，用于给星座命名 */
export const STAR_OFFICES = [
  '紫微', '天市', '太微', '少微', '天枢', '天璇', '天玑', '天权',
  '玉衡', '开阳', '摇光', '天狼', '参宿', '心宿', '尾宿', '箕宿',
  '斗宿', '牛宿', '女宿', '虚宿', '危宿', '室宿', '壁宿', '奎宿',
  '娄宿', '胃宿', '昴宿', '毕宿', '觜宿', '井宿', '鬼宿', '柳宿',
  '星宿', '张宿', '翼宿', '轸宿',
];

/**
 * 生成一片星网。
 * @param {number} seed
 * @param {{stars?: number, link?: number}} opts stars: 星点数；link: 连网密度（每点最多连出的边数）
 */
export function generateStarfield(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const count = Math.min(90, Math.max(8, opts.stars ?? 20 + Math.floor(rng() * 40)));

  // 星点：位置散布，亮度分等，命名取自星官
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rng(),
      y: rng(),
      size: 0.6 + rng() * 2.2,
      bright: Math.floor(rng() * 4),   // 0~3 等亮度
      phase: rng() * Math.PI * 2,      // 闪烁相位
      name: STAR_OFFICES[Math.floor(rng() * STAR_OFFICES.length)],
    });
  }

  // 连线：以星为顶点建完全图，取最小生成树（Kruskal），再按密度追加近邻边
  const edges = buildConstellation(stars, opts.link ?? 1);

  // 星座命名：取被连边最多的星官为该片星网之名
  const usage = {};
  for (const e of edges) {
    for (const s of [stars[e.a], stars[e.b]]) usage[s.name] = (usage[s.name] || 0) + 1;
  }
  const ranked = Object.entries(usage).sort((a, b) => b[1] - a[1]);
  const name = ranked.length ? ranked[0][0] : '孤星';

  // 统计：平均星等、连通性（生成树保证全部连通）
  const avgBright = stars.reduce((a, s) => a + s.bright, 0) / stars.length;
  return {
    stars,
    edges,
    name,
    stats: {
      stars: stars.length,
      edges: edges.length,
      avgBrightness: avgBright,
      connected: isConnected(stars, edges),
    },
  };
}

/** Kruskal 最小生成树：所有星点连通且无环，再按密度补近邻边 */
function buildConstellation(stars, linkDensity) {
  const parent = stars.map((_, i) => i);
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra === rb) return false; parent[ra] = rb; return true; };

  const all = [];
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      all.push({ a: i, b: j, d: dist(stars[i], stars[j]) });
    }
  }
  all.sort((x, y) => x.d - y.d);

  const edges = [];
  for (const e of all) {
    if (edges.length >= stars.length * 1.6) break;
    if (union(e.a, e.b)) edges.push({ a: e.a, b: e.b, d: e.d });
  }
  // 密度补边：为每点补最近的 linkDensity-1 条非树边（不引入新连通分量即可）
  if (linkDensity > 1) {
    const inTree = new Set(edges.map(e => `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`));
    const byNode = Array.from({ length: stars.length }, () => []);
    for (const e of all) {
      byNode[e.a].push(e);
      byNode[e.b].push(e);
    }
    for (let i = 0; i < stars.length; i++) {
      let added = 0;
      for (const e of byNode[i]) {
        if (added >= linkDensity - 1) break;
        const key = `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`;
        if (inTree.has(key)) continue;
        inTree.add(key);
        edges.push({ a: e.a, b: e.b, d: e.d });
        added++;
      }
    }
  }
  return edges;
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** 图连通性：从节点 0 出发能否访问全部 */
function isConnected(stars, edges) {
  if (stars.length === 0) return true;
  const adj = Array.from({ length: stars.length }, () => []);
  for (const e of edges) { adj[e.a].push(e.b); adj[e.b].push(e.a); }
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const v = stack.pop();
    for (const w of adj[v]) if (!seen.has(w)) { seen.add(w); stack.push(w); }
  }
  return seen.size === stars.length;
}
