/**
 * Connected Devices & Peripherals Registry Subsystem
 * Manages registered physical microcontrollers (Spark Core, Arduino Uno, ESP32)
 * and Virtual Simulation devices. Supports attaching/detaching sensors per device.
 * 
 * Part of SMART IOT HUB &bull; Built by TekStep Apps Uganda (tekstepapps.org)
 */

import { supabaseService } from './supabaseClient.js';

/**
 * Connection methods supported by the Universal IoT Hub.
 * particle_cloud  — Particle Cloud REST API (Spark Core / Photon / Argon)
 * web_serial      — WebSerial USB UART (Arduino, RP2040, STM32, etc.)
 * wifi            — Direct Wi-Fi endpoint polling (legacy, use custom_rest)
 * virtual_simulation — Browser VM simulator
 * custom_rest     — HTTP REST polling of device's own endpoint
 * websocket       — WebSocket streaming from device
 * server_api      — Device POSTs to /api/telemetry on this server; browser polls
 * web_ble         — Web Bluetooth GATT
 * mqtt_ws         — MQTT over WebSocket (broker URL required)
 */
export const SUPPORTED_CONNECTION_METHODS = [
  { id: 'particle_cloud',      label: 'Particle Cloud (Spark Core / Photon)',     icon: '⚡', group: 'Cloud' },
  { id: 'web_serial',          label: 'USB Serial (WebSerial UART)',               icon: '🔌', group: 'Wired' },
  { id: 'custom_rest',         label: 'Custom REST / HTTP Polling',                icon: '🌐', group: 'Wireless' },
  { id: 'websocket',           label: 'WebSocket (Live Streaming)',                icon: '📡', group: 'Wireless' },
  { id: 'server_api',          label: 'Server API (Device → Dashboard Server)',    icon: '☁️',  group: 'Cloud' },
  { id: 'web_ble',             label: 'Web Bluetooth (BLE GATT)',                 icon: '🦷', group: 'Wireless' },
  { id: 'mqtt_ws',             label: 'MQTT over WebSocket',                      icon: '📨', group: 'Wireless' },
  { id: 'virtual_simulation',  label: 'Virtual Simulation (Browser VM)',           icon: '💻', group: 'Virtual' },
];

export const PRESET_DEVICES = [
  {
    id: 'dev_spark_core_primary',
    name: 'Spark Core (Master Chamber)',
    type: 'spark_core',
    boardProfileId: 'spark_core',
    connectionMethod: 'particle_cloud',
    status: 'online',
    credentials: {
      deviceId: '54ff74066678574924331067',
      token: 'a0797b36a33322a66526d0580e6fe270a5ade86f'
    },
    attachedSensors: [
      'dht11',
      'ultrasonic',
      'ldr_light',
      'lm35_temp',
      'potentiometer',
      'buzzer',
      'rgb_led'
    ],
    sensorSchema: [], // Known sensors resolved from AVAILABLE_SENSORS_CATALOG
    zone: 'Master Lab / Chamber',
    lastSeen: new Date().toISOString()
  },
  {
    id: 'dev_arduino_uno_primary',
    name: 'Arduino Uno R3 (9-in-1 Shield)',
    type: 'arduino_uno',
    boardProfileId: 'arduino_uno',
    connectionMethod: 'web_serial',
    status: 'ready',
    credentials: {
      baudRate: 115200,
      voltage: '5V'
    },
    attachedSensors: [
      'dht11',
      'ultrasonic',
      'pir_motion',
      'ldr_light',
      'lm35_temp',
      'potentiometer',
      'buzzer',
      'rgb_led'
    ],
    sensorSchema: [],
    zone: 'Hardware Electronics Bench',
    lastSeen: new Date().toISOString()
  },
  {
    id: 'dev_esp32_primary',
    name: 'ESP32 NodeMCU (Wi-Fi / BLE)',
    type: 'esp32',
    boardProfileId: 'esp32',
    connectionMethod: 'wifi',
    status: 'online',
    credentials: {
      ip: '192.168.1.145'
    },
    attachedSensors: [
      'dht11',
      'ultrasonic',
      'pir_motion',
      'ldr_light',
      'buzzer'
    ],
    sensorSchema: [],
    zone: 'Perimeter Node 1',
    lastSeen: new Date().toISOString()
  },
  {
    id: 'dev_virtual_sentinel',
    name: 'Virtual IoT Sentinel (Simulation)',
    type: 'virtual_sim',
    boardProfileId: 'spark_core',
    connectionMethod: 'virtual_simulation',
    status: 'simulated',
    credentials: {},
    attachedSensors: [
      'dht11',
      'ultrasonic',
      'pir_motion',
      'ldr_light',
      'lm35_temp',
      'potentiometer',
      'buzzer',
      'rgb_led',
      'amg8833_thermal',
      'drone_mavlink'
    ],
    sensorSchema: [],
    zone: 'Cyber Simulation Zone',
    lastSeen: new Date().toISOString()
  }
];

