import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWeather, makeNoiseField, WEATHER_STYLES } from '../nimbus/js/weather.js';

test('云图：同种子 => 同一片天（确定性）', () => {
  const a = generateWeather(12345);
  const b = generateWeather(12345);
  assert.equal(a.style, b.style);
  assert.equal(a.cloudSeed, b.cloudSeed);
  assert.equal(a.rainRate, b.rainRate);
  assert.equal(a.lightningRate, b.lightningRate);
  assert.equal(a.wind, b.wind);
  assert.deepEqual(a.sky, b.sky);
});

test('云图：四种天候风格参数合法', () => {
  for (const key of Object.keys(WEATHER_STYLES)) {
    const w = generateWeather(777, key);
    assert.equal(w.style, key);
    assert.ok(w.rainRate >= 0 && w.rainRate <= 1, '雨势应在 0~1');
    assert.ok(w.lightningRate >= 0 && w.lightningRate <= 1, '闪电频率应在 0~1');
    assert.ok(w.wind > 0, '风力为正');
    assert.equal(w.snow, WEATHER_STYLES[key].snow);
    assert.equal(w.sky.length, 4);
  }
});

test('云图：不同种子 => 云场种子不同', () => {
  const a = generateWeather(1);
  const b = generateWeather(2);
  assert.notEqual(a.cloudSeed, b.cloudSeed);
});

test('云图：同种子换风格 => 云场种子随风格变化', () => {
  const a = generateWeather(999, 'rain');
  const b = generateWeather(999, 'mist');
  assert.equal(a.style, 'rain');
  assert.equal(b.style, 'mist');
  assert.notEqual(a.cloudSeed, b.cloudSeed);
});

test('云图：夜雨多雨、晨雾无雨，基调成立', () => {
  const rain = generateWeather(42, 'rain');
  const mist = generateWeather(42, 'mist');
  assert.ok(rain.rainRate > 0.5, '夜雨应有明显雨势');
  assert.ok(mist.rainRate < 0.2, '晨雾应几乎无雨');
  assert.ok(rain.lightningRate > 0.3, '夜雨应偶有闪电');
});

test('云图：云场噪声确定且数值有限', () => {
  const f1 = makeNoiseField(31415, 40, 24);
  const f2 = makeNoiseField(31415, 40, 24);
  assert.equal(f1.length, 40 * 24);
  assert.deepEqual(Array.from(f1), Array.from(f2));
  for (const v of f1) {
    assert.ok(Number.isFinite(v), '噪声值应有限');
    assert.ok(v >= 0 && v < 1, '噪声值应在 [0,1)');
  }
});

test('云图：不同云场种子 => 噪声场不同', () => {
  const f1 = makeNoiseField(101, 30, 20);
  const f2 = makeNoiseField(202, 30, 20);
  let diff = 0;
  for (let i = 0; i < f1.length; i++) if (Math.abs(f1[i] - f2[i]) > 0.05) diff++;
  assert.ok(diff > 50, '云场种子不同应产生明显差异');
});
