// src/js/addSensorModal.js
// UI modal for adding new sensor devices (BLE, WebSocket, Smartwatch)

import { SensorAdapter } from './sensorAdapter.js';

export class AddSensorModal {
  constructor() {
    this.modal = document.getElementById('addSensorModal');
    this.openBtn = document.getElementById('btnHeaderAddDevice'); // reuse existing Add Device button
    this.closeBtn = this.modal?.querySelector('.modal-close');
    this.setupListeners();
  }

  setupListeners() {
    if (this.openBtn) {
      this.openBtn.addEventListener('click', () => this.open());
    }
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    // Handle form submit
    const form = this.modal?.querySelector('#addSensorForm');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        this.handleSubmit(new FormData(form));
      });
    }
  }

  open() {
    if (this.modal) this.modal.style.display = 'block';
  }

  close() {
    if (this.modal) this.modal.style.display = 'none';
  }

  async handleSubmit(data) {
    const type = data.get('sensor-type');
    const connection = data.get('connection-method');
    let adapter;
    try {
      if (type === 'ble' && connection === 'bluetooth') {
        adapter = await SensorAdapter.createBleAdapter();
        await adapter.connect();
      } else if (type === 'websocket' && connection === 'ws') {
        const url = data.get('ws-url');
        adapter = SensorAdapter.createWebSocketAdapter(url);
        await adapter.connect();
      } else if (type === 'smartwatch' && connection === 'bluetooth') {
        adapter = await SensorAdapter.createSmartwatchAdapter();
        await adapter.connect();
      }
      // Register data flow to sensorRegistry
      if (adapter) {
        const sensorId = `${type}-${Date.now()}`;
        window.sensorRegistry.addSensor(sensorId, type);
        adapter.onData(payload => {
          window.sensorRegistry.updateData(sensorId, payload);
        });
        this.addSensorToList(sensorId, type);
        this.close();
      }
    } catch (err) {
      console.error('Sensor connection failed', err);
      alert('Failed to connect sensor: ' + err.message);
    }
  }

  addSensorToList(id, type) {
    const list = document.getElementById('sensorList');
    if (!list) return;
    const item = document.createElement('div');
    item.className = 'sensor-item glassmorphic';
    item.id = `sensor-${id}`;
    item.innerHTML = `<span class="sensor-type">${type}</span> <span class="sensor-status">🔄</span>`;
    list.appendChild(item);
    // Listen for updates
    window.sensorRegistry.onSensorData(id, data => {
      const el = document.getElementById(`sensor-${id}`);
      if (el) {
        el.querySelector('.sensor-status').textContent = JSON.stringify(data);
      }
    });
  }
}

// Initialize modal on page load
window.addEventListener('DOMContentLoaded', () => {
  new AddSensorModal();
});
