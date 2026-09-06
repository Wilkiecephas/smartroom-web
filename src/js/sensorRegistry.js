// src/js/sensorRegistry.js
// Central registry for connected sensors and their data streams

class SensorRegistry {
  constructor() {
    this.sensors = new Map(); // key: sensorId, value: { type, data, listeners }
  }

  addSensor(id, type) {
    if (!this.sensors.has(id)) {
      this.sensors.set(id, { type, data: null, listeners: new Set() });
    }
  }

  removeSensor(id) {
    this.sensors.delete(id);
  }

  updateData(id, payload) {
    const sensor = this.sensors.get(id);
    if (sensor) {
      sensor.data = payload;
      sensor.listeners.forEach(cb => cb(payload));
    }
  }

  onSensorData(id, cb) {
    const sensor = this.sensors.get(id);
    if (sensor) {
      sensor.listeners.add(cb);
      return () => sensor.listeners.delete(cb);
    }
    this.addSensor(id, 'unknown');
    return this.onSensorData(id, cb);
  }

  // Helper used by adapters to emit generic events
  _emit(event) {
    const { type, data, raw, id } = event;
    const sensorId = id || `${type}-${Date.now()}`;
    this.updateData(sensorId, data || raw);
  }
}

// expose a global instance for simplicity
window.sensorRegistry = new SensorRegistry();
