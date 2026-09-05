/**
 * Connected Devices & Peripherals Registry Subsystem
 * Manages registered physical microcontrollers (Spark Core, USB Serial, WiFi)
 * and Virtual Simulation devices. Supports attaching/detaching sensors per device.
 * 
 * Part of SMART IOT HUB &bull; Built by TekStep Apps Uganda (tekstepapps.org)
 */

export const PRESET_DEVICES = [
  {
    id: 'dev_spark_core_primary',
    name: 'Spark Core (Master Chamber)',
    type: 'spark_core',
    boardProfileId: 'spark_core',
    connectionMethod: 'particle_cloud',
    status: 'online',
    credentials: {
      deviceId: '53ff6e066667574849402567',
      token: '2bb1082c94a974b77f88427f7fb28469ad46dc75'
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
    zone: 'Master Lab / Chamber',
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
    this.storageKey = 'sr_registered_devices_v2';
    this.activeKey = 'sr_active_device_id_v2';
    this.onboardingKey = 'sr_onboarding_completed_v2';
    this.projectKey = 'sr_active_project_name_v2';
    this.devices = this.loadDevices();
    this.activeDeviceId = this.loadActiveDeviceId();
    this.projectName = this.loadProjectName();
    this.listeners = new Set();
  }

  loadDevices() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
    } catch (_) {}
    return [...PRESET_DEVICES];
  }

  loadActiveDeviceId() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.activeKey);
        if (saved && this.devices.some(d => d.id === saved)) {
          return saved;
        }
      }
    } catch (_) {}
    // Default to the user's Spark Core if present, else first device
    const hasSpark = this.devices.some(d => d.id === 'dev_spark_core_primary');
    return hasSpark ? 'dev_spark_core_primary' : (this.devices[0] ? this.devices[0].id : null);
  }

  loadProjectName() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.projectKey);
        if (saved) return saved;
      }
    } catch (_) {}
    return 'Spark Core Sentinel Project';
  }

  save() {
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
    return this.projectName || 'Spark Core Sentinel Project';
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
      zone: deviceData.zone || 'Primary Zone',
      lastSeen: new Date().toISOString()
    };

    // Replace if exists, or append
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
    if (this.devices.length <= 1) {
      return false; // Preserve at least one device
    }
    this.devices = this.devices.filter(d => d.id !== id);
    if (this.activeDeviceId === id) {
      this.activeDeviceId = this.devices[0].id;
    }
    this.save();
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
