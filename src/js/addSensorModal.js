// src/js/addSensorModal.js
// UI modal for adding new sensor devices (BLE, WebSocket, Smartwatch)

import { SensorAdapter } from './sensorAdapter.js';
import { postDevice } from './api.js';
import { showToast } from './toast.js';

export class AddSensorModal {
  constructor() {
    this.modal = document.getElementById('addSensorModal');
    this.openBtn = document.getElementById('btnHeaderAddDevice'); // reuse existing Add Device button
    this.closeBtn = this.modal?.querySelector('.modal-close');
    this.setupListeners();
    this.setupTypeToggle();
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
    // Build config based on type
    const config = {};
    if (type === 'mqtt') {
      config.broker = data.get('mqtt-broker');
      config.clientId = data.get('mqtt-clientid');
      config.username = data.get('mqtt-username');
      config.password = data.get('mqtt-password');
      config.topic = data.get('mqtt-topic');
    }
    // For BLE, WebSocket, Smartwatch we could extend config later
    try {
      // Register device via backend
      const result = await postDevice({ type, config });
      if (result.success) {
        const sensorId = `${type}-${Date.now()}`;
        window.sensorRegistry.addSensor(sensorId, type);
        this.addSensorToList(sensorId, type);
        showToast('Device registered successfully', 'success');
        this.close();
      } else {
        showToast('Failed to register device', 'error');
      }
    } catch (err) {
      console.error('Device registration error', err);
      showToast('Error registering device', 'error');
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