export const AVAILABLE_SENSORS_CATALOG = [
  { id: 'dht11', name: 'DHT11 Temperature & Humidity', icon: '🌡️', bus: '1-Wire (GPIO D4)', category: 'Environment' },
  { id: 'ultrasonic', name: 'HC-SR04 Ultrasonic Sonar (2-400cm)', icon: '🦇', bus: 'TTL Echo (D0/D1)', category: 'Proximity' },
  { id: 'pir_motion', name: 'HC-SR501 Passive Infrared Motion', icon: '🏃', bus: 'Digital (GPIO D3)', category: 'Security' },
  { id: 'ldr_light', name: 'LDR Ambient Light Lux Sensor', icon: '💡', bus: 'Analog ADC (Pin A1)', category: 'Light' },
  { id: 'lm35_temp', name: 'LM35 Centigrade Precision Temperature', icon: '🔥', bus: 'Analog ADC (Pin A2)', category: 'Temperature' },
  { id: 'potentiometer', name: 'Rotary Knob Potentiometer (0-100%)', icon: '🎛️', bus: 'Analog ADC (Pin A0)', category: 'Control' },
  { id: 'buzzer', name: 'Acoustic Piezo Alarm Buzzer', icon: '🔊', bus: 'Digital PWM (Pin D5)', category: 'Actuator' },
  { id: 'rgb_led', name: 'Tricolor RGB Cyber Indicator LED', icon: '🔴', bus: 'PWM DAC (A5/A6/A7)', category: 'Indicator' },
  { id: 'amg8833_thermal', name: 'Universal Multi-Spectrum Thermal Matrix (Air, Aquatic & Surface)', icon: '🌡️', bus: 'I2C Bus (0x69)', category: 'Thermal Vision' },
  { id: 'drone_mavlink', name: 'Universal Kinematics & Nav Telemetry (Flight, Swim, Glide, Direct)', icon: '🛸', bus: 'UART Telem (57600)', category: 'Universal Navigation' },
  { id: 'neo6m_gps', name: 'u-blox NEO-6M / M8N GNSS GPS Tracker', icon: '🛰️', bus: 'UART NMEA (9600)', category: 'Navigation' },
  { id: 'vl53l0x_lidar', name: 'VL53L0X Laser Time-of-Flight LiDAR', icon: '📏', bus: 'I2C Bus (0x29)', category: 'LiDAR Distance' },
  { id: 'soil_npk', name: 'RS485 7-in-1 Soil NPK & Moisture Probe', icon: '🌱', bus: 'RS485 Modbus RTU', category: 'Smart Agriculture' },
  { id: 'pzem_energy', name: 'PZEM-004T AC High-Voltage Power Meter', icon: '⚡', bus: 'TTL Serial (9600)', category: 'Energy & Power' },
  { id: 'max30102_oximeter', name: 'MAX30102 Heart Rate & SpO2 Oximeter', icon: '🫀', bus: 'I2C Bus (0x57)', category: 'Biomedical' }
];

class DeviceRegistry {
  constructor() {
    this.currentUser = supabaseService.getCurrentUser();
    this._resolveKeys();
    this.devices = this.loadDevices();
    this.activeDeviceId = this.loadActiveDeviceId();
    this.projectName = this.loadProjectName();
    this.listeners = new Set();

    // Listen to Supabase Auth changes (user switch, login, logout)
    supabaseService.onAuthChange((user) => {
      this.setUser(user);
    });
  }

