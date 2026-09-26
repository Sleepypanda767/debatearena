/**
 * AudioManager handles Web Audio API:
 * - Microphone input stream & real-time AnalyserNode
 * - Audio playback buffer decoding & real-time playback AnalyserNode
 * - PCM 16kHz WAV recording for Sarvam Saaras STT
 * - Synthetic test sounds routed through AnalyserNode for isolated testing
 */

export interface AudioAnalysis {
  amplitude: number; // 0 to 1 normalized RMS
  frequencies: Uint8Array;
  timeDomain: Uint8Array;
  peakFrequencyRatio: number; // 0 to 1
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micAnalyser: AnalyserNode | null = null;

  private playbackSource: AudioBufferSourceNode | null = null;
  private playbackAnalyser: AnalyserNode | null = null;
  private playbackGain: GainNode | null = null;

  // Recording pipeline with 16kHz PCM WAV encoding
  private isRecording: boolean = false;
  private recorderProcessor: ScriptProcessorNode | null = null;
  private recordedPcmBuffers: Float32Array[] = [];
  private recorderSampleRate = 16000;

  // Smoothing states
  private smoothedMicAmp = 0;
  private smoothedPlaybackAmp = 0;

  // Reusable static buffers to avoid GC pauses
  private staticZeroFreq = new Uint8Array(128);
  private staticZeroTime = new Uint8Array(128);

  // Simulated test audio node
  private testOscillator: OscillatorNode | null = null;
  private isTestingAudio = false;

  public initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  /**
   * Initializes real microphone and connects to micAnalyser
   */
  public async initMicrophone(): Promise<boolean> {
    try {
      const ctx = this.initContext();
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      if (!this.micStream) {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      if (!this.micAnalyser) {
        this.micAnalyser = ctx.createAnalyser();
        this.micAnalyser.fftSize = 256;
        this.micAnalyser.smoothingTimeConstant = 0.55; // Lower smoothing for snappier real-time reactivity
      }

      if (!this.micSource && this.micStream) {
        this.micSource = ctx.createMediaStreamSource(this.micStream);
        this.micSource.connect(this.micAnalyser);
      }

      return true;
    } catch (err) {
      console.warn("Microphone access denied or unavailable:", err);
      return false;
    }
  }

  /**
   * Start recording user audio for STT transcription in 16kHz WAV format
   */
  public async startRecording(): Promise<boolean> {
    const micReady = await this.initMicrophone();
    if (!micReady || !this.micStream || !this.ctx) return false;

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    this.recordedPcmBuffers = [];

    try {
      const bufferSize = 4096;
      this.recorderProcessor = this.ctx.createScriptProcessor(bufferSize, 1, 1);
      const inputSampleRate = this.ctx.sampleRate;
      const targetRate = 16000;
      this.recorderSampleRate = targetRate;

      this.recorderProcessor.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const downsampled = this.downsampleBuffer(inputData, inputSampleRate, targetRate);
        this.recordedPcmBuffers.push(new Float32Array(downsampled));
      };

      if (this.micSource) {
        this.micSource.connect(this.recorderProcessor);
        const silentGain = this.ctx.createGain();
        silentGain.gain.value = 0;
        this.recorderProcessor.connect(silentGain);
        silentGain.connect(this.ctx.destination);
      }

      this.isRecording = true;
      return true;
    } catch (e) {
      console.error("Failed to start AudioRecorder:", e);
      return false;
    }
  }

