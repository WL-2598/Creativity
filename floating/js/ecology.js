/**
 * ecology.js — 浮生的生态核心（纯逻辑，可独立测试）
 * 一个装在瓶中的二维生态：浮游生物、游鱼、水草。
 * 它们在光照下生长、捕食、群游、繁衍与死亡，涌现出生机。
 * 位置使用归一化坐标 [0,1]²，渲染层负责缩放。
 */
import { rngFromSeed, randInt, clamp } from '../../shared/rng.js';

export const ORG_PLANKTON = 'plankton';
export const ORG_FISH = 'fish';
export const ORG_PLANT = 'plant';

/* 流场：由位置决定的确定性流动，模拟水中的缓流 */
function flow(x, y, t) {
  return [
    Math.sin(y * 6.2 + t * 0.3) * 0.6,
    Math.cos(x * 6.2 - t * 0.2) * 0.6,
  ];
}

/**
 * 创建生态初始状态。
 * @param {number} seed 种子
 * @param {{fish:number, plankton:number, plant:number}} counts 初始数量
 */
export function createEcosystem(seed, counts = { fish: 4, plankton: 40, plant: 6 }) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const organisms = [];
  const spawn = (type, x, y, energy) => organisms.push({
    type, x, y, vx: (rng() - 0.5) * 0.05, vy: (rng() - 0.5) * 0.05,
    energy, age: 0, phase: rng() * Math.PI * 2, size: 1,
  });
  for (let i = 0; i < counts.fish; i++) {
    spawn(ORG_FISH, 0.2 + rng() * 0.6, 0.25 + rng() * 0.55, 0.55 + rng() * 0.25);
  }
  for (let i = 0; i < counts.plankton; i++) {
    spawn(ORG_PLANKTON, rng() * 0.8 + 0.1, rng() * 0.7 + 0.15, 0.3 + rng() * 0.2);
  }
  for (let i = 0; i < counts.plant; i++) {
    spawn(ORG_PLANT, 0.12 + rng() * 0.76, 0.88, 0.4 + rng() * 0.3);
  }
  return {
    organisms,
    t: 0,
    light: 0.6,
    maxPop: 260,
    stats: { fish: counts.fish, plankton: counts.plankton, plant: counts.plant },
  };
}

/**
 * 推进一帧生态。
 * @param {object} state 生态状态
 * @param {{light:number, perturb:{x:number,y:number,strength:number}|null}} params 光照与扰动
 * @param {number} dt 时间步
 */
