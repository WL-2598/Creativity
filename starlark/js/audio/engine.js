/**
 * engine.js — 音频引擎：调度器、总线、声部调度与演化系统
 * 采用 lookahead 调度（25ms 轮询 / 100ms 预排），保证时序稳健。
 * 一颗种子 => 一个世界 => 持续呼吸演化的音乐。
 */
import { createWorld, scaleNote, chordVoices, developMotif, randomSeed, clamp, SCALES, rngFromSeed, generateProgression, generateMotif } from './composition.js';
import { createReverb, createDelay, createMasterChain } from './effects.js';
import * as synth from './synth.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.world = null;
    this.playing = false;
    this.autoEvolve = true;
    this.level = 0.8;          // 主音量
    this._timer = null;
    this._nextNoteTime = 0;
    this._current16th = 0;      // 当前 16 分音符序号
    this._bar = 0;              // 全局小节计数
    this._phrase = 0;           // 乐句计数（每 2 小节一个乐句）
    this._pending = [];         // 等待回收的侧链节点
  }

  /* ---------- 生命周期 ---------- */
  async init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    // 效果总线
    this.reverb = createReverb(this.ctx, (this.world?.seed ?? 1));
    this.delay = createDelay(this.ctx, 0.375, 0.36);
    this.master = createMasterChain(this.ctx);

    // 三总线：dry -> 总滤波 -> 母带；reverb/delay 发送 -> 母带
    this.bus = {
      dry: this.ctx.createGain(),
      reverb: this.ctx.createGain(),
      delay: this.ctx.createGain(),
    };
    this.masterFilter = this.ctx.createBiquadFilter();
    this.masterFilter.type = 'lowpass';
    this.masterFilter.frequency.value = 2400;
    this.bus.dry.connect(this.masterFilter);
    this.masterFilter.connect(this.master.input);
    this.reverb.output.connect(this.master.input);
    this.delay.output.connect(this.master.input);
    this._syncEffects();

    // 侧链压控：底鼓 => 全局 duck 增益 => 贝斯音量下沉
    this.duck = this.ctx.createGain();
    this.duck.gain.value = 1;
    this.duck.connect(this.master.input);
  }

  async start(seed, moodKey) {
    await this.init();
    if (seed !== undefined) this.world = createWorld(seed, moodKey);
    else if (!this.world) this.world = createWorld(randomSeed());
    this._syncEffects();
    if (this.playing) this.stop();
    this.playing = true;
    this._current16th = 0;
    this._bar = 0;
    this._phrase = 0;
    this._nextNoteTime = this.ctx.currentTime + 0.08;
    this._scheduler();
  }

  stop() {
    this.playing = false;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
  }

  toggle() {
    if (this.playing) this.stop();
    else this.start();
    return this.playing;
  }

  /** 换种子：保留当前播放状态 */
  reseed(seed) {
    this.world = createWorld(seed);
    this._syncEffects();
  }

  /* ---------- 参数同步 ---------- */
  _syncEffects() {
    const w = this.world;
    if (!w || !this.reverb) return;
    const t = this.ctx.currentTime;
    this.reverb.wetGain.gain.setTargetAtTime(0.25 + w.reverb * 0.65, t, 0.3);
    this.delay.wetGain.gain.setTargetAtTime(w.delay * 0.8, t, 0.3);
    this.delay.fbGain.gain.setTargetAtTime(0.28 + w.delay * 0.2, t, 0.3);
    this.master.master.gain.setTargetAtTime(this.level, t, 0.05);
    if (this.masterFilter) {
      this.masterFilter.frequency.setTargetAtTime(180 + w.cutoff * 7500, t, 0.3);
    }
  }

  /** 切换音阶：保持种子与世界，重生成和声与动机 */
  setScale(scaleKey) {
    if (!this.world) return;
    this.world.scaleKey = scaleKey;
    this.world.scale = SCALES[scaleKey];
    const rng = rngFromSeed((this.world.seed ^ (scaleKey.length * 2654435761)) >>> 0);
    this.world.progression = generateProgression(rng, this.world.scale, 5);
    this.world.motifs = [0, 1, 2].map(() => generateMotif(rng, this.world.scale, 8));
  }

  setParam(name, value) {
    if (!this.world) return;
    this.world[name] = value;
    this._syncEffects();
  }

  /* ---------- 调度器 ---------- */
  _scheduler() {
    if (!this.playing) return;
    const lookahead = 0.12;
    while (this._nextNoteTime < this.ctx.currentTime + lookahead) {
      this._schedule16th(this._current16th, this._nextNoteTime);
      const secPer16th = (60 / this.world.tempo) / 4;
      this._nextNoteTime += secPer16th;
      this._current16th++;
      if (this._current16th % 16 === 0) {
        this._bar++;
        this._onBar();
      }
    }
    this._timer = setTimeout(() => this._scheduler(), 25);
  }

  _schedule16th(i, time) {
    const w = this.world;
    const withinBar = i % 16;
    const barIdx = Math.floor(i / 16);

    // —— 钟磬琶音：欧几里得节奏 + 和弦音轮转 ——
    const bellHit = w.rhythms.bell[(withinBar + w.evolution.arpRotate) % w.rhythms.bell.length];
    if (bellHit && w.density * 1.2 > Math.random()) {
      const chord = w.progression.chords[barIdx % w.progression.length];
      const tones = chordVoices(w.baseMidi, w.scale, chord, 'open').slice(1); // 跳过低八度根音
      const tone = tones[(withinBar + w.evolution.arpRotate) % tones.length];
      synth.playBell(this.ctx, this.bus, tone, 0.16 + w.density * 0.1, w.brightness);
    }

    // —— 合成打击乐 ——
    if (w.rhythms.kick[withinBar % w.rhythms.kick.length]) {
      const g = synth.playKick(this.ctx, this.bus, 0.85);
      // 底鼓 => 侧链
      const scale = this.ctx.createGain();
      scale.gain.value = -0.72;
      g.connect(scale);
      scale.connect(this.duck.gain);
      this._pending.push(scale);
      setTimeout(() => { try { scale.disconnect(); } catch { /* noop */ } }, 800);
    }
    if (w.rhythms.hat[withinBar % w.rhythms.hat.length]) {
      synth.playHat(this.ctx, this.bus, 0.12);
    }

    // —— 氛围颗粒：稀疏地洒落 ——
    if (withinBar % 4 === 2 && Math.random() < 0.05 * w.density) {
      const chord = w.progression.chords[barIdx % w.progression.length];
      const tones = chordVoices(w.baseMidi, w.scale, chord);
      const tone = tones[randInt(0, tones.length - 1)];
      synth.playShimmer(this.ctx, this.bus, tone, 0.05);
    }
  }

  _onBar() {
    const w = this.world;
    const barIdx = this._bar;
    const chord = w.progression.chords[barIdx % w.progression.length];
    const voices = chordVoices(w.baseMidi, w.scale, chord);

    // —— Pad 铺底：每小节换一次和弦，完整和弦逐音叠加 ——
    for (const n of voices) {
      synth.playPad(this.ctx, this.bus, n, 2.2, 0.05 + w.density * 0.03, w.brightness);
    }

    // —— 贝斯：根音，随密度决定是否加五度 ——
    const bassMidi = voices[0];
    synth.playBass(this.ctx, this.bus, bassMidi, 0.22, w.brightness, this.duck);
    if (w.density > 0.55 && barIdx % 2 === 1) {
      synth.playBass(this.ctx, this.bus, bassMidi + 7, 0.14, w.brightness, this.duck);
    }

    // —— 旋律乐句：每 2 小节一个，动机发展 ——
    if (barIdx % 2 === 0) {
      this._phrase++;
      const motif = w.motifs[this._phrase % w.motifs.length];
      const developed = this.autoEvolve ? developMotif(Math.random, motif) : motif;
      this._scheduleMotif(developed, barIdx);
    }

    // —— 演化：每 8 小节一次"呼吸" ——
    if (this.autoEvolve && barIdx > 0 && barIdx % 8 === 0) this._evolve();
  }

  _scheduleMotif(motif, barIdx) {
    const w = this.world;
    const scale = w.scale;
    // 乐句在中高八度呈现，避免与贝斯/铺底打架
    const octave = 12 + (this._phrase % 2) * 7;
    motif.events.forEach(e => {
      if (e.deg <= 0) return;
      const midi = scaleNote(w.baseMidi, scale, e.deg) + octave;
      synth.playLead(this.ctx, this.bus, midi, 0.14 + w.density * 0.06, w.brightness);
    });
  }

  _evolve() {
    const w = this.world;
    const drift = (Math.random() - 0.5) * 0.1;
    // 亮度缓慢漂移：直接作用于音色与滤波，制造"呼吸"
    w.brightness = clamp(w.brightness + drift * 0.6, 0.2, 0.95);
    w.brightnessTarget = w.brightness;
    w.evolution.arpRotate = (w.evolution.arpRotate + 1) % 16;
    w.evolution.drift = drift;
    // 偶尔的调内移位：移动根音，制造"游移"的悬置感
    if (Math.random() < 0.3) {
      w.baseMidi += w.scale.steps[Math.floor(Math.random() * w.scale.steps.length)] - w.scale.steps[0];
    }
    this._syncEffects();
  }

  /** 分析器（供可视化） */
  get analyser() { return this.master?.analyser || null; }
}

/** 小工具：线性整数随机（避免引入额外依赖） */
function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
