/**
 * Web Audio API Musical Melodic Synthesizer & Acoustic Engine
 * Generates rich musical melodies, harmonic chords, and acoustic motifs
 * instead of raw harsh beeps. Visualizes waveforms on HTML5 Canvas.
 *
 * Part of SMART IOT HUB • Built by TekStep Apps Uganda (tekstepapps.org)
 */

// Musical Note Standard Frequencies (Hz)
export const MUSICAL_NOTES = {
  C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23,
  Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
  C5: 523.25, Cs5: 554.37, D5: 587.33, Ds5: 622.25, E5: 659.25, F5: 698.46,
  Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, As5: 932.33, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760.00
};

// Curated Harmonic Melodies for All System Alerts & Notifications
export const MELODIC_PRESETS = {
  // Intrusion & Security Alert: Dramatic minor melodic sequence (A minor arpeggio)
  alert: [
    { freq: MUSICAL_NOTES.A4, dur: 0.12, type: 'triangle', gain: 0.40 },
    { freq: MUSICAL_NOTES.C5, dur: 0.12, type: 'sine',     gain: 0.45 },
    { freq: MUSICAL_NOTES.E5, dur: 0.12, type: 'triangle', gain: 0.50 },
    { freq: MUSICAL_NOTES.A5, dur: 0.22, type: 'sine',     gain: 0.55 },
    { freq: MUSICAL_NOTES.G5, dur: 0.14, type: 'triangle', gain: 0.45 },
    { freq: MUSICAL_NOTES.E5, dur: 0.14, type: 'sine',     gain: 0.40 },
    { freq: MUSICAL_NOTES.C5, dur: 0.20, type: 'triangle', gain: 0.35 }
  ],

  // Siren / Continuous Alarm: High-urgency melodic phrase
  siren: [
    { freq: MUSICAL_NOTES.E5, dur: 0.14, type: 'triangle', gain: 0.45 },
    { freq: MUSICAL_NOTES.A5, dur: 0.16, type: 'sine',     gain: 0.50 },
    { freq: MUSICAL_NOTES.G5, dur: 0.14, type: 'triangle', gain: 0.45 },
    { freq: MUSICAL_NOTES.B5, dur: 0.20, type: 'sine',     gain: 0.55 }
  ],

  // Strobe: Crisp staccato melodic triad
  strobe: [
    { freq: MUSICAL_NOTES.D5, dur: 0.08, type: 'triangle', gain: 0.40 },
    { freq: MUSICAL_NOTES.A5, dur: 0.08, type: 'sine',     gain: 0.45 },
    { freq: MUSICAL_NOTES.F5, dur: 0.08, type: 'triangle', gain: 0.40 },
    { freq: MUSICAL_NOTES.D6, dur: 0.12, type: 'sine',     gain: 0.50 }
  ],

  // Cyber: Futuristic synthwave ascending/descending motif (D major 9th)
  cyber: [
    { freq: MUSICAL_NOTES.D4, dur: 0.09, type: 'sawtooth', gain: 0.28 },
    { freq: MUSICAL_NOTES.Fs4, dur: 0.09, type: 'triangle', gain: 0.35 },
    { freq: MUSICAL_NOTES.A4, dur: 0.09, type: 'sine',     gain: 0.40 },
    { freq: MUSICAL_NOTES.Cs5, dur: 0.09, type: 'triangle', gain: 0.42 },
    { freq: MUSICAL_NOTES.E5, dur: 0.16, type: 'sine',     gain: 0.45 },
    { freq: MUSICAL_NOTES.A4, dur: 0.12, type: 'triangle', gain: 0.35 }
  ],

  // Retro: 8-bit playful arcade ascending major triad
  retro: [
    { freq: MUSICAL_NOTES.C5, dur: 0.07, type: 'square',   gain: 0.22 },
    { freq: MUSICAL_NOTES.E5, dur: 0.07, type: 'triangle', gain: 0.30 },
    { freq: MUSICAL_NOTES.G5, dur: 0.07, type: 'square',   gain: 0.25 },
    { freq: MUSICAL_NOTES.C6, dur: 0.18, type: 'sine',     gain: 0.35 }
  ],

  // Chime: Warm, peaceful acoustic bell chord with soft decay
  chime: [
    { freq: MUSICAL_NOTES.C5, dur: 0.45, type: 'sine', gain: 0.35 },
    { freq: MUSICAL_NOTES.E5, dur: 0.45, type: 'sine', gain: 0.30 },
    { freq: MUSICAL_NOTES.G5, dur: 0.50, type: 'sine', gain: 0.32 },
    { freq: MUSICAL_NOTES.B5, dur: 0.60, type: 'sine', gain: 0.35 }
  ],

  // Notice / Button Interaction (Replaces generic harsh beep)
  notice: [
    { freq: MUSICAL_NOTES.E5, dur: 0.08, type: 'sine', gain: 0.30 },
    { freq: MUSICAL_NOTES.B5, dur: 0.14, type: 'sine', gain: 0.35 }
  ],

  // Sonar: Harmonic acoustic ping (Fundamental + 2nd harmonic with soft decay)
  sonar: [
    { freq: MUSICAL_NOTES.G5, dur: 0.25, type: 'sine', gain: 0.40 },
    { freq: MUSICAL_NOTES.D6, dur: 0.20, type: 'sine', gain: 0.25 }
  ],

  // Success / Online: Uplifting pentatonic flourish
  success: [
    { freq: MUSICAL_NOTES.G4, dur: 0.09, type: 'sine', gain: 0.30 },
    { freq: MUSICAL_NOTES.C5, dur: 0.09, type: 'triangle', gain: 0.35 },
    { freq: MUSICAL_NOTES.E5, dur: 0.09, type: 'sine', gain: 0.40 },
    { freq: MUSICAL_NOTES.G5, dur: 0.18, type: 'sine', gain: 0.45 }
  ]
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.isPlaying = false;
    this.activePreset = 'chime'; // Default to musical chime instead of harsh siren
    this.pitchMultiplier = 1.0;
    this.volume = 0.5;
    this.loopTimer = null;
    this.canvas = null;
    this.canvasCtx = null;
    this.animationId = null;
    this.activeNodes = [];
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
      try {
        await this.ctx.resume();
      } catch (_) {}
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  setPitch(multiplier) {
    this.pitchMultiplier = Math.max(0.4, Math.min(2.5, multiplier));
  }

  setPreset(presetName) {
    this.activePreset = presetName;
    if (this.isPlaying) {
      this.stopTone();
      this.startTone(presetName);
    }
  }

  /**
   * Plays a single musical note with a smooth ADSR acoustic envelope.
   * Eliminates clicks, pops, and harsh transitions.
   */
  playNote(freq, startTime, durationSec, type = 'sine', peakGain = 0.4) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    const actualFreq = freq * this.pitchMultiplier;
    osc.frequency.setValueAtTime(actualFreq, startTime);

    // Smooth ADSR Envelope
    const attack = 0.015; // 15ms gentle attack (never pops)
    const decay = durationSec * 0.85;
    const targetGain = Math.max(0.001, this.volume * peakGain);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(targetGain, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + decay);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + attack + decay + 0.02);

    this.activeNodes.push(osc);
    osc.onended = () => {
      const idx = this.activeNodes.indexOf(osc);
      if (idx !== -1) this.activeNodes.splice(idx, 1);
    };
  }

  /**
   * Resolves a preset name or note array into a sequence of musical notes.
   */
  resolveMelody(preset) {
    if (Array.isArray(preset)) return preset;
    const key = (preset || 'chime').toLowerCase();
    if (key === 'beep' || key === 'default') return MELODIC_PRESETS.notice;
    if (key === 'siren' || key === 'alarm') return MELODIC_PRESETS.alert;
    if (MELODIC_PRESETS[key]) return MELODIC_PRESETS[key];
    return MELODIC_PRESETS.chime;
  }

  /**
   * Plays a complete musical melody sequence once.
   */
  playMelody(preset = 'notice') {
    this.init(this.canvas);
    this.resume();
    const notes = this.resolveMelody(preset);
    let offset = 0;
    const now = this.ctx.currentTime;

    notes.forEach(n => {
      this.playNote(n.freq, now + offset, n.dur, n.type || 'sine', n.gain || 0.4);
      offset += n.dur * 0.9; // Smooth legato spacing
    });

    return offset;
  }

  /**
   * Backward-compatible playOneShot:
   * Instead of harsh random beeps, ALWAYS plays an elegant musical melody!
   */
  playOneShot(preset = 'notice', _durationMs = 200) {
    return this.playMelody(preset);
  }

  /**
   * Starts a continuous, harmonious loop of the selected melody.
   * Features a musical phrasing pause between repeats so it never drones harshly.
   */
  startTone(preset = this.activePreset) {
    this.init(this.canvas);
    this.resume();
    if (this.isPlaying) this.stopTone();

    this.isPlaying = true;
    this.activePreset = preset;

    const loopCycle = () => {
      if (!this.isPlaying) return;
      const melodyDuration = this.playMelody(this.activePreset);
      // Musical phrase pause: 600ms between repeats
      const loopDelay = Math.max(800, (melodyDuration * 1000) + 600);

      if (this.isPlaying) {
        this.loopTimer = setTimeout(loopCycle, loopDelay);
      }
    };

    loopCycle();
  }

  stopTone() {
    this.isPlaying = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }

    // Gracefully fade active notes
    try {
      this.activeNodes.forEach(node => {
        try { node.stop(); } catch (_) {}
      });
      this.activeNodes = [];
    } catch (_) {}
  }

  startVisualizer() {
    if (!this.canvasCtx || !this.analyser) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      this.animationId = requestAnimationFrame(draw);
      this.analyser.getByteFrequencyData(dataArray);

      const width = this.canvas.width;
      const height = this.canvas.height;
      this.canvasCtx.clearRect(0, 0, width, height);

      // Gradient fill for beautiful musical visualizer bars
      const barWidth = (width / bufferLength) * 2.2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;

        const grad = this.canvasCtx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, 'rgba(0, 242, 254, 0.25)');
        grad.addColorStop(0.5, 'rgba(0, 242, 254, 0.85)');
        grad.addColorStop(1, 'rgba(168, 85, 247, 0.95)');

        this.canvasCtx.fillStyle = grad;
        this.canvasCtx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
        if (x > width) break;
      }
    };

    if (!this.animationId) {
      draw();
    }
  }
}

export const audioEngine = new AudioEngine();
