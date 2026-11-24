/**
 * effects.js — 效果链：生成式卷积混响、乒乓延迟、母带压缩与软限幅
 * 全部由代码生成，无外部资源。
 */

/**
 * 生成脉冲响应（IR）：指数衰减的噪声，叠加若干回声层，
 * 由种子决定衰减与色彩，让每颗种子拥有自己的"空间"。
 */
export function createImpulseResponse(ctx, duration = 4.5, seed = 1) {
  const rate = ctx.sampleRate;
  const length = Math.floor(duration * rate);
  const ir = ctx.createBuffer(2, length, rate);
  let a = (seed >>> 0) || 1;
  const rnd = () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let ch = 0; ch < 2; ch++) {
    const data = ir.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      // 指数衰减包络 + 噪声纹理，前段加一点"空气"滤波
      const env = Math.pow(1 - i / length, 2.2);
      data[i] = (rnd() * 2 - 1) * env;
    }
    // 叠加稀疏回声层，增加空间层次
    const taps = 3 + Math.floor(rnd() * 3);
    for (let t = 0; t < taps; t++) {
      const pos = Math.floor(rnd() * length * 0.7) + length * 0.1;
      const amp = 0.25 * Math.pow(0.6, t);
      for (let i = Math.floor(pos); i < length && i - pos < rate * 0.15; i++) {
        data[i] += (rnd() * 2 - 1) * amp * (1 - (i - pos) / (rate * 0.15));
      }
    }
  }
  return ir;
}

/** 构建一个发送式混响总线，返回 {input, output, mix} */
export function createReverb(ctx, seed = 1) {
  const conv = ctx.createConvolver();
  conv.buffer = createImpulseResponse(ctx, 4.5, seed);
  const wet = ctx.createGain();
  const dry = ctx.createGain();
  wet.gain.value = 0.4;
  dry.gain.value = 1;
  conv.connect(wet);
  const output = ctx.createGain();
  wet.connect(output);
  dry.connect(output);
  return { input: { dry, wet }, output, wetGain: wet, dryGain: dry };
}

/** 乒乓延迟：两段延迟交错，营造空间纵深感 */
export function createDelay(ctx, time = 0.375, feedback = 0.38) {
  const d1 = ctx.createDelay(2.0);
  const d2 = ctx.createDelay(2.0);
  const fb = ctx.createGain();
  const wet = ctx.createGain();
  const low = ctx.createBiquadFilter();
  low.type = 'lowpass';
  low.frequency.value = 3200;
  d1.delayTime.value = time;
  d2.delayTime.value = time * 1.5;
  fb.gain.value = feedback;
  wet.gain.value = 0.5;
  // 乒乓连接：d1 -> d2 -> d1 环
  d1.connect(d2);
  d2.connect(fb);
  fb.connect(d1);
  d2.connect(low);
  low.connect(wet);
  return { input: d1, output: wet, wetGain: wet, fbGain: fb };
}

/**
 * 构建母带链：压缩 => 总音量 => 软限幅（WaveShaper 曲线）
 * 保证任何叠加都不炸裂，声音始终"如丝"。
 */
export function createMasterChain(ctx) {
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.knee.value = 24;
  comp.ratio.value = 3;
  comp.attack.value = 0.006;
  comp.release.value = 0.25;

  const master = ctx.createGain();
  master.gain.value = 0.9;

  // 软限幅曲线：以 tanh 为基底
  const shaper = ctx.createWaveShaper();
  const k = 4;
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  shaper.curve = curve;
  shaper.oversample = '4x';

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.82;

  comp.connect(master);
  master.connect(shaper);
  shaper.connect(ctx.destination);
  // 分析器挂在限幅前，供可视化读取
  comp.connect(analyser);

  return { input: comp, master, analyser, shaper };
}
