/**
 * render.js — 声境渲染引擎
 * Web Audio 合成演奏乐谱（三角波主音 + 正弦和声垫），并用示波器可视化声波。
 */
export class SoundscapeRender {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.score = null;
    this.audio = null;
    this.master = null;
    this.analyser = null;
    this.wave = new Float32Array(512);
    this.running = false;
    this.playhead = 0;
    this.nextNoteIdx = 0;
    this._raf = null;
    window.addEventListener('resize', () => this._resize());
    this._resize();
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.floor(this.canvas.clientHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = this.canvas.clientWidth;
    this.H = this.canvas.clientHeight;
  }

  setScore(score) {
    this.score = score;
    this.playhead = 0;
    this.nextNoteIdx = 0;
  }

  /** 首次用户手势后初始化音频 */
  ensureAudio() {
    if (this.audio) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.audio = new AC();
    this.master = this.audio.createGain();
    this.master.gain.value = 0.32;
    this.analyser = this.audio.createAnalyser();
    this.analyser.fftSize = 1024;
    this.master.connect(this.analyser);
    this.analyser.connect(this.audio.destination);
    this._startScheduler();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  setVolume(v) {
    if (this.master) this.master.gain.value = v;
  }

  /** 调度器：按乐谱时间推进，把到点音符送进合成器 */
  _startScheduler() {
    const lookAhead = 0.15; // 提前 150ms 排程
    const tick = () => {
      if (!this.score || !this.audio) return;
      const now = this.audio.currentTime;
      const horizon = now + lookAhead;
      while (this.nextNoteIdx < this.score.notes.length &&
             this.score.notes[this.nextNoteIdx].t < horizon) {
        const n = this.score.notes[this.nextNoteIdx];
        if (n.t >= now - 0.05) this._playNote(n);
        this.nextNoteIdx++;
      }
      setTimeout(tick, 60);
    };
    tick();
  }

  _playNote(n) {
    const { audio, master } = this;
    const t0 = audio.currentTime + Math.max(0, n.t - audio.currentTime + 0.001);
    // 主音：三角波
    const osc = audio.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 440 * Math.pow(2, (n.pitch - 69) / 12);
    const g = audio.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.35, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + n.dur * this.score.bpm / 60 * 0.95);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + n.dur * this.score.bpm / 60 + 0.05);
    // 和声：正弦泛音，轻铺
    if (n.dur >= 0.9) {
      const o2 = audio.createOscillator();
      o2.type = 'sine';
      o2.frequency.value = 440 * Math.pow(2, (n.pitch + 12 - 69) / 12);
      const g2 = audio.createGain();
      g2.gain.setValueAtTime(0, t0);
      g2.gain.linearRampToValueAtTime(0.08, t0 + 0.06);
      g2.gain.exponentialRampToValueAtTime(0.001, t0 + n.dur * this.score.bpm / 60);
      o2.connect(g2);
      g2.connect(master);
      o2.start(t0);
      o2.stop(t0 + n.dur * this.score.bpm / 60 + 0.05);
    }
  }

  _loop() {
    if (!this.running) return;
    const { ctx, W, H } = this;
    const score = this.score;
    this.playhead += 1 / 60;

    // 背景
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0c1018');
    bg.addColorStop(1, '#070a10');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (score && this.analyser) {
      this.analyser.getFloatTimeDomainData(this.wave);
      // 示波器波形
      const cx = W / 2, cy = H / 2;
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(127, 200, 232, 0.9)';
      ctx.beginPath();
      const step = this.wave.length / W;
      for (let x = 0; x < W; x++) {
        const v = this.wave[Math.floor(x * step)] * 2.4;
        const y = cy + v * (H * 0.3);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      // 中线
      ctx.strokeStyle = 'rgba(127, 200, 232, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(W, cy);
      ctx.stroke();
    } else {
      // 未播放时画一段静态呼吸线
      const t = this.playhead * 2;
      ctx.strokeStyle = 'rgba(127, 200, 232, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const y = H / 2 + Math.sin(x * 0.02 + t) * 10 * Math.sin(t * 0.5 + 1);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 乐谱信息条
    if (score) {
      ctx.fillStyle = 'rgba(200, 220, 240, 0.6)';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(`调式 ${score.styleLabel} · ${score.bpm} BPM · 第 ${Math.min(score.bars, Math.ceil(this.playhead / (score.duration / score.bars)))}/${score.bars} 小节`, 22, 28);
    }

    this._raf = requestAnimationFrame(() => this._loop());
  }
}
