/**
 * Sensor Calibration & Individual Isolation Engine
 * Manages per-sensor calibration curves (offset, gain, two-point reference)
 * and individual sensor On/Off isolation toggles.
 */

export const SENSOR_CALIBRATION_DEFAULTS = {
  dht11_temp: {
    name: 'DHT11 Temperature',
    unit: '°C',
    offset: 0.0,
    gain: 1.0,
    enabled: true,
    min: 0,
    max: 50,
    step: 0.1,
    twoPoint: { raw1: 0, act1: 0, raw2: 100, act2: 100 }
  },
  dht11_hum: {
    name: 'DHT11 Humidity',
    unit: '%',
    offset: 0.0,
    gain: 1.0,
    enabled: true,
    min: 20,
    max: 95,
    step: 0.5,
    twoPoint: { raw1: 30, act1: 30, raw2: 80, act2: 80 }
  },
  sz_hs100_hum: {
    name: 'SZ-HS100 Analog Humidity',
    unit: '%',
    offset: 0.0,
    gain: 1.0,
    enabled: true,
    min: 0,
    max: 100,
    step: 0.5,
    twoPoint: { raw1: 10, act1: 10, raw2: 90, act2: 90 }
  },
  ultrasonic: {
    name: 'HC-SR04 Ultrasonic Distance',
    unit: 'cm',
    offset: 0.0,
    gain: 1.0,
    enabled: true,
    min: 2,
    max: 400,
    step: 0.5,
    twoPoint: { raw1: 10, act1: 10, raw2: 100, act2: 100 }
  },
  pir_motion: {
    name: 'HC-SR501 PIR Motion',
    unit: 'state',
    offset: 0,
    gain: 1.0,
    enabled: false,
    min: 0,
    max: 1,
    step: 1
  },
  buzzer: {
    name: 'Shield Alarm Buzzer',
    unit: 'state',
    offset: 0,
    gain: 1.0,
    enabled: true,
    min: 0,
    max: 1,
    step: 1
  },
  rgb: {
    name: 'RGB Status Light',
    unit: 'mode',
    offset: 0,
    gain: 1.0,
    enabled: true,
    min: 0,
    max: 1,
    step: 1
  },
  ldr_light: {
    name: 'LDR Ambient Light',
    unit: 'ADC',
    offset: 0,
    gain: 1.0,
    enabled: true,
    min: 0,
    max: 4095,
    step: 1,
    twoPoint: { raw1: 100, act1: 50, raw2: 3000, act2: 1500 }
  },
  lm35_temp: {
    name: 'LM35 Precision Temperature',
    unit: '°C',
    offset: 0.0,
    gain: 1.0,
    enabled: true,
    min: -10,
    max: 100,
    step: 0.1,
    twoPoint: { raw1: 0, act1: 0, raw2: 100, act2: 100 }
  },
  potentiometer: {
    name: 'Rotary Potentiometer',
    unit: '%',
    offset: 0,
    gain: 1.0,
    enabled: true,
    min: 0,
    max: 100,
    step: 1
  },
  buttons: {
    name: 'Push Buttons (Key 1 & 2)',
    unit: 'state',
    offset: 0,
    gain: 1.0,
    enabled: true,
    min: 0,
    max: 1,
    step: 1
  }
};

class CalibrationManager {
  constructor() {
    this.storageKey = 'sr_sensor_calibration_v2';
    this.sensors = this.loadConfig();
    this.listeners = new Set();
  }

  loadConfig() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          return { ...JSON.parse(JSON.stringify(SENSOR_CALIBRATION_DEFAULTS)), ...JSON.parse(saved) };
        }
      }
    } catch (e) {
      console.warn('Could not parse saved calibrations:', e);
    }
    return JSON.parse(JSON.stringify(SENSOR_CALIBRATION_DEFAULTS));
  }

  saveConfig() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.sensors));
      }
    } catch (_) {}
    this.notify();
  }

  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.sensors));
  }

  getSensor(sensorId) {
    return this.sensors[sensorId] || SENSOR_CALIBRATION_DEFAULTS[sensorId];
  }

  isSensorEnabled(sensorId) {
    const s = this.getSensor(sensorId);
    return s ? s.enabled !== false : true;
  }

  toggleSensor(sensorId, forceState) {
    if (!this.sensors[sensorId]) {
      this.sensors[sensorId] = { ...(SENSOR_CALIBRATION_DEFAULTS[sensorId] || { enabled: true }) };
    }
    const current = this.sensors[sensorId].enabled !== false;
    this.sensors[sensorId].enabled = forceState !== undefined ? forceState : !current;
    this.saveConfig();
    return this.sensors[sensorId].enabled;
  }

  setCalibration(sensorId, { offset, gain, twoPoint }) {
    if (!this.sensors[sensorId]) {
      this.sensors[sensorId] = { ...(SENSOR_CALIBRATION_DEFAULTS[sensorId] || {}) };
    }
    if (offset !== undefined) this.sensors[sensorId].offset = parseFloat(offset) || 0;
    if (gain !== undefined) this.sensors[sensorId].gain = parseFloat(gain) || 1.0;
    if (twoPoint !== undefined) this.sensors[sensorId].twoPoint = twoPoint;

    this.saveConfig();
  }

  computeTwoPointCurve(raw1, act1, raw2, act2) {
    const r1 = parseFloat(raw1);
    const a1 = parseFloat(act1);
    const r2 = parseFloat(raw2);
    const a2 = parseFloat(act2);

    if (isNaN(r1) || isNaN(a1) || isNaN(r2) || isNaN(a2) || Math.abs(r2 - r1) < 0.0001) {
      return { gain: 1.0, offset: 0.0 };
    }

    const gain = (a2 - a1) / (r2 - r1);
    const offset = a1 - (r1 * gain);
    return {
      gain: parseFloat(gain.toFixed(4)),
      offset: parseFloat(offset.toFixed(2))
    };
  }

  apply(sensorId, rawValue) {
    if (rawValue === null || rawValue === undefined) return null;

    const s = this.getSensor(sensorId);
    if (!s) return rawValue;

    if (s.enabled === false) {
      return {
        disabled: true,
        raw: rawValue,
        value: null
      };
    }

    const numericRaw = parseFloat(rawValue);
    if (isNaN(numericRaw)) return rawValue;

    const gain = s.gain !== undefined ? s.gain : 1.0;
    const offset = s.offset !== undefined ? s.offset : 0.0;
    const calibrated = (numericRaw * gain) + offset;

    return {
      disabled: false,
      raw: numericRaw,
      value: calibrated
    };
  }

  resetSensor(sensorId) {
    if (SENSOR_CALIBRATION_DEFAULTS[sensorId]) {
      this.sensors[sensorId] = JSON.parse(JSON.stringify(SENSOR_CALIBRATION_DEFAULTS[sensorId]));
      this.saveConfig();
    }
  }

  resetAll() {
    this.sensors = JSON.parse(JSON.stringify(SENSOR_CALIBRATION_DEFAULTS));
    this.saveConfig();
  }

  exportProfile() {
    return JSON.stringify(this.sensors, null, 2);
  }

  importProfile(json) {
    try {
      const parsed = JSON.parse(json);
      this.sensors = { ...JSON.parse(JSON.stringify(SENSOR_CALIBRATION_DEFAULTS)), ...parsed };
      this.saveConfig();
      return true;
    } catch (e) {
      console.error('Failed to import calibrations:', e);
      return false;
    }
  }
}

export const calibrationManager = new CalibrationManager();
