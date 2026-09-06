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
        throw new Error('Web Bluetooth not supported in this browser. Please use Chrome or Edge.');
      }
      const optionalServices = [
        '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service (NUS)
        '0000ffe0-0000-1000-8000-00805f9b34fb', // TI CC2541 / HM-10
        '4fafc201-1fb5-459e-8fcc-c5c9c331914b', // ESP32 sample
        '0000fff0-0000-1000-8000-00805f9b34fb',
        'environmental_sensing',
        'heart_rate',
        'battery_service',
        'health_thermometer'
      ];
      if (options.serviceUuid && !optionalServices.includes(options.serviceUuid.toLowerCase())) {
        optionalServices.push(options.serviceUuid.toLowerCase());
      }

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices
      });
      adapter.device = device;
      const server = await device.gatt.connect();
      adapter.server = server;

      let service = null;
      if (options.serviceUuid) {
        try { service = await server.getPrimaryService(options.serviceUuid.toLowerCase()); } catch (_) {}
      }
      if (!service) {
        for (const sId of optionalServices) {
          try {
            service = await server.getPrimaryService(sId);
            if (service) break;
          } catch (_) {}
        }
      }
      if (!service) {
        try {
          const services = await server.getPrimaryServices();
          if (services && services.length > 0) service = services[0];
        } catch (_) {}
      }

      if (service) {
        try {
          const chars = await service.getCharacteristics();
          for (const c of chars) {
            if (c.properties.notify || c.properties.indicate) {
              adapter.txChar = c;
              await c.startNotifications();
              c.addEventListener('characteristicvaluechanged', event => {
                const value = new TextDecoder().decode(event.target.value);
                try {
                  const json = JSON.parse(value);
                  adapter._emit(json);
                } catch (_) {
                  adapter._emit({ raw: value });
                }
              });
            }
            if (c.properties.write || c.properties.writeWithoutResponse) {
              adapter.rxChar = c;
            }
          }
        } catch (cErr) {
          console.warn('[BLE Adapter] Characteristic enumeration error:', cErr);
        }
      }
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
