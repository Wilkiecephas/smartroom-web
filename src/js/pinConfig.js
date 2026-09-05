/**
 * Pin Configuration & Sensor Setup Manager
 * Handles multi-board pin assignments, 5V-tolerance checks, custom instructions, and hotkeys.
 */

import { BOARD_PROFILES } from './boardProfiles.js';

export const DEFAULT_SENSOR_MAPPING = {
  dht11: {
    id: 'dht11',
    name: 'DHT11 Temp & Humidity',
    pin: 'D4',
    signalType: 'digital_bidirectional',
    voltageReq: '5V/3.3V (Pull-up)',
    hotkey: 'd',
    instructions: 'Built-in on 9-in-1 shield at pin D4. Single-wire digital communication with 10k pull-up resistor.',
    status: 'healthy'
  },
  buzzer: {
    id: 'buzzer',
    name: 'Alarm Buzzer',
    pin: 'D5',
    signalType: 'digital_output',
    voltageReq: '5V (Transistor Driven)',
    hotkey: 'b',
    instructions: 'Built-in on 9-in-1 shield at pin D5. Driven by an onboard NPN transistor switch. Active high or square-wave driven.',
    status: 'healthy'
  },
  ultrasonic_trig: {
    id: 'ultrasonic_trig',
    name: 'HC-SR04 Trig',
    pin: 'D0',
    signalType: 'digital_output',
    voltageReq: '3.3V Output (TTL High)',
    hotkey: 'u',
    instructions: 'Connected to HC-SR04 Trig pin. Sends 10µs ultrasonic trigger pulse. TTL logic compatible.',
    status: 'healthy'
  },
  ultrasonic_echo: {
    id: 'ultrasonic_echo',
    name: 'HC-SR04 Echo',
    pin: 'D1',
    signalType: 'digital_input',
    voltageReq: '5V Output (Tolerant Pin Req)',
    hotkey: 'e',
    instructions: 'Connected to HC-SR04 Echo pin. Must connect to a 5V tolerant pin as sensor outputs 5V pulse.',
    status: 'healthy'
  },
  pir_motion: {
    id: 'pir_motion',
    name: 'HC-SR501 PIR Motion',
    pin: 'D3',
    signalType: 'digital_input',
    voltageReq: '3.3V Logic Output',
    hotkey: 'm',
    instructions: 'Connected to HC-SR501 Out pin. Outputs 3.3V HIGH when human infrared motion is detected. Built-in 3.3V regulator.',
    status: 'healthy'
  },
  rgb_red: {
    id: 'rgb_red',
    name: 'RGB Red Channel',
    pin: 'A5',
    signalType: 'digital_output',
    voltageReq: '3.3V Logic',
    hotkey: 'r',
    instructions: 'Controls Red LED element on 9-in-1 shield. High indicates proximity breach.',
    status: 'healthy'
  },
  rgb_green: {
    id: 'rgb_green',
    name: 'RGB Green Channel',
    pin: 'A6',
    signalType: 'digital_output',
    voltageReq: '3.3V Logic',
    hotkey: 'g',
    instructions: 'Controls Green LED element on 9-in-1 shield. High indicates safe room state.',
    status: 'healthy'
  },
  rgb_blue: {
    id: 'rgb_blue',
    name: 'RGB Blue Channel',
    pin: 'A7',
    signalType: 'digital_output',
    voltageReq: '3.3V Logic',
    hotkey: 'l',
    instructions: 'Controls Blue LED element on 9-in-1 shield. High indicates motion triggered.',
    status: 'healthy'
  },
  ldr_light: {
    id: 'ldr_light',
    name: 'LDR Ambient Light Sensor',
    pin: 'A1',
    signalType: 'analog_input',
    voltageReq: '0 - 3.3V Analog ADC',
    hotkey: 'p',
    instructions: 'Built-in on 9-in-1 shield at pin A1. Measures room illumination through voltage divider circuit.',
    status: 'healthy'
  },
  lm35_temp: {
    id: 'lm35_temp',
    name: 'LM35 Precision Temperature',
    pin: 'A2',
    signalType: 'analog_input',
    voltageReq: '0 - 3.3V Analog ADC',
    hotkey: 't',
    instructions: 'Built-in on 9-in-1 shield at pin A2. Calibrated analog sensor producing 10mV/°C linear temperature output.',
    status: 'healthy'
  },
  potentiometer: {
    id: 'potentiometer',
    name: 'Rotary Potentiometer',
    pin: 'A0',
    signalType: 'analog_input',
    voltageReq: '0 - 3.3V Analog ADC',
    hotkey: 'k',
    instructions: 'Built-in on 9-in-1 shield at pin A0. 10k rotary dial for manual alarm frequency or threshold tuning.',
    status: 'healthy'
  },
  btn_key1: {
    id: 'btn_key1',
    name: 'Push Button Key 1',
    pin: 'D2',
    signalType: 'digital_input',
    voltageReq: '3.3V/5V Digital',
    hotkey: '1',
    instructions: 'Built-in push button on 9-in-1 shield connected to pin D2. Active HIGH when pressed.',
    status: 'healthy'
  },
  btn_key2: {
    id: 'btn_key2',
    name: 'Push Button Key 2',
    pin: 'D6',
    signalType: 'digital_input',
    voltageReq: '3.3V/5V Digital',
    hotkey: '2',
    instructions: 'Built-in push button on 9-in-1 shield connected to pin D3 / D6. Active HIGH when pressed.',
    status: 'healthy'
  },
  sz_hs100: {
    id: 'sz_hs100',
    name: 'SZ-HS100 Analog Humidity',
    pin: 'A0',
    signalType: 'analog_input',
    voltageReq: '0 - 3.3V Analog ADC',
    hotkey: 'h',
    instructions: 'SZ-HS100 relative humidity probe connected to analog pin A0. Red to 3.3V, Black to GND, Green/Output to A0.',
    status: 'healthy'
  }
};

