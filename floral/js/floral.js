/**
 * floral.js — 花相的花艺核心（纯逻辑，可独立测试）
 * 种子裁决一席瓶花：花材、三主构图（主枝、客枝、使枝）、花量与配色。
 * 构图遵循「高低错落、疏密有致」：主枝最高，客枝次之，使枝收势。
 */
import { rngFromSeed } from '../../shared/rng.js';

/** 花材词典：名称、花色、花型 */
export const FLOWER_MATERIALS = {
  plum: { label: '梅', colors: ['#e07a8c', '#f0a8b8', '#c85a6a'], form: 'dot' },
  orchid: { label: '兰', colors: ['#a8b8d8', '#c8d8f0', '#8898c0'], form: 'petal' },
  bamboo: { label: '竹', colors: ['#6a9a6a', '#8ab88a', '#4a7a4a'], form: 'leaf' },
  chrysanthemum: { label: '菊', colors: ['#e8c86a', '#f0d88a', '#d8a83a'], form: 'petal' },
  lotus: { label: '荷', colors: ['#f0b8c8', '#f8d0dc', '#e090a8'], form: 'petal' },
  peony: { label: '牡丹', colors: ['#d86a8a', '#e890a8', '#c84a6a'], form: 'petal' },
  vine: { label: '藤', colors: ['#9ab07a', '#b8c89a', '#7a985a'], form: 'leaf' },
};

export const VESSELS = {
  vase: { label: '瓶', shape: 'vase' },
  jar: { label: '罐', shape: 'jar' },
  basket: { label: '篮', shape: 'basket' },
};

/**
 * 生成一席花艺。
 * @param {number} seed
 * @param {{vessel?: string, materials?: number}} opts
 */
export function generateFloral(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const vesselKeys = Object.keys(VESSELS);
  const vessel = opts.vessel && VESSELS[opts.vessel] ? opts.vessel : vesselKeys[Math.floor(rng() * vesselKeys.length)];

  const matKeys = Object.keys(FLOWER_MATERIALS);
  // 选 2~4 种花材
  const matCount = Math.min(4, Math.max(2, opts.materials ?? 2 + Math.floor(rng() * 2)));
  const chosen = [];
  const pool = [...matKeys];
  for (let i = 0; i < matCount && pool.length; i++) {
    chosen.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }

  // 三主构图：主枝（最高）、客枝（次之）、使枝（收势）
  const roles = [
    { role: 'main', height: 0.55 + rng() * 0.25, spread: 0.1 + rng() * 0.1 },
    { role: 'guest', height: 0.35 + rng() * 0.18, spread: 0.15 + rng() * 0.15 },
    { role: 'envoy', height: 0.2 + rng() * 0.14, spread: 0.2 + rng() * 0.12 },
  ];

  const stems = [];
  roles.forEach((r, i) => {
    const mat = FLOWER_MATERIALS[chosen[i % chosen.length]];
    stems.push({
      role: r.role,
      material: chosen[i % chosen.length],
      materialLabel: mat.label,
      angle: (r.role === 'main' ? -0.1 : r.role === 'guest' ? 0.35 + rng() * 0.3 : 0.6 + rng() * 0.35) * (rng() < 0.5 ? 1 : -1),
      height: r.height,
      spread: r.spread,
      flowers: r.role === 'envoy' ? 1 + Math.floor(rng() * 2) : 2 + Math.floor(rng() * 4),
      color: mat.colors[Math.floor(rng() * mat.colors.length)],
      form: mat.form,
    });
  });

  // 辅枝：主枝与客枝之间补枝
  const fillers = [];
  const fillerCount = Math.floor(rng() * 3);
  for (let i = 0; i < fillerCount; i++) {
    const mi = Math.floor(rng() * chosen.length);
    const mat = FLOWER_MATERIALS[chosen[mi]];
    fillers.push({
      material: chosen[mi],
      materialLabel: mat.label,
      angle: rng() * 1.4 - 0.7,
      height: 0.25 + rng() * 0.3,
      spread: 0.1 + rng() * 0.15,
      flowers: 1 + Math.floor(rng() * 3),
      color: mat.colors[Math.floor(rng() * mat.colors.length)],
      form: mat.form,
      role: 'filler',
    });
  }

  const totalFlowers = [...stems, ...fillers].reduce((a, s) => a + s.flowers, 0);
  return {
    vessel,
    vesselLabel: VESSELS[vessel].label,
    vesselShape: VESSELS[vessel].shape,
    stems,
    fillers,
    materials: chosen.map(k => FLOWER_MATERIALS[k].label),
    stats: {
      stems: stems.length,
      fillers: fillers.length,
      flowers: totalFlowers,
      materials: chosen.length,
      mainHeight: stems.find(s => s.role === 'main').height,
    },
  };
}
