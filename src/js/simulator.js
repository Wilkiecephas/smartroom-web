/**
 * Sensor Simulation Engine & Testing Studio
 * Allows interactive stress-testing and demonstration of alerts without physical hardware.
 */

export class SensorSimulator {
  constructor() {
    this.enabled = false;
    this.temperature = 24.2;
    this.humidity = 52.0;
    this.distance = 165.0;
    this.motion = 0;
    this.light = 680;
    this.activeScenario = null;
    this.scenarioTimer = null;
  }

  getSnapshot() {
    if (this.enabled && !this.activeScenario) {
      // Natural organic drift for realistic demo
      this.temperature += (Math.random() - 0.5) * 0.15;
      this.humidity += (Math.random() - 0.5) * 0.3;
      this.temperature = Math.max(16, Math.min(38, this.temperature));
      this.humidity = Math.max(25, Math.min(90, this.humidity));

      if (Math.random() < 0.05) {
        // Occasional ambient distance shift
        this.distance = Math.round(140 + (Math.random() * 40));
      }
    }

    return {
      temperature: Math.round(this.temperature * 10) / 10,
      humidity: Math.round(this.humidity * 10) / 10,
      distance: Math.round(this.distance * 10) / 10,
      motion: this.motion,
      light: this.light,
      pot: 2048,
      temp2: Math.round((this.temperature * 1.01) * 10) / 10,
      isIrBroken: this.isIrBroken || false,
      timestamp: Date.now()
    };
  }

  triggerIrBreak(durationMs = 900) {
    this.isIrBroken = true;
    if (this.irTimeout) clearTimeout(this.irTimeout);
    this.irTimeout = setTimeout(() => {
      this.isIrBroken = false;
    }, durationMs);
  }

  setManualValue(field, value) {
    if (field === 'temperature') this.temperature = Number(value);
    if (field === 'humidity') this.humidity = Number(value);
    if (field === 'distance') this.distance = Number(value);
    if (field === 'motion') this.motion = Number(value);
    if (field === 'light') this.light = Number(value);
  }

  runScenario(scenarioName, onTickCallback) {
    this.stopScenario();
    this.activeScenario = scenarioName;

    if (scenarioName === 'intruder') {
      // Scenario: Intruder approaches sensor (<20cm) and triggers PIR motion & IR tripwire
      let step = 0;
      const sequence = [
        { dist: 160, motion: 0, ir: false },
        { dist: 120, motion: 0, ir: false },
        { dist: 75,  motion: 1, ir: true },  // IR tripwire triggered
        { dist: 35,  motion: 1, ir: true },  // IR sustained break
        { dist: 14,  motion: 1, ir: true },  // BREACH (<20cm)
        { dist: 10,  motion: 1, ir: true },  // IN CLOSE PROXIMITY
        { dist: 8,   motion: 1, ir: false },
        { dist: 40,  motion: 1, ir: false },
        { dist: 150, motion: 0, ir: false }
      ];

      this.scenarioTimer = setInterval(() => {
        if (step >= sequence.length) {
          this.stopScenario();
          return;
        }
        this.distance = sequence[step].dist;
        this.motion = sequence[step].motion;
        this.isIrBroken = sequence[step].ir;
        step++;
        if (onTickCallback) onTickCallback(this.getSnapshot(), 'intruder');
      }, 900);

    } else if (scenarioName === 'overheat') {
      // Scenario: Temperature spike
      let step = 0;
      const temps = [24, 27, 31, 35, 39, 42, 38, 30, 24];
      this.scenarioTimer = setInterval(() => {
        if (step >= temps.length) {
          this.stopScenario();
          return;
        }
        this.temperature = temps[step];
        step++;
        if (onTickCallback) onTickCallback(this.getSnapshot(), 'overheat');
      }, 800);

    } else if (scenarioName === 'normal') {
      // Reset to safe normal baseline
      this.temperature = 23.5;
      this.humidity = 48.0;
      this.distance = 180.0;
      this.motion = 0;
      this.light = 750;
      this.stopScenario();
      if (onTickCallback) onTickCallback(this.getSnapshot(), 'normal');
    }
  }

  stopScenario() {
    if (this.scenarioTimer) {
      clearInterval(this.scenarioTimer);
      this.scenarioTimer = null;
    }
    this.activeScenario = null;
  }
}

export const sensorSimulator = new SensorSimulator();
