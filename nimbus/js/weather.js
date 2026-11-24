/**
 * weather.js — 云图的天气核心（纯逻辑，可独立测试）
 * 种子决定一片天：云量、雨势、闪电频率、风力与天光色调。
 * 风格有四：晨雾、夜雨、暮霞、雪云。
 */
import { rngFromSeed, clamp } from '../../shared/rng.js';

export const WEATHER_STYLES = {
  mist: {
    label: '晨雾',
    sky: ['#2a3548', '#4a5a72', '#7a8aa0', '#b8c4d4'],
    cloud: 'rgba(220, 228, 240, 0.5)',
    rainRate: 0,
    lightningRate: 0,
    snow: false,
  },
  rain: {
    label: '夜雨',
    sky: ['#0a0f1e', '#16203a', '#243456', '#3a4f78'],
    cloud: 'rgba(120, 140, 180, 0.55)',
    rainRate: 0.85,
    lightningRate: 0.5,
    snow: false,
  },
  dusk: {
    label: '暮霞',
    sky: ['#1c1030', '#4a2058', '#a04a78', '#e08a6a'],
    cloud: 'rgba(255, 170, 140, 0.45)',
    rainRate: 0.15,
    lightningRate: 0.05,
    snow: false,
  },
  snow: {
    label: '雪云',
    sky: ['#1a2230', '#33425a', '#5a6f8a', '#9fb0c4'],
    cloud: 'rgba(220, 230, 245, 0.6)',
    rainRate: 0,
    lightningRate: 0.1,
    snow: true,
  },
};

/**
 * 生成一片天气。
 * @returns {{style, cloudSeed, rainRate, lightningRate, wind, snow, sky, cloudColor}}
 */
export function generateWeather(seed, styleKey = null) {
  const rng = rngFromSeed((seed >>> 0) || 1);
  const styles = Object.keys(WEATHER_STYLES);
  const key = styleKey && WEATHER_STYLES[styleKey] ? styleKey : styles[Math.floor(rng() * styles.length)];
  const S = WEATHER_STYLES[key];
  // 云场种子同时由种子与风格决定：同种子换风格，云也不同
  const styleSalt = Math.imul(styles.indexOf(key) + 1, 0x9e3779b1) >>> 0;
  return {
    style: key,
    styleLabel: S.label,
    cloudSeed: (((seed >>> 0) ^ styleSalt ^ 0x51ed270b) >>> 0),
    // 在风格基调上以种子微调强度
    rainRate: clamp(S.rainRate + (rng() - 0.5) * 0.2, 0, 1),
    lightningRate: clamp(S.lightningRate + (rng() - 0.5) * 0.2, 0, 1),
    wind: clamp(0.2 + rng() * 1.2, 0.1, 1.5),
    snow: S.snow,
    sky: S.sky,
    cloudColor: S.cloud,
  };
}

/** 由种子构造确定性值噪声（云场用） */
export function makeNoiseField(seed, w, h) {
  let s = (seed >>> 0) || 1;
  const hash = (x, y) => {
    let hh = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2246822519)) | 0;
    hh = Math.imul(hh ^ (hh >>> 13), 1274126177);
    hh = hh ^ (hh >>> 16);
    return (hh >>> 0) / 4294967296;
  };
  const field = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // 双线性插值 + 分形叠加
      const xi = Math.floor(x / 4), yi = Math.floor(y / 4);
      const xf = x / 4 - xi, yf = y / 4 - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      let val = (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
      // 叠加一层细噪，云有絮状层次
      val = val * 0.7 + hash(x * 2, y * 2) * 0.3;
      field[y * w + x] = val;
    }
  }
  return field;
}
