/**
 * Web Audio API Synthesizer & Alarm Tone Generator
 * Generates dynamic audio waveforms for alert tones and visualizes them on HTML5 Canvas.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.isPlaying = false;
    this.activePreset = 'siren';
    this.pitchMultiplier = 1.0;
    this.volume = 0.5;
    this.loopTimer = null;
    this.canvas = null;
    this.canvasCtx = null;
    this.animationId = null;
  }

  init(canvasElement) {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (canvasElement) {
      this.canvas = canvasElement;
      this.canvasCtx = canvasElement.getContext('2d');
      this.startVisualizer();
    }
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  setPitch(multiplier) {
    this.pitchMultiplier = Math.max(0.2, Math.min(3.0, multiplier));
  }

  setPreset(presetName) {
    this.activePreset = presetName;
    if (this.isPlaying) {
      this.stopTone();
      this.startTone(presetName);
    }
  }

  startTone(preset = this.activePreset) {
    this.init(this.canvas);
    this.resume();
    if (this.isPlaying) this.stopTone();

    this.isPlaying = true;
    this.activePreset = preset;

    const playCycle = () => {
      if (!this.isPlaying) return;

      const now = this.ctx.currentTime;
      let nextDelay = 1000;

      switch (this.activePreset) {
        case 'siren': {
          // Classic dual-tone sweep
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          const baseFreq = 700 * this.pitchMultiplier;
          const peakFreq = 1600 * this.pitchMultiplier;

          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(peakFreq, now + 0.35);
          osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.7);

          gain.gain.setValueAtTime(this.volume * 0.4, now);
          gain.gain.setValueAtTime(this.volume * 0.4, now + 0.65);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now);
          osc.stop(now + 0.75);
          nextDelay = 780;
          break;
        }

        case 'strobe': {
          // Rapid high-frequency pulsed bursts
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(2600 * this.pitchMultiplier, now);

          gain.gain.setValueAtTime(this.volume * 0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now);
          osc.stop(now + 0.09);
          nextDelay = 120;
          break;
        }

        case 'cyber': {
          // Cyberpunk downward sweep laser alert
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          const startF = 2200 * this.pitchMultiplier;
          const endF = 400 * this.pitchMultiplier;

          osc.frequency.setValueAtTime(startF, now);
          osc.frequency.exponentialRampToValueAtTime(endF, now + 0.28);

          gain.gain.setValueAtTime(this.volume * 0.45, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now);
          osc.stop(now + 0.3);
          nextDelay = 350;
          break;
        }

        case 'retro': {
          // 8-bit arcade arpeggio
          const notes = [440, 660, 880, 1320];
          notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq * this.pitchMultiplier, now + idx * 0.08);

            gain.gain.setValueAtTime(this.volume * 0.3, now + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * 0.08);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + idx * 0.08);
            osc.stop(now + (idx + 1) * 0.08);
          });
          nextDelay = 450;
          break;
        }

        case 'chime': {
          // Warm harmonic chime
          [523.25, 659.25, 783.99].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq * this.pitchMultiplier, now + idx * 0.06);

            gain.gain.setValueAtTime(0, now + idx * 0.06);
            gain.gain.linearRampToValueAtTime(this.volume * 0.35, now + idx * 0.06 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.8);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.85);
          });
          nextDelay = 950;
          break;
        }
      }

      if (this.isPlaying) {
        this.loopTimer = setTimeout(playCycle, nextDelay);
      }
    };

    playCycle();
  }

  stopTone() {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  playOneShot(preset = 'strobe', durationMs = 200) {
    this.init(this.canvas);
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(2000 * this.pitchMultiplier, now);
    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + durationMs / 1000);
  }

  startVisualizer() {
    if (!this.canvas || !this.canvasCtx || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      this.animationId = requestAnimationFrame(draw);

      const width = this.canvas.width;
      const height = this.canvas.height;
      this.analyser.getByteTimeDomainData(dataArray);

      // Cyber dark canvas background
      this.canvasCtx.fillStyle = 'rgba(11, 19, 43, 0.4)';
      this.canvasCtx.fillRect(0, 0, width, height);

      this.canvasCtx.lineWidth = 2.5;
      // Gradient line from cyan to neon purple
      const gradient = this.canvasCtx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#00f2fe');
      gradient.addColorStop(0.5, '#4facfe');
      gradient.addColorStop(1, '#ec4899');
      this.canvasCtx.strokeStyle = gradient;
      this.canvasCtx.shadowBlur = 8;
      this.canvasCtx.shadowColor = '#00f2fe';

      this.canvasCtx.beginPath();
      const sliceWidth = (width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          this.canvasCtx.moveTo(x, y);
        } else {
          this.canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      this.canvasCtx.lineTo(width, height / 2);
      this.canvasCtx.stroke();
      this.canvasCtx.shadowBlur = 0; // reset
    };

    draw();
  }
}

export const audioEngine = new AudioEngine();
