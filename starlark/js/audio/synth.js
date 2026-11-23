/**
 * synth.js — 声部合成器
 * 每个声部都是"即建即毁"的微型合成器：触发时创建节点、
 * 以包络塑形、结束后自动回收，避免节点泄漏。
 * 所有声部共享三条总线：干声 / 混响发送 / 延迟发送。
 */
import { midiToFreq } from './composition.js';

/** 一个轻量增益包络助手 */
function env(gainNode, t0, peak, attack, hold, release, ctx) {
  const g = gainNode.gain;
  const relStart = t0 + attack + hold;
  g.cancelScheduledValues(t0);
  g.setValueAtTime(0.0001, t0);
  g.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + attack);
  g.setValueAtTime(Math.max(peak, 0.0002), relStart);
  g.exponentialRampToValueAtTime(0.0001, relStart + release);
  // 安全回收
  setTimeout(() => { try { gainNode.disconnect(); } catch { /* 已断开 */ } }, (relStart - t0 + release + 0.2) * 1000);
}

/** 带低通的振荡器工厂 */
function osc(ctx, type, freq) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  return o;
}

/**
 * 发送电平：为某声部创建独立增益节点再送入效果总线，
 * 避免直接写总线的共享 gain（connect() 无返回值，不能链式赋值）。
 */
function sendLevel(ctx, from, to, level) {
  const g = ctx.createGain();
  g.gain.value = level;
  from.connect(g);
  g.connect(to);
}

/* ------------------------------------------------------------------ *
 * Pad —— 厚涂铺底：多个失谐振荡器 + 慢速滤波 LFO
 * ------------------------------------------------------------------ */
export function playPad(ctx, bus, note, dur, level, brightness) {
  const t0 = ctx.currentTime;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400 + brightness * 2600;
  filter.Q.value = 0.6;

  // 滤波 LFO：让音色缓慢呼吸
  const lfo = osc(ctx, 'sine', 0.05);
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = filter.frequency.value * 0.25;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);

  const out = ctx.createGain();
  env(out, t0, level, Math.min(1.6, dur * 0.5), Math.max(0.4, dur * 0.3), 2.6, ctx);
  filter.connect(out);

  const detunes = [-7, 0, 0, 6];
  const types = ['sawtooth', 'triangle', 'triangle', 'sine'];
  detunes.forEach((d, i) => {
    const o = osc(ctx, types[i], note);
    o.detune.value = d;
    const g = ctx.createGain();
    g.gain.value = i === 0 ? 0.28 : 0.18;
    o.connect(g);
    g.connect(filter);
    o.start(t0);
    o.stop(t0 + dur + 4);
  });
  lfo.start(t0); lfo.stop(t0 + dur + 4);

  out.connect(bus.dry);
  sendLevel(ctx, out, bus.reverb, level * 0.5);
  out.connect(bus.delay);
}

/* ------------------------------------------------------------------ *
 * Bell / Pluck —— 钟磬琶音：正弦主体 + 高频泛音，指数衰减
 * ------------------------------------------------------------------ */
export function playBell(ctx, bus, note, level, brightness) {
  const t0 = ctx.currentTime;
  const out = ctx.createGain();
  env(out, t0, level, 0.005, 0.05, 2.2, ctx);

  const fundamental = osc(ctx, 'sine', note);
  fundamental.connect(out);

  // 非谐泛音，模拟金属钟的质感
  const partials = [[3.01, 0.22], [5.1, 0.1], [7.2, 0.06]];
  partials.forEach(([mult, amp]) => {
    const p = osc(ctx, 'sine', note * mult);
    const g = ctx.createGain();
    g.gain.value = amp * (0.4 + brightness * 0.6);
    p.connect(g); g.connect(out);
    p.start(t0); p.stop(t0 + 3.2);
  });
  fundamental.start(t0); fundamental.stop(t0 + 3.2);

  out.connect(bus.dry);
  sendLevel(ctx, out, bus.reverb, level * 0.8);
  sendLevel(ctx, out, bus.delay, level * 0.35);
}

