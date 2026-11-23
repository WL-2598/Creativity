/**
 * recorder.js — 录音与 WAV 导出
 * 通过 ScriptProcessorNode 捕获限幅后的实时信号，按块累积为 Float32，
 * 停止时编码为 16-bit PCM WAV 供下载。全程零依赖。
 */

export class Recorder {
  constructor(ctx, sourceNode) {
    this.ctx = ctx;
    this.source = sourceNode;
    this.recording = false;
    this.chunks = [];
    this.processor = null;
  }

  start() {
    if (this.recording) return;
    this.recording = true;
    this.chunks = [];
    // 接管路由：source -> processor -> destination（停录后恢复直连）
    try { this.source.disconnect(this.ctx.destination); } catch { /* noop */ }
    this.processor = this.ctx.createScriptProcessor(4096, 2, 2);
    this.processor.onaudioprocess = e => {
      if (!this.recording) return;
      this.chunks.push(e.inputBuffer.getChannelData(0).slice());
      this.chunks.push(e.inputBuffer.getChannelData(1).slice());
    };
    this.source.connect(this.processor);
    this.processor.connect(this.ctx.destination);
  }

  /** 停止并返回 {wav: Blob, duration: number} */
  stop() {
    return new Promise(resolve => {
      if (!this.recording) { resolve(null); return; }
      this.recording = false;
      const processor = this.processor;
      // onaudioprocess 是异步的，稍等最后一个块落盘
      setTimeout(() => {
        try {
          this.source.disconnect(processor);
          processor.disconnect();
          this.source.connect(this.ctx.destination);   // 恢复直连
        } catch { /* noop */ }
        this.processor = null;
        resolve(this._encodeWav());
      }, 120);
    });
  }

  _encodeWav() {
    const rate = this.ctx.sampleRate;
    // 双通道按块累积（块长固定 4096，仅末块可能不足，逐块追加即可）
    const left = [], right = [];
    for (let i = 0; i < this.chunks.length; i += 2) {
      const l = this.chunks[i], r = this.chunks[i + 1] || l;
      left.push(l); right.push(r);
    }
    const total = left.reduce((s, c) => s + c.length, 0);
    const interleaved = new Float32Array(total * 2);
    let off = 0;
    const nChunks = left.length;
    for (let i = 0; i < nChunks; i++) {
      const l = left[i], r = right[i];
      for (let j = 0; j < l.length; j++) {
        interleaved[off++] = l[j];
        interleaved[off++] = r[j] ?? l[j];
      }
    }
    // 16-bit PCM 编码
    const buffer = new ArrayBuffer(44 + interleaved.length * 2);
    const view = new DataView(buffer);
    const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + interleaved.length * 2, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 2, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, interleaved.length * 2, true);
    let p = 44;
    for (let i = 0; i < interleaved.length; i++) {
      let s = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      p += 2;
    }
    return { wav: new Blob([buffer], { type: 'audio/wav' }), duration: interleaved.length / 2 / rate };
  }
}
