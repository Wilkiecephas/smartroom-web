// src/js/sensorAdapter.js
// Unified sensor connection abstraction for BLE, WebSocket (Wi‑Fi), and Smartwatch (BLE)

export class SensorAdapter {
  constructor() {
    this.listeners = new Set();
  }

  /** Register data callback */
  onData(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** Emit data to all listeners */
  _emit(data) {
    this.listeners.forEach(cb => cb(data));
  }

  /** Factory for BLE sensors */
  static async createBleAdapter(options = {}) {
    const adapter = new SensorAdapter();
    adapter.type = 'ble';
    adapter.device = null;
    adapter.server = null;
    adapter.txChar = null;
    adapter.rxChar = null;

    // Connect to BLE device using Web Bluetooth API
    adapter.connect = async () => {
      if (!navigator?.bluetooth) {
        throw new Error('Web Bluetooth not supported in this browser');
      }
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service (NUS)
          'environmental_sensing',
          'battery_service'
        ]
      });
      adapter.device = device;
      const server = await device.gatt.connect();
      adapter.server = server;

      // Nordic UART Service – TX (device -> app) & RX (app -> device)
      const service = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
      adapter.txChar = await service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e'); // Notify
      adapter.rxChar = await service.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e'); // Write

      // Enable notifications for incoming data
      await adapter.txChar.startNotifications();
      adapter.txChar.addEventListener('characteristicvaluechanged', event => {
        const value = new TextDecoder().decode(event.target.value);
        try {
          const json = JSON.parse(value);
          adapter._emit(json);
        } catch (_) {
          // fallback to raw string payload
          adapter._emit({ raw: value });
        }
      });
      return { success: true, deviceName: device.name || 'Unnamed BLE Peripheral' };
    };

    // Write data to the BLE peripheral
    adapter.send = async data => {
      if (!adapter.rxChar) {
        throw new Error('BLE not connected');
      }
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      const buffer = new TextEncoder().encode(payload);
      await adapter.rxChar.writeValue(buffer);
    };

    adapter.disconnect = () => {
      if (adapter.server?.connected) {
        adapter.server.disconnect();
      }
      adapter.device = null;
    };

    return adapter;
  }

  /** Factory for WebSocket (Wi‑Fi) sensors */
  static createWebSocketAdapter(url) {
    const adapter = new SensorAdapter();
    adapter.type = 'websocket';
    adapter.url = url;
    adapter.socket = null;

    adapter.connect = () => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(adapter.url);
        ws.onopen = () => {
          adapter.socket = ws;
          resolve({ success: true });
        };
        ws.onerror = err => reject(err);
        ws.onmessage = event => {
          try {
            const json = JSON.parse(event.data);
            adapter._emit(json);
          } catch (_) {
            adapter._emit({ raw: event.data });
          }
        };
        ws.onclose = () => {
          adapter.socket = null;
        };
      });
    };

    adapter.send = data => {
      if (!adapter.socket || adapter.socket.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected');
      }
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      adapter.socket.send(payload);
    };

    adapter.disconnect = () => {
      if (adapter.socket) {
        adapter.socket.close();
        adapter.socket = null;
      }
    };

    return adapter;
  }

  /** Factory for Smartwatch sensors (generic BLE) */
  static async createSmartwatchAdapter() {
    // For now reuse the BLE adapter – specific services can be added later
    return await SensorAdapter.createBleAdapter();
  }
}
