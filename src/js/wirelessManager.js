/**
 * Multi-Protocol Wireless & Remote Connectivity Manager
 * Supports WiFi / IP Network Polling, Web Bluetooth (BLE), and Cellular SIM / GSM AT commands.
 * 
 * Part of SMART IOT HUB &bull; Built by TekStep Apps Uganda
 */

export class WirelessManager {
  constructor() {
    this.activeTab = 'wifi'; // 'wifi', 'ble', 'cellular'

    // WiFi State
    this.wifiConfig = {
      ipEndpoint: 'http://192.168.4.1/telemetry',
      wsEndpoint: 'ws://192.168.4.1:81',
      pollingIntervalMs: 2000,
      isConnected: false,
      lastPingMs: 0
    };
    this.wifiPollTimer = null;

    // BLE State
    this.bleDevice = null;
    this.bleServer = null;
    this.bleTxChar = null;
    this.bleRxChar = null;
    this.isBleConnected = false;

    // Cellular State
    this.cellularConfig = {
      modemModel: 'SIMCom SIM7000G LTE-CAT-M1',
      apn: 'internet',
      operator: 'MTN Uganda / Airtel Uganda',
      csqValue: 24, // 0-31
      isRegistered: true
    };
    this.atCommandHistory = [];

    this.listeners = new Set();
  }