class PinConfigManager {
  constructor() {
    this.storageKey = 'sr_sensor_pin_config_v3';
    this.boardKey = 'sr_active_board_v3';
    this.activeBoardId = this.loadActiveBoard();
    this.mapping = this.loadConfig();
    this.hotkeyHandlers = new Map();
    this.boardChangeListeners = new Set();
    this.initHotkeyListener();
  }

  loadActiveBoard() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.boardKey);
        if (saved && BOARD_PROFILES[saved]) return saved;
      }
    } catch (_) {}
    return 'spark_core';
  }

  setBoard(boardId) {
    if (!BOARD_PROFILES[boardId]) return;
    this.activeBoardId = boardId;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.boardKey, boardId);
      }
    } catch (_) {}

    // Apply default mapping for new board
    const board = BOARD_PROFILES[boardId];
    if (board.defaultMapping) {
      Object.entries(board.defaultMapping).forEach(([sensorId, pin]) => {
        if (this.mapping[sensorId]) {
          this.mapping[sensorId].pin = pin;
        }
      });
      this.saveConfig();
    }

    this.boardChangeListeners.forEach(fn => fn(board));
  }

  onBoardChange(cb) {
    this.boardChangeListeners.add(cb);
    return () => this.boardChangeListeners.delete(cb);
  }

  getActiveBoard() {
    return BOARD_PROFILES[this.activeBoardId] || BOARD_PROFILES['spark_core'];
  }

  getActivePins() {
    return this.getActiveBoard().pins || [];
  }

  loadConfig() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          return { ...DEFAULT_SENSOR_MAPPING, ...JSON.parse(saved) };
        }
      }
    } catch (e) {
      console.warn('Could not parse saved pin config, using defaults:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SENSOR_MAPPING));
  }

  saveConfig() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.mapping));
      }
    } catch (_) {}
  }

  resetDefaults() {
    const board = this.getActiveBoard();
    this.mapping = JSON.parse(JSON.stringify(DEFAULT_SENSOR_MAPPING));
    if (board.defaultMapping) {
      Object.entries(board.defaultMapping).forEach(([sensorId, pin]) => {
        if (this.mapping[sensorId]) {
          this.mapping[sensorId].pin = pin;
        }
      });
    }
    this.saveConfig();
  }

  updateSensor(id, fields) {
    if (this.mapping[id]) {
      this.mapping[id] = { ...this.mapping[id], ...fields };
      this.saveConfig();
    }
  }

  isPin5VTolerant(pinName) {
    const board = this.getActiveBoard();
    if (board.voltage.includes('5V Native')) return true; // Arduino Uno/Nano/Mega/DIP native 5V
    const pin = (board.pins || []).find(p => p.name === pinName);
    return pin ? !!pin.is5V : false;
  }

  validatePinAssignment(sensorId, newPin) {
    const sensor = this.mapping[sensorId];
    if (!sensor) return { valid: true };

    const is5V = this.isPin5VTolerant(newPin);
    const board = this.getActiveBoard();

    // If sensor outputs 5V (like HC-SR04 Echo) on a 3.3V-only pin
    if (sensorId === 'ultrasonic_echo' && !is5V) {
      return {
        valid: false,
        warning: `⚠️ VOLTAGE WARNING: ${newPin} on ${board.name} is NOT 5V tolerant! HC-SR04 Echo outputs 5V TTL pulses. Connecting without a voltage divider (1kΩ/2kΩ) may damage the MCU!`
      };
    }

    // Check if another sensor already uses this pin
    const conflict = Object.values(this.mapping).find(s => s.id !== sensorId && s.pin === newPin);
    if (conflict) {
      return {
        valid: true,
        notice: `Pin ${newPin} is also assigned to [${conflict.name}]. Ensure this is intentional (e.g. shared bus).`
      };
    }

    return { valid: true };
  }

  onHotkey(key, callback) {
    this.hotkeyHandlers.set(key.toLowerCase(), callback);
  }

  initHotkeyListener() {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
      }

      const key = e.key.toLowerCase();

      if (this.hotkeyHandlers.has(key)) {
        e.preventDefault();
        const handler = this.hotkeyHandlers.get(key);
        handler(key);
        return;
      }

      const sensor = Object.values(this.mapping).find(s => s.hotkey && s.hotkey.toLowerCase() === key);
      if (sensor && window.smartRoomApp) {
        e.preventDefault();
        window.smartRoomApp.handleSensorHotkey(sensor.id);
      }
    });
  }

  exportProfile() {
    return JSON.stringify({
      boardId: this.activeBoardId,
      mapping: this.mapping
    }, null, 2);
  }

  importProfile(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.boardId && BOARD_PROFILES[parsed.boardId]) {
        this.activeBoardId = parsed.boardId;
        localStorage.setItem(this.boardKey, parsed.boardId);
      }
      if (parsed.mapping) {
        this.mapping = { ...DEFAULT_SENSOR_MAPPING, ...parsed.mapping };
      } else {
        this.mapping = { ...DEFAULT_SENSOR_MAPPING, ...parsed };
      }
      this.saveConfig();
      return true;
    } catch (err) {
      console.error('Import failed:', err);
      return false;
    }
  }
}

export const pinConfig = new PinConfigManager();
export const SPARK_CORE_PINS = BOARD_PROFILES['spark_core'].pins;