  _resolveKeys() {
    const isOwner = supabaseService.isCurrentUserOwner();
    const uid = this.currentUser?.id || 'owner';
    if (isOwner) {
      this.storageKey = 'sr_registered_devices_v2';
      this.activeKey = 'sr_active_device_id_v2';
    } else {
      this.storageKey = `sr_registered_devices_v2_${uid}`;
      this.activeKey = `sr_active_device_id_v2_${uid}`;
    }
    this.onboardingKey = `sr_onboarding_completed_v2_${uid}`;
    this.projectKey = `sr_active_project_name_v2_${uid}`;
  }

  setUser(user) {
    this.currentUser = user;
    this._resolveKeys();
    this.devices = this.loadDevices();
    this.activeDeviceId = this.loadActiveDeviceId();
    this.projectName = this.loadProjectName();

    // If Supabase is connected, asynchronously fetch devices for this user
    if (supabaseService.isConfigured() && this.currentUser?.id) {
      supabaseService.fetchCloudDevices(this.currentUser.id).then(cloudDevices => {
        if (Array.isArray(cloudDevices) && cloudDevices.length > 0) {
          this.devices = cloudDevices;
          if (!this.devices.some(d => d.id === this.activeDeviceId)) {
            this.activeDeviceId = this.devices[0].id;
          }
          this.save(false); // save locally without re-pushing
          this.notify();
        }
      }).catch(err => console.warn('[Registry] Cloud sync error:', err));
    }

    this.notify();
  }