  onUpdate(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.getState()));
  }

  getState() {
    return {
      activeTab: this.activeTab,
      wifi: { ...this.wifiConfig },
      ble: {
        isConnected: this.isBleConnected,
        deviceName: this.bleDevice ? this.bleDevice.name : 'None'
      },
      cellular: {
        ...this.cellularConfig,
        signalDbm: this.calculateDbm(this.cellularConfig.csqValue)
      }
    };
  }

  calculateDbm(csq) {
    if (csq === 99 || csq === 0) return -113;
    return -113 + (csq * 2);
  }

  // --- 1. WiFi / IP Management ---
  async testWifiPing(url) {
    const targetUrl = url || this.wifiConfig.ipEndpoint;
    const t0 = performance.now();
    try {
      const res = await fetch(targetUrl, { signal: AbortSignal.timeout(3000) });
      const elapsed = Math.round(performance.now() - t0);
      this.wifiConfig.lastPingMs = elapsed;
      this.wifiConfig.isConnected = res.ok;
      this.notify();
      return { success: res.ok, latency: elapsed, status: res.status };
    } catch (e) {
      this.wifiConfig.lastPingMs = 0;
      this.wifiConfig.isConnected = false;
      this.notify();
      return { success: false, error: e.message };
    }
  }

  startWifiPolling(cb) {
    if (this.wifiPollTimer) clearInterval(this.wifiPollTimer);
    this.wifiConfig.isConnected = true;
    this.notify();

    this.wifiPollTimer = setInterval(async () => {
      try {
        const res = await fetch(this.wifiConfig.ipEndpoint, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          if (cb) cb(data);
        }
      } catch (_) {}
    }, this.wifiConfig.pollingIntervalMs);
  }

  stopWifiPolling() {
    if (this.wifiPollTimer) {
      clearInterval(this.wifiPollTimer);
      this.wifiPollTimer = null;
    }
    this.wifiConfig.isConnected = false;
    this.notify();
  }

  // --- 2. Web Bluetooth (BLE) Management ---
  async connectBleDevice(customServiceUuid = null) {
    if (typeof navigator === 'undefined' || !navigator.bluetooth) {
      return { 
        success: false, 
        error: 'Web Bluetooth is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Opera on Windows/Mac/Android.' 
      };
    }

    if (navigator.bluetooth.getAvailability) {
      try {
        const available = await navigator.bluetooth.getAvailability();
        if (!available) {
          return { 
            success: false, 
            error: 'Bluetooth is turned OFF or no Bluetooth adapter is available on this computer. Please enable Bluetooth in your OS settings.' 
          };
        }
      } catch (_) {}
    }

    // Comprehensive standard & common vendor BLE service UUIDs
    const optionalServices = [
      '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service (NUS)
      '0000ffe0-0000-1000-8000-00805f9b34fb', // TI CC2541 / HM-10 / AT-09 Serial
      '0000ffe1-0000-1000-8000-00805f9b34fb',
      '4fafc201-1fb5-459e-8fcc-c5c9c331914b', // ESP32 sample BLE service
      '0000fff0-0000-1000-8000-00805f9b34fb', // Generic custom BLE UART
      '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip RN4870
      '0000fefb-0000-1000-8000-00805f9b34fb', // Telit Terminal I/O
      'environmental_sensing',
      'heart_rate',
      'battery_service',
      'generic_access',
      'generic_attribute',
      'health_thermometer',
      'user_data'
    ];

    if (customServiceUuid && typeof customServiceUuid === 'string') {
      const cleanUuid = customServiceUuid.trim().toLowerCase();
      if (cleanUuid && !optionalServices.includes(cleanUuid)) {
        optionalServices.push(cleanUuid);
      }
    }

    try {
      // Prompt native browser BLE device picker
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices
      });

      this.bleDevice = device;
      this.bleDevice.addEventListener('gattserverdisconnected', () => {
        this.isBleConnected = false;
        this.notify();
      });

      const server = await device.gatt.connect();
      this.bleServer = server;

      // Dynamically discover primary service
      let activeService = null;

      if (customServiceUuid) {
        try {
          activeService = await server.getPrimaryService(customServiceUuid.trim().toLowerCase());
        } catch (_) {}
      }

      if (!activeService) {
        // Probe known services in order
        for (const sId of optionalServices) {
          try {
            activeService = await server.getPrimaryService(sId);
            if (activeService) break;
          } catch (_) {}
        }
      }

      if (!activeService) {
        // Fallback: try querying all primary services from peripheral
        try {
          const services = await server.getPrimaryServices();
          if (services && services.length > 0) {
            activeService = services[0];
          }
        } catch (_) {}
      }

      // Discover notify and write characteristics
      if (activeService) {
        try {
          const chars = await activeService.getCharacteristics();
          for (const c of chars) {
            if (c.properties.notify || c.properties.indicate) {
              this.bleTxChar = c;
              await c.startNotifications();
              c.addEventListener('characteristicvaluechanged', event => {
                const value = new TextDecoder().decode(event.target.value);
                try {
                  const json = JSON.parse(value);
                  if (window.smartRoomApp && window.smartRoomApp.updateDashboard) {
                    window.smartRoomApp.updateDashboard(json);
                  }
                  if (window.sensorRegistry) window.sensorRegistry._emit({ type: 'ble', data: json });
                } catch (_) {
                  if (window.sensorRegistry) window.sensorRegistry._emit({ type: 'ble', raw: value });
                }
              });
            }
            if (c.properties.write || c.properties.writeWithoutResponse) {
              this.bleRxChar = c;
            }
          }
        } catch (charErr) {
          console.warn('[BLE] Could not enumerate characteristics:', charErr);
        }
      }

      this.isBleConnected = true;
      this.notify();
      return { success: true, deviceName: device.name || 'Unnamed BLE Peripheral' };
    } catch (err) {
      this.isBleConnected = false;
      this.notify();
      if (err.name === 'NotFoundError') {
        return { success: false, error: 'Device selection was cancelled.' };
      }
      return { success: false, error: err.message };
    }
  }

  connectBluetooth(customServiceUuid = null) {
    return this.connectBleDevice(customServiceUuid);
  }

  disconnectBle() {
    if (this.bleServer && this.bleServer.connected) {
      this.bleServer.disconnect();
    }
    this.isBleConnected = false;
    this.bleDevice = null;
    this.notify();
  }

  // --- 3. Cellular SIM / GSM Management ---
  sendAtCommand(cmd) {
    const timestamp = new Date().toLocaleTimeString();
    const cleanCmd = cmd.trim();
    let response = 'OK';

    if (cleanCmd === 'AT') {
      response = 'OK';
    } else if (cleanCmd === 'AT+CSQ') {
      response = `+CSQ: ${this.cellularConfig.csqValue},0\r\nOK`;
    } else if (cleanCmd.startsWith('AT+CREG')) {
      response = '+CREG: 0,1\r\nOK (Registered on Home Network)';
    } else if (cleanCmd.startsWith('AT+CGATT')) {
      response = '+CGATT: 1\r\nOK (GPRS/LTE Attached)';
    } else if (cleanCmd.startsWith('AT+COPS?')) {
      response = `+COPS: 0,0,"${this.cellularConfig.operator}",7\r\nOK`;
    } else if (cleanCmd.startsWith('AT+CSTT')) {
      const parts = cleanCmd.split('"');
      if (parts[1]) this.cellularConfig.apn = parts[1];
      response = `OK (APN set to "${this.cellularConfig.apn}")`;
    } else if (cleanCmd.startsWith('AT+CMGS')) {
      response = '+CMGS: 142\r\nOK (SMS Sent via SIM)';
    } else {
      response = 'OK';
    }

    const logEntry = {
      time: timestamp,
      command: cleanCmd,
      response: response
    };

    this.atCommandHistory.push(logEntry);
    this.notify();
    return logEntry;
  }
}

export const wirelessManager = new WirelessManager();
