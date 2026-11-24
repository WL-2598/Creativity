/**
 * pulse.js — 脉境的脉动核心（纯逻辑，可独立测试）
 * 种子裁决一张脉动网络：节点有固有节律，脉冲沿边传播，如心跳与神经。
 */
import { rngFromSeed } from '../../shared/rng.js';

/**
 * 生成一张脉动网络。
 * @param {number} seed
 * @param {{nodes?: number, edges?: number, speed?: number}} opts
 */
export function generatePulseNet(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const count = Math.min(48, Math.max(6, opts.nodes ?? 12 + Math.floor(rng() * 24)));
  const speed = opts.speed ?? 0.4 + rng() * 0.8;   // 脉冲传播速度
  const maxEdges = Math.max(count, Math.round(count * (opts.edges ?? 2)));

  // 节点：位置散布，固有频率（每分钟节拍）与相位
  const nodes = [];
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: 0.1 + rng() * 0.8,
      y: 0.1 + rng() * 0.8,
      freq: 30 + rng() * 90,        // 每分钟节拍
      phase: rng() * Math.PI * 2,
      size: 1.5 + rng() * 2,
    });
  }

  // 边：先建近邻图保证连通，再随机补边
  const edges = buildNetwork(rng, nodes, maxEdges);

  // 传播时延：距离 / 速度
  for (const e of edges) {
    e.delay = Math.hypot(nodes[e.a].x - nodes[e.b].x, nodes[e.a].y - nodes[e.b].y) / speed;
  }

  const totalDelay = edges.reduce((a, e) => a + e.delay, 0);
  return {
    nodes,
    edges,
    speed,
    stats: {
      nodes: nodes.length,
      edges: edges.length,
      connectivity: edgeConnectivity(nodes.length, edges),
      avgDelay: totalDelay / Math.max(1, edges.length),
      avgFreq: nodes.reduce((a, n) => a + n.freq, 0) / nodes.length,
    },
  };
}

/** 近邻图：每个节点连接最近的几个节点，保证整体连通 */
function buildNetwork(rng, nodes, maxEdges) {
  const parent = nodes.map((_, i) => i);
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  const union = (a, b) => { const ra = find(a), rb = find(b); if (ra === rb) return false; parent[ra] = rb; return true; };

  const candidate = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      candidate.push({ a: i, b: j, d: Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) });
    }
  }
  candidate.sort((x, y) => x.d - y.d);

  const edges = [];
  const seen = new Set();
  const add = (e) => {
    const key = `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    edges.push({ a: e.a, b: e.b, d: e.d });
    return true;
  };
  // 最小生成树保连通
  for (const e of candidate) if (edges.length < nodes.length - 1 && union(e.a, e.b)) add(e);
  // 补边到目标密度（不超 maxEdges）
  for (const e of candidate) {
    if (edges.length >= maxEdges) break;
    add(e);
  }
  // 兜底：确保每点至少一条边
  for (let i = 0; i < nodes.length; i++) {
    if (!edges.some(e => e.a === i || e.b === i)) {
      const best = candidate.filter(e => e.a === i || e.b === i)[0];
      if (best) add(best);
    }
  }
  return edges;
}

function edgeConnectivity(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const e of edges) { adj[e.a].push(e.b); adj[e.b].push(e.a); }
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const v = stack.pop();
    for (const w of adj[v]) if (!seen.has(w)) { seen.add(w); stack.push(w); }
  }
  return seen.size === n;
}