  private downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number): Float32Array {
    if (outputRate >= inputRate) return buffer;
    const ratio = inputRate / outputRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  /**
   * Stop recording and return clean 16kHz mono WAV Blob
   */
  public stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.isRecording = false;

      if (this.recorderProcessor) {
        try {
          this.recorderProcessor.disconnect();
        } catch {
          // ignore
        }
        this.recorderProcessor = null;
      }

      if (this.recordedPcmBuffers.length === 0) {
        resolve(null);
        return;
      }

      // Merge PCM buffers
      let totalLength = 0;
      for (const b of this.recordedPcmBuffers) {
        totalLength += b.length;
      }

      // Minimum ~0.3s of audio required (4800 samples at 16kHz)
      if (totalLength < 2400) {
        this.recordedPcmBuffers = [];
        resolve(null);
        return;
      }

      const mergedPcm = new Float32Array(totalLength);
      let offset = 0;
      for (const b of this.recordedPcmBuffers) {
        mergedPcm.set(b, offset);
        offset += b.length;
      }

      // Encode as 16kHz 16-bit PCM WAV
      const wavBlob = this.encodeWav(mergedPcm, this.recorderSampleRate);
      this.recordedPcmBuffers = [];
      resolve(wavBlob);
    });
  }

  private encodeWav(samples: Float32Array, sampleRate: number): Blob {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono channel
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // 16-bit
    writeString(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);

    let pcmOffset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(pcmOffset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      pcmOffset += 2;
    }

    return new Blob([view], { type: "audio/wav" });
  }

  /**
   * Play base64 audio from Bulbul through AudioContext and connect to playbackAnalyser
   */
  public async playBase64Audio(base64Data: string, onEnded?: () => void): Promise<void> {
    const ctx = this.initContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const cleanBase64 = base64Data.replace(/^data:audio\/\w+;base64,/, "");
    const binaryString = window.atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    try {
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
      this.stopPlayback();

      if (!this.playbackAnalyser) {
        this.playbackAnalyser = ctx.createAnalyser();
        this.playbackAnalyser.fftSize = 256;
        this.playbackAnalyser.smoothingTimeConstant = 0.6;
      }

      if (!this.playbackGain) {
        this.playbackGain = ctx.createGain();
        this.playbackGain.gain.value = 1.0;
        this.playbackAnalyser.connect(this.playbackGain);
        this.playbackGain.connect(ctx.destination);
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackAnalyser);

      let endedFired = false;
      const finish = () => {
        if (!endedFired) {
          endedFired = true;
          this.playbackSource = null;
          if (onEnded) onEnded();
        }
      };

      source.onended = finish;
      this.playbackSource = source;
      source.start(0);

      // Safety timeout: in case onended doesn't fire
      const maxDurationSec = (audioBuffer.duration || 10) + 1.5;
      setTimeout(finish, maxDurationSec * 1000);
    } catch (err) {
      console.error("Failed to decode or play audio buffer:", err);
      if (onEnded) onEnded();
    }
  }

  public stopPlayback(): void {
    if (this.playbackSource) {
      try {
        this.playbackSource.stop();
        this.playbackSource.disconnect();
      } catch {
        // Ignore if already stopped
      }
      this.playbackSource = null;
    }
  }

  /**
   * Plays a synthesized voice-like modulated audio wave through the playback analyser for isolated state testing
   */
  public playTestSpeech(durationSec: number = 3.5, onEnded?: () => void): void {
    const ctx = this.initContext();
    this.stopPlayback();
    this.stopTestAudio();

    if (!this.playbackAnalyser) {
      this.playbackAnalyser = ctx.createAnalyser();
      this.playbackAnalyser.fftSize = 256;
      this.playbackAnalyser.smoothingTimeConstant = 0.6;
    }

    if (!this.playbackGain) {
      this.playbackGain = ctx.createGain();
      this.playbackGain.gain.value = 0.4;
      this.playbackAnalyser.connect(this.playbackGain);
      this.playbackGain.connect(ctx.destination);
    }

    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const modGain = ctx.createGain();
    const voiceGain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, ctx.currentTime);

    lfo.type = "sine";
    lfo.frequency.setValueAtTime(4.5, ctx.currentTime);
    modGain.gain.setValueAtTime(40, ctx.currentTime);
    lfo.connect(modGain);
    modGain.connect(osc.frequency);

    voiceGain.gain.setValueAtTime(0.001, ctx.currentTime);
    const now = ctx.currentTime;
    for (let t = 0; t < durationSec; t += 0.28) {
      const peakTime = now + t + 0.08;
      const pauseTime = now + t + 0.25;
      const vol = 0.35 + Math.random() * 0.55;
      voiceGain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), peakTime);
      voiceGain.gain.exponentialRampToValueAtTime(0.02, pauseTime);
    }
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(voiceGain);
    voiceGain.connect(this.playbackAnalyser);

    osc.start(now);
    lfo.start(now);
    osc.stop(now + durationSec);
    lfo.stop(now + durationSec);

    this.isTestingAudio = true;
    setTimeout(() => {
      this.isTestingAudio = false;
      if (onEnded) onEnded();
    }, durationSec * 1000);
  }

  public stopTestAudio(): void {
    if (this.testOscillator) {
      try {
        this.testOscillator.stop();
        this.testOscillator.disconnect();
      } catch {
        // ignore
      }
      this.testOscillator = null;
    }
    this.isTestingAudio = false;
  }

  /**
   * Polls the live Web Audio AnalyserNode for amplitude & frequency distribution.
   * Maps conversational speech RMS into a vibrant, clearly perceptible [0.1, 1.0] dynamic range.
   */
  public getAnalysis(analyser: AnalyserNode | null, smoothedPrev: number): { amp: number; raw: AudioAnalysis } {
    const bufferLen = analyser ? analyser.frequencyBinCount : 128;
    const freqData = new Uint8Array(bufferLen);
    const timeData = new Uint8Array(bufferLen);

    if (!analyser) {
      return {
        amp: 0,
        raw: {
          amplitude: 0,
          frequencies: this.staticZeroFreq,
          timeDomain: this.staticZeroTime,
          peakFrequencyRatio: 0,
        },
      };
    }

    analyser.getByteFrequencyData(freqData);
    analyser.getByteTimeDomainData(timeData);

    // 1. Time-domain RMS
    let sumSquares = 0;
    for (let i = 0; i < timeData.length; i++) {
      const val = (timeData[i] - 128) / 128;
      sumSquares += val * val;
    }
    const rawRms = Math.sqrt(sumSquares / timeData.length);

    // 2. Human Voice Frequency Power (Bins 2 to 38, ~150Hz to ~3200Hz)
    let voiceFreqSum = 0;
    const voiceBinCount = Math.min(36, freqData.length - 2);
    for (let i = 2; i < 2 + voiceBinCount; i++) {
      voiceFreqSum += freqData[i] / 255;
    }
    const voiceFreqAvg = voiceBinCount > 0 ? voiceFreqSum / voiceBinCount : 0;

    // 3. Combined reactive power metric:
    // Scale conversational voice RMS (which is typically 0.02 - 0.08) into a punchy 0.15 - 0.95 visual range
    const combinedRaw = rawRms * 3.8 + voiceFreqAvg * 0.7;
    // Non-linear power curve for dramatic visual response
    const scaledAmp = Math.min(Math.pow(combinedRaw, 0.72) * 1.35, 1.0);

    // 4. Fast attack for syllables, smooth natural decay
    const attack = 0.65;
    const decay = 0.22;
    const smoothed =
      scaledAmp > smoothedPrev
        ? smoothedPrev + (scaledAmp - smoothedPrev) * attack
        : smoothedPrev + (scaledAmp - smoothedPrev) * decay;

    // Peak frequency bin
    let maxBinVal = 0;
    let maxBinIdx = 0;
    for (let i = 0; i < freqData.length; i++) {
      if (freqData[i] > maxBinVal) {
        maxBinVal = freqData[i];
        maxBinIdx = i;
      }
    }
    const peakRatio = freqData.length > 0 ? maxBinIdx / freqData.length : 0;

    return {
      amp: smoothed,
      raw: {
        amplitude: smoothed,
        frequencies: freqData,
        timeDomain: timeData,
        peakFrequencyRatio: peakRatio,
      },
    };
  }

  /**
   * Retrieves active analysis data based on current system state:
   * - 'listening': reads micAnalyser
   * - 'speaking': reads playbackAnalyser
   */
  public getLiveStateAnalysis(state: "idle" | "listening" | "thinking" | "speaking"): AudioAnalysis {
    if (state === "listening") {
      const { amp, raw } = this.getAnalysis(this.micAnalyser, this.smoothedMicAmp);
      this.smoothedMicAmp = amp;
      return raw;
    }

    if (state === "speaking") {
      const { amp, raw } = this.getAnalysis(this.playbackAnalyser, this.smoothedPlaybackAmp);
      this.smoothedPlaybackAmp = amp;
      return raw;
    }

    return {
      amplitude: 0,
      frequencies: this.staticZeroFreq,
      timeDomain: this.staticZeroTime,
      peakFrequencyRatio: 0,
    };
  }
}

export const audioManager = new AudioManager();
