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
  ultrasonic_echo: {
    id: 'ultrasonic_echo',
    name: 'HC-SR04 Echo (TX/D0)',
    pin: 'D0',
    signalType: 'digital_input',
    voltageReq: '5V Output (Tolerant Pin Req)',
    hotkey: 'e',
    instructions: 'Connected to 9-in-1 D0 (Shield TX). Receives 5V Echo pulse safely into 5V-tolerant Spark Core pin D0.',
    status: 'healthy'
  },
  ultrasonic_trig: {
    id: 'ultrasonic_trig',
    name: 'HC-SR04 Trig (RX/D1)',
    pin: 'D1',
    signalType: 'digital_output',
    voltageReq: '3.3V Output (TTL High)',
    hotkey: 'u',
    instructions: 'Connected to 9-in-1 D1 (Shield RX). Sends 10µs ultrasonic trigger pulse from Spark Core pin D1.',
    status: 'healthy'
  },
  pir_motion: {
    id: 'pir_motion',
    name: 'External Sensor / PIR / Dry Contact (D3)',
    pin: 'D3',
    signalType: 'digital_input',
    voltageReq: '5V Tolerant / Dry Contact (Pull-Up)',
    hotkey: 'm',
    instructions: 'Spark Core D3 is free from 9-in-1 shield. Connect external 12V PIR (dry contact to GND), HC-SR501, Flame DO, or Vibration sensor.',
    status: 'healthy'
  },
  aux_relay_d7: {
    id: 'aux_relay_d7',
    name: 'Aux Relay / Onboard Blue LED (D7)',
    pin: 'D7',
    signalType: 'digital_output',
    voltageReq: '3.3V/5V Digital Out',
    hotkey: 'o',
    instructions: 'Spark Core D7 is free from 9-in-1 shield. Drives onboard Blue LED and 5V/3.3V relay module for lights, fans, or sirens.',
    status: 'healthy'
  },
  aux_gas_a3: {
    id: 'aux_gas_a3',
    name: 'Aux Analog 1 / MQ-2 Gas (A3)',
    pin: 'A3',
    signalType: 'analog_input',
    voltageReq: '0 - 3.3V Analog ADC',
    hotkey: 'a',
    instructions: 'Spark Core A3 / 9-in-1 header A3. Connect MQ-2 smoke/gas, sound sensor analog out, or light probe.',
    status: 'healthy'
  },
  aux_soil_a6: {
    id: 'aux_soil_a6',
    name: 'Aux Analog 2 / Soil Moisture (A6)',
    pin: 'A6',
    signalType: 'analog_input',
    voltageReq: '0 - 3.3V Analog ADC',
    hotkey: 's',
    instructions: 'Spark Core A6 is completely free (unrouted to 9-in-1). 12-bit ADC / DAC / PWM. Great for soil moisture or current sensor.',
    status: 'healthy'
  },
  aux_flame_a7: {
    id: 'aux_flame_a7',
    name: 'Aux Analog 3 / Flame Sensor (A7)',
    pin: 'A7',
    signalType: 'analog_input',
    voltageReq: '0 - 3.3V Analog ADC',
    hotkey: 'f',
    instructions: 'Spark Core A7 is completely free. 12-bit ADC / Hardware Wakeup. Ideal for optical flame detector or battery monitor.',
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

  autoGatherSensorMapping(boardId = this.activeBoardId, liveTelemetry = {}) {
    const board = BOARD_PROFILES[boardId] || this.getActiveBoard();
    const pins = board.pins || [];
    const analogPins = pins.filter(p => p.type === 'analog').map(p => p.name);
    const digitalPins = pins.filter(p => p.type === 'digital').map(p => p.name);

    const gathered = {
      boardId: board.id,
      boardName: board.name,
      detectedSensors: [],
      newMapping: JSON.parse(JSON.stringify(this.mapping))
    };

    // 1. Humidity Mapping: Check if SZ-HS100 analog or DHT11 is detected
    const szAdc = liveTelemetry.szHum !== undefined ? liveTelemetry.szHum : (liveTelemetry.szRaw !== undefined ? liveTelemetry.szRaw : null);
    const hasSzAnalog = szAdc !== null && szAdc > 0;
    const szPin = analogPins.includes('A0') ? 'A0' : (analogPins[0] || 'A0');
    gathered.newMapping.sz_hs100 = {
      ...this.mapping.sz_hs100,
      pin: szPin,
      status: 'healthy',
      signalType: 'analog_input'
    };
    gathered.detectedSensors.push({
      id: 'sz_hs100',
      name: 'SZ-HS100 Analog Humidity',
      pin: szPin,
      signal: hasSzAnalog ? 'Active ADC Signal (Verified)' : '12-bit ADC Ready',
      status: 'online'
    });

    // 2. DHT11 Temp & Humidity
    const dhtPin = digitalPins.includes('D4') ? 'D4' : (digitalPins.find(p => this.isPin5VTolerant(p)) || digitalPins[0] || 'D4');
    gathered.newMapping.dht11 = { ...this.mapping.dht11, pin: dhtPin, status: 'healthy' };
    gathered.detectedSensors.push({
      id: 'dht11',
      name: 'DHT11 Temp & Humidity',
      pin: dhtPin,
      signal: 'Single-Wire Digital Protocol',
      status: 'online'
    });

    // 3. HC-SR04 Ultrasonic Distance (Trig D0, Echo D1)
    const trigPin = digitalPins.includes('D0') ? 'D0' : (digitalPins[1] || 'D0');
    const echoPin = digitalPins.includes('D1') ? 'D1' : (digitalPins.find(p => p !== trigPin && this.isPin5VTolerant(p)) || 'D1');
    gathered.newMapping.ultrasonic_trig = { ...this.mapping.ultrasonic_trig, pin: trigPin };
    gathered.newMapping.ultrasonic_echo = { ...this.mapping.ultrasonic_echo, pin: echoPin };
    gathered.detectedSensors.push({
      id: 'ultrasonic',
      name: 'HC-SR04 Ultrasonic Distance',
      pin: `${trigPin} (Trig) / ${echoPin} (Echo)`,
      signal: 'Echo Pulse Timing',
      status: 'online'
    });

    // 4. PIR Motion Sensor (D3)
    const pirPin = digitalPins.includes('D3') ? 'D3' : (digitalPins.find(p => p !== trigPin && p !== echoPin && p !== dhtPin) || 'D3');
    gathered.newMapping.pir_motion = { ...this.mapping.pir_motion, pin: pirPin };
    gathered.detectedSensors.push({
      id: 'pir_motion',
      name: 'HC-SR501 PIR Motion',
      pin: pirPin,
      signal: 'Digital Logic (0/1)',
      status: 'online'
    });

    // 5. LDR Ambient Light Sensor (A1)
    const ldrPin = analogPins.includes('A1') ? 'A1' : (analogPins.find(p => p !== szPin) || 'A1');
    gathered.newMapping.ldr_light = { ...this.mapping.ldr_light, pin: ldrPin };
    gathered.detectedSensors.push({
      id: 'ldr_light',
      name: 'LDR Photoresistor Light',
      pin: ldrPin,
      signal: 'Voltage Divider ADC',
      status: 'online'
    });

    // 6. Shield Alarm Buzzer (D5)
    const buzzerPin = digitalPins.includes('D5') ? 'D5' : 'D5';
    gathered.newMapping.buzzer = { ...this.mapping.buzzer, pin: buzzerPin };
    gathered.detectedSensors.push({
      id: 'buzzer',
      name: 'Shield Alarm Buzzer',
      pin: buzzerPin,
      signal: 'Transistor Output',
      status: 'online'
    });

    // 7. RGB Alert Indicator (A5, A6, A7)
    const redPin = analogPins.includes('A5') ? 'A5' : 'A5';
    const greenPin = analogPins.includes('A6') ? 'A6' : 'A6';
    const bluePin = analogPins.includes('A7') ? 'A7' : 'A7';
    gathered.newMapping.rgb_red = { ...this.mapping.rgb_red, pin: redPin };
    gathered.newMapping.rgb_green = { ...this.mapping.rgb_green, pin: greenPin };
    gathered.newMapping.rgb_blue = { ...this.mapping.rgb_blue, pin: bluePin };
    gathered.detectedSensors.push({
      id: 'rgb',
      name: 'RGB Status Indicator',
      pin: `${redPin} / ${greenPin} / ${bluePin}`,
      signal: '3-Channel Color Actuator',
      status: 'online'
    });

    return gathered;
  }

  applyGatheredMapping(newMapping) {
    this.mapping = { ...this.mapping, ...newMapping };
    this.saveConfig();
    const board = this.getActiveBoard();
    this.boardChangeListeners.forEach(fn => fn(board));
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