  loadDevices() {
    const isOwner = supabaseService.isCurrentUserOwner();
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            if (isOwner && parsed.length > 0) {
              let modified = false;
              // Self-heal: update any stale Spark Core device credentials for owner
              parsed.forEach(dev => {
                if (dev.type === 'spark_core') {
                  if (!dev.credentials || dev.credentials.deviceId === '53ff6e066667574849402567' || !dev.credentials.deviceId) {
                    dev.credentials = {
                      deviceId: '54ff74066678574924331067',
                      token: 'a0797b36a33322a66526d0580e6fe270a5ade86f'
                    };
                    modified = true;
                  }
                  // Self-heal: ensure disconnected PIR sensor does not trigger false intrusion alerts
                  if (!dev.userWiredPir && Array.isArray(dev.attachedSensors) && dev.attachedSensors.includes('pir_motion')) {
                    dev.attachedSensors = dev.attachedSensors.filter(s => s !== 'pir_motion');
                    modified = true;
                  }
                }
              });

              if (modified) {
                localStorage.setItem(this.storageKey, JSON.stringify(parsed));
              }
              return parsed;
            } else if (!isOwner) {
              // Non-owner: return their saved devices (or empty array if none)
              return parsed;
            }
          }
        }
      }
    } catch (_) {}

    // Owner gets preset devices (Spark Core running), other users get a blank workspace!
    if (isOwner) {
      return [...PRESET_DEVICES];
    } else {
      return []; // BLANK SLATE for other users until they add their hardware!
    }
  }

  loadActiveDeviceId() {
    const isOwner = supabaseService.isCurrentUserOwner();
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.activeKey);
        if (saved && this.devices.some(d => d.id === saved)) {
          return saved;
        }
      }
    } catch (_) {}

    if (isOwner) {
      const hasSpark = this.devices.some(d => d.id === 'dev_spark_core_primary');
      return hasSpark ? 'dev_spark_core_primary' : (this.devices[0] ? this.devices[0].id : null);
    } else {
      return this.devices[0] ? this.devices[0].id : null;
    }
  }

  loadProjectName() {
    const isOwner = supabaseService.isCurrentUserOwner();
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.projectKey);
        if (saved) return saved;
      }
    } catch (_) {}
    return isOwner ? 'SmartRoom IoT Sentinel Multi-Board Project' : 'My IoT Hardware Project';
  }

  save(syncCloud = true) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.devices));
        if (this.activeDeviceId) {
          localStorage.setItem(this.activeKey, this.activeDeviceId);
        } else {
          localStorage.removeItem(this.activeKey);
        }
        if (this.projectName) {
          localStorage.setItem(this.projectKey, this.projectName);
        }
      }
    } catch (_) {}

    // Cloud sync to Supabase if configured
    if (syncCloud && supabaseService.isConfigured() && this.currentUser?.id) {
      this.devices.forEach(dev => {
        supabaseService.syncDeviceToCloud(this.currentUser.id, dev);
      });
    }

    this.notify();
  }

  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.getActiveDevice(), this.devices, this.projectName));
  }

  getDevices() {
    return [...this.devices];
  }

  getProjectName() {
    return this.projectName || 'SmartRoom IoT Sentinel Multi-Board Project';
  }

  startNewProject(name = 'Clean Slate IoT Project') {
    this.devices = [];
    this.activeDeviceId = null;
    this.projectName = name;
    this.save();
    return true;
  }

  loadSparkCoreProject() {
    this.devices = [...PRESET_DEVICES];
    this.activeDeviceId = 'dev_spark_core_primary';
    this.projectName = 'Spark Core Sentinel Project';
    this.save();
    return this.getActiveDevice();
  }

  getActiveDevice() {
    if (this.devices.length === 0) return null;
    return this.devices.find(d => d.id === this.activeDeviceId) || this.devices[0] || null;
  }

  setActiveDevice(id) {
    if (this.devices.some(d => d.id === id)) {
      this.activeDeviceId = id;
      this.save();
      return true;
    }
    return false;
  }

  hasCompletedOnboarding() {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(this.onboardingKey) === 'true';
      }
    } catch (_) {}
    return false;
  }

  setCompletedOnboarding(completed = true) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.onboardingKey, completed ? 'true' : 'false');
      }
    } catch (_) {}
  }

  registerDevice(deviceData) {
    const id = deviceData.id || 'dev_' + Date.now();
    const newDev = {
      id,
      name: deviceData.name || 'New IoT Device',
      type: deviceData.type || 'spark_core',
      boardProfileId: deviceData.boardProfileId || 'spark_core',
      connectionMethod: deviceData.connectionMethod || 'particle_cloud',
      status: deviceData.status || 'online',
      credentials: deviceData.credentials || {},
      attachedSensors: deviceData.attachedSensors || ['dht11', 'ultrasonic', 'pir_motion', 'ldr_light'],
      /**
       * sensorSchema — array of custom sensor definitions for dynamic rendering.
       * Format: [{ key, label, unit, type, min, max, icon, category }]
       * Only needed for custom_rest / websocket / server_api devices.
       * Known devices (Spark Core, Arduino) resolve from AVAILABLE_SENSORS_CATALOG.
       */
      sensorSchema: deviceData.sensorSchema || [],
      zone: deviceData.zone || 'Primary Zone',
      lastSeen: new Date().toISOString()
    };

    const idx = this.devices.findIndex(d => d.id === id);
    if (idx >= 0) {
      this.devices[idx] = newDev;
    } else {
      this.devices.push(newDev);
    }

    this.activeDeviceId = id;
    this.setCompletedOnboarding(true);
    this.save();
    return newDev;
  }

  removeDevice(id) {
    const isOwner = supabaseService.isCurrentUserOwner();
    if (isOwner && this.devices.length <= 1) {
      return false;
    }
    this.devices = this.devices.filter(d => d.id !== id);
    if (this.activeDeviceId === id) {
      this.activeDeviceId = this.devices.length > 0 ? this.devices[0].id : null;
    }
    this.save();
    if (supabaseService.isConfigured()) {
      supabaseService.deleteDeviceFromCloud(id);
    }
    return true;
  }

  addSensorToActiveDevice(sensorId) {
    const active = this.getActiveDevice();
    if (!active) return false;

    if (!active.attachedSensors.includes(sensorId)) {
      active.attachedSensors.push(sensorId);
      this.save();
      return true;
    }
    return false;
  }

  removeSensorFromActiveDevice(sensorId) {
    const active = this.getActiveDevice();
    if (!active) return false;

    active.attachedSensors = active.attachedSensors.filter(s => s !== sensorId);
    this.save();
    return true;
  }
}

export const deviceRegistry = new DeviceRegistry();
