/**
 * tide.js — 潮汐的天文核心（纯逻辑，可独立测试）
 * 种子裁决一处海域：月相、月轮位置、半日潮位曲线与浪况。
 */
import { rngFromSeed } from '../../shared/rng.js';

/** 半日潮周期（小时）与日周期（小时） */
export const TIDE_PERIODS = { semidiurnal: 12.4, diurnal: 24 };

export const TIDE_SEASONS = {
  spring: { label: '大潮', amplitude: 1.0 },   // 朔望大潮
  neap: { label: '小潮', amplitude: 0.6 },      // 上下弦小潮
  mixed: { label: '混合潮', amplitude: 0.8 },
};

/**
 * 生成一处潮汐场景。
 * @param {number} seed
 * @param {{season?: string, hours?: number}} opts hours: 潮位曲线采样时长（小时）
 */
export function generateTide(seed, opts = {}) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const seasons = Object.keys(TIDE_SEASONS);
  const season = opts.season && TIDE_SEASONS[opts.season] ? opts.season : seasons[Math.floor(rng() * seasons.length)];
  const S = TIDE_SEASONS[season];

  // 月相：0=朔（新月）0.5=望（满月）
  const phase = rng();
  // 月亮在天幕的位置（避开过低）
  const moon = {
    x: 0.2 + rng() * 0.6,
    y: 0.12 + rng() * 0.35,
    r: 22 + rng() * 18,
  };

  // 潮位振幅：大潮大、小潮小，种子微调
  const amp = (0.5 + rng() * 0.5) * S.amplitude;
  const hours = Math.max(6, Math.min(72, opts.hours ?? 48));

  // 潮位曲线：半日潮主项 + 日潮分项
  const tide = [];
  for (let h = 0; h <= hours; h += 0.5) {
    const semi = Math.cos((2 * Math.PI * h) / TIDE_PERIODS.semidiurnal);
    const daily = 0.35 * Math.cos((2 * Math.PI * h) / TIDE_PERIODS.diurnal);
    tide.push({ t: h, level: amp * (semi + daily * 0.5) });
  }

  // 浪况
  const waves = {
    amp: 4 + rng() * 14,
    freq: 0.02 + rng() * 0.05,
    speed: 0.6 + rng() * 1.4,
    sharp: 0.4 + rng() * 0.6,
  };

  const maxTide = Math.max(...tide.map(p => p.level));
  const minTide = Math.min(...tide.map(p => p.level));
  return {
    season,
    seasonLabel: S.label,
    phase,
    moon,
    tide,
    waves,
    stats: {
      season: season,
      phase: phase,
      hours: hours,
      samples: tide.length,
      maxTide,
      minTide,
      range: maxTide - minTide,
      isSpring: S.amplitude >= 0.95,
    },
  };
}