export function stepEcosystem(state, params, dt) {
  const { organisms } = state;
  const light = params.light ?? 0.6;
  const t = state.t;
  const perturb = params.perturb;
  state.stats = { fish: 0, plankton: 0, plant: 0 };

  for (const o of organisms) {
    o.age += dt;
    if (o.type === ORG_PLANT) {
      // 水草：光照下生长，无光则枯萎
      o.energy = clamp(o.energy + (light * 0.06 - 0.018) * dt, 0, 1.4);
      o.phase += dt * 1.2;
      o.size = clamp(0.6 + o.energy * 0.8, 0.6, 1.6);
      state.stats.plant++;
      continue;
    }

    if (o.type === ORG_PLANKTON) {
      // 浮游：随流漂移，缓慢耗能，光下微生
      const [fx, fy] = flow(o.x, o.y, t);
      o.vx += (fx * 0.06 - o.vx * 0.9) * dt * 6;
      o.vy += (fy * 0.06 - o.vy * 0.9) * dt * 6;
      o.energy = clamp(o.energy + light * dt * 0.012 - dt * 0.02, 0, 1.2);
      o.x += o.vx * dt * 6;
      o.y += o.vy * dt * 6;
      // 边界回卷（水体环流）
      if (o.x < 0.03) o.x = 0.97; if (o.x > 0.97) o.x = 0.03;
      if (o.y < 0.12) o.vy += 0.01; if (o.y > 0.92) o.vy -= 0.01;
      o.y = clamp(o.y, 0.1, 0.94);
      state.stats.plankton++;
      continue;
    }

    // 游鱼：觅食、群游、避墙
    if (o.type === ORG_FISH) {
      // 寻找最近的浮游
      let best = null, bestD = 0.09;
      for (const p of organisms) {
        if (p.type !== ORG_PLANKTON) continue;
        const d = Math.hypot(p.x - o.x, p.y - o.y);
        if (d < bestD) { bestD = d; best = p; }
      }
      let ax = 0, ay = 0;
      if (best) {
        ax = (best.x - o.x); ay = (best.y - o.y);
        const dl = Math.hypot(ax, ay) || 1;
        ax /= dl; ay /= dl;
        o.energy = clamp(o.energy + dt * 0.08, 0, 1.4);
        // 捕食：距离足够近则吞食
        if (bestD < 0.012) {
          best.energy = -1;   // 标记移除
          o.energy = clamp(o.energy + 0.18, 0, 1.4);
        }
      }
      // 群游：邻近鱼的对齐
      let axN = 0, ayN = 0, nN = 0;
      for (const f of organisms) {
        if (f === o || f.type !== ORG_FISH) continue;
        if (Math.hypot(f.x - o.x, f.y - o.y) < 0.07) {
          axN += f.vx; ayN += f.vy; nN++;
        }
      }
      if (nN > 0) { ax += axN / nN * 0.8; ay += ayN / nN * 0.8; }
      // 避墙
      const margin = 0.06;
      if (o.x < margin) ax += 0.5; if (o.x > 1 - margin) ax -= 0.5;
      if (o.y < margin + 0.06) ay += 0.4; if (o.y > 0.94) ay -= 0.4;
      // 扰动（水流）
      if (perturb) {
        const dx = o.x - perturb.x, dy = o.y - perturb.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 0.3) { ax += (dx / d) * perturb.strength; ay += (dy / d) * perturb.strength; }
      }
      const al = Math.hypot(ax, ay) || 1;
      o.vx = clamp(o.vx * 0.94 + (ax / al) * 0.05, -0.05, 0.05);
      o.vy = clamp(o.vy * 0.94 + (ay / al) * 0.05, -0.05, 0.05);
      o.x = clamp(o.x + o.vx * dt * 6, 0.04, 0.96);
      o.y = clamp(o.y + o.vy * dt * 6, 0.12, 0.93);
      o.energy = clamp(o.energy - dt * 0.01, 0, 1.4);
      // 靠近水草时缓回能量（栖息）
      for (const p of organisms) {
        if (p.type === ORG_PLANT && Math.hypot(p.x - o.x, p.y - o.y) < 0.05) {
          o.energy = clamp(o.energy + dt * 0.01, 0, 1.4);
          break;
        }
      }
      state.stats.fish++;
    }
  }

  // 繁衍与死亡
  const survivors = [];
  for (const o of organisms) {
    if (o.energy <= 0 || o.age > 60) continue;
    survivors.push(o);
    if (survivors.length >= state.maxPop) break;
  }
  state.organisms = survivors;

  // 繁殖（数量低于上限时；食物链能量由光照驱动，无光则停止繁衍）
  const rng = state._rng;
  const canReproduce = light > 0.15;
  if (state.organisms.length < state.maxPop && canReproduce) {
    for (const o of state.organisms) {
      if (o.type === ORG_FISH && o.energy > 1.0 && rng() < dt * 0.15) {
        state.organisms.push({ ...o, x: o.x + (rng() - 0.5) * 0.05, y: o.y + (rng() - 0.5) * 0.05,
          vx: (rng() - 0.5) * 0.03, vy: (rng() - 0.5) * 0.03, energy: 0.5, age: 0, phase: rng() * 6.28, size: 0.8 });
      }
      if (o.type === ORG_PLANKTON && o.energy > 0.9 && rng() < dt * 0.25) {
        state.organisms.push({ ...o, x: o.x + (rng() - 0.5) * 0.04, y: o.y + (rng() - 0.5) * 0.04,
          vx: (rng() - 0.5) * 0.02, vy: (rng() - 0.5) * 0.02, energy: 0.4, age: 0, phase: rng() * 6.28, size: 0.8 });
      }
      if (state.organisms.length >= state.maxPop) break;
    }
  }
  state.t += dt;
  return state.stats;
}

/** 为生态绑定种子随机（繁殖用） */
export function bindRng(state, seed) {
  state._rng = rngFromSeed((seed >>> 0) || 1);
  return state;
}

export { randInt };