/* ------------------------------------------------------------------ *
 * Bass —— 柔和的低通贝斯，随底鼓"侧链"抽吸
 * ------------------------------------------------------------------ */
export function playBass(ctx, bus, note, level, brightness, duckSignal) {
  const t0 = ctx.currentTime;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 200 + brightness * 700;

  const o = osc(ctx, 'triangle', note);
  const sub = osc(ctx, 'sine', note / 2);
  const g = ctx.createGain();
  env(g, t0, level, 0.05, 0.15, 0.5, ctx);
  o.connect(g); sub.connect(g);
  g.connect(filter);
  filter.connect(bus.dry);

  // 侧链：底鼓触发时音量下沉
  if (duckSignal) {
    const duck = ctx.createGain();
    duck.gain.value = 1;
    duckSignal.connect(duck);
    duck.connect(g.gain);
  }
  o.start(t0); o.stop(t0 + 1.2);
  sub.start(t0); sub.stop(t0 + 1.2);
}

/* ------------------------------------------------------------------ *
 * Kick —— 正弦扫频底鼓
 * ------------------------------------------------------------------ */
export function playKick(ctx, bus, level) {
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'sine';
  const g = ctx.createGain();
  const f = o.frequency;
  f.setValueAtTime(160, t0);
  f.exponentialRampToValueAtTime(48, t0 + 0.11);
  g.gain.setValueAtTime(level, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.42);
  o.connect(g);
  g.connect(bus.dry);
  sendLevel(ctx, g, bus.reverb, level * 0.25);
  o.start(t0); o.stop(t0 + 0.5);
  return g; // 返回增益节点，供侧链压控连接
}

/* ------------------------------------------------------------------ *
 * Hat —— 滤波噪声的高频打击
 * ------------------------------------------------------------------ */
export function playHat(ctx, bus, level) {
  const t0 = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * 0.08);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7000;
  const g = ctx.createGain();
  g.gain.setValueAtTime(level, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.06);
  src.connect(hp); hp.connect(g);
  g.connect(bus.dry);
  sendLevel(ctx, g, bus.reverb, level * 0.4);
  src.start(t0);
}

/* ------------------------------------------------------------------ *
 * Lead —— 旋律声部：柔和的三角波 + 轻微失谐，呼吸感包络
 * ------------------------------------------------------------------ */
export function playLead(ctx, bus, note, level, brightness) {
  const t0 = ctx.currentTime;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 700 + brightness * 3500;

  const o1 = osc(ctx, 'triangle', note);
  const o2 = osc(ctx, 'sine', note);
  o2.detune.value = 8;
  const g = ctx.createGain();
  env(g, t0, level, 0.06, 0.08, 0.8, ctx);
  o1.connect(g); o2.connect(g);
  g.connect(filter);
  filter.connect(bus.dry);
  sendLevel(ctx, filter, bus.reverb, level * 0.6);
  sendLevel(ctx, filter, bus.delay, level * 0.3);
  o1.start(t0); o1.stop(t0 + 1.6);
  o2.start(t0); o2.stop(t0 + 1.6);
}

/* ------------------------------------------------------------------ *
 * Shimmer —— 氛围颗粒：短噪声经共振滤波，形成"空气感"
 * 入参 note 为 MIDI 音符号，滤波中心置于其上两个八度
 * ------------------------------------------------------------------ */
export function playShimmer(ctx, bus, note, level) {
  const t0 = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * 1.2);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = midiToFreq(note + 24);
  bp.Q.value = 6;
  const g = ctx.createGain();
  env(g, t0, level, 0.3, 0.3, 0.9, ctx);
  src.connect(bp); bp.connect(g);
  sendLevel(ctx, g, bus.reverb, level);
  src.start(t0); src.stop(t0 + 2.4);
}
