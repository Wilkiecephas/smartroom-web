/**
 * Universal IoT Gateway
 * Manages connections for custom REST, WebSocket, MQTT-over-WS, and BLE devices.
 * Provides a self-registration API hook so any flashed hardware can auto-add
 * itself to the dashboard without Particle servers.
 *
 * Part of SMART IOT HUB • Built by TekStep Apps Uganda (tekstepapps.org)
 */

import { deviceRegistry } from './deviceRegistry.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DEFAULT_POLL_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;
const SELF_REG_STORAGE_KEY = 'sr_self_registered_devices_v1';

// ---------------------------------------------------------------------------
// Gateway Connection Trackers
// ---------------------------------------------------------------------------
class GatewayConnection {
  constructor(device) {
    this.device = device;
    this.active = false;
    this.retryCount = 0;
    this.lastDataTs = null;
    this.latencyMs = 0;
    this.listeners = new Set();
    this._timer = null;
    this._ws = null;
  }

  onData(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  _emit(data) {
    this.lastDataTs = Date.now();
    this.listeners.forEach(fn => fn(data, this.device));
  }

  stop() {
    this.active = false;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    if (this._ws) {
      try { this._ws.close(); } catch (_) {}
      this._ws = null;
    }
  }
}

// ---------------------------------------------------------------------------
// REST Polling Connection
// ---------------------------------------------------------------------------
class RestConnection extends GatewayConnection {
  constructor(device) {
    super(device);
    this.endpoint = device.credentials?.endpoint || '';
    this.intervalMs = device.credentials?.pollIntervalMs || DEFAULT_POLL_MS;
  }

  async start() {
    if (this.active) return;
    this.active = true;
    await this._poll(); // immediate first poll
    this._timer = setInterval(() => this._poll(), this.intervalMs);
  }

  async _poll() {
    if (!this.active || !this.endpoint) return;
    const t0 = performance.now();
    try {
      const resp = await fetch(this.endpoint, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      this.latencyMs = Math.round(performance.now() - t0);
      this.retryCount = 0;
      this._emit(data);
    } catch (err) {
      this.latencyMs = Math.round(performance.now() - t0);
      this.retryCount++;
      console.warn(`[IoTGateway REST] ${this.device.name}: ${err.message} (retry #${this.retryCount})`);
    }
  }
}

// ---------------------------------------------------------------------------
// WebSocket Connection
// ---------------------------------------------------------------------------
class WebSocketConnection extends GatewayConnection {
  constructor(device) {
    super(device);
    this.wsEndpoint = device.credentials?.wsEndpoint || '';
    this._reconnectDelay = 2000;
  }

  start() {
    if (this.active) return;
    this.active = true;
    this._connect();
  }

  _connect() {
    if (!this.active || !this.wsEndpoint) return;
    try {
      this._ws = new WebSocket(this.wsEndpoint);

      this._ws.onopen = () => {
        console.log(`[IoTGateway WS] Connected: ${this.wsEndpoint}`);
        this._reconnectDelay = 2000;
        this.retryCount = 0;
      };

      this._ws.onmessage = (e) => {
        try {
          const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          const t0 = performance.now();
          this._emit(data);
          this.latencyMs = Math.round(performance.now() - t0);
        } catch (err) {
          console.warn(`[IoTGateway WS] JSON parse error: ${err.message}`);
        }
      };

      this._ws.onerror = () => {
        console.warn(`[IoTGateway WS] Error on ${this.wsEndpoint}`);
      };

      this._ws.onclose = () => {
        if (!this.active) return;
        this.retryCount++;
        this._reconnectDelay = Math.min(this._reconnectDelay * 1.5, MAX_RECONNECT_DELAY_MS);
        console.log(`[IoTGateway WS] Reconnecting in ${this._reconnectDelay}ms...`);
        this._timer = setTimeout(() => this._connect(), this._reconnectDelay);
      };
    } catch (err) {
      console.error(`[IoTGateway WS] Could not connect: ${err.message}`);
    }
  }

  send(message) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(typeof message === 'string' ? message : JSON.stringify(message));
    }
  }
}

// ---------------------------------------------------------------------------
// Vercel/Custom Server REST endpoint connector
// Polls the dashboard's own /api/telemetry?device=<id> to fetch latest data
// (used when device POSTs to /api/telemetry via internet)
// ---------------------------------------------------------------------------
class ServerApiConnection extends GatewayConnection {
  constructor(device) {
    super(device);
    this.apiBase = device.credentials?.apiBase || '/api';
    this.intervalMs = device.credentials?.pollIntervalMs || DEFAULT_POLL_MS;
  }

  async start() {
    if (this.active) return;
    this.active = true;
    await this._poll();
    this._timer = setInterval(() => this._poll(), this.intervalMs);
  }

  async _poll() {
    if (!this.active) return;
    const t0 = performance.now();
    try {
      const resp = await fetch(`${this.apiBase}/telemetry?device=${encodeURIComponent(this.device.id)}`, {
        signal: AbortSignal.timeout(5000)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      this.latencyMs = Math.round(performance.now() - t0);
      this.retryCount = 0;
      if (data && data.payload) {
        this._emit(data.payload);
      }
    } catch (err) {
      this.latencyMs = Math.round(performance.now() - t0);
      this.retryCount++;
      console.warn(`[IoTGateway Server] ${this.device.name}: ${err.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main IoT Gateway Manager
// ---------------------------------------------------------------------------
class IoTGateway {
  constructor() {
    /** @type {Map<string, GatewayConnection>} */
    this.connections = new Map();
    this.dataListeners = new Set();
    this.registrationListeners = new Set();
    this._selfRegPollTimer = null;
    this._lastRegTs = 0;
  }

  // --- Public Subscription API ---

  onData(cb) {
    this.dataListeners.add(cb);
    return () => this.dataListeners.delete(cb);
  }

  onNewDeviceRegistered(cb) {
    this.registrationListeners.add(cb);
    return () => this.registrationListeners.delete(cb);
  }

  // --- Connection Management ---

  /**
   * Start a connection for a given registered device.
   * Picks the right protocol based on device.connectionMethod.
   */
  startDevice(device) {
    if (!device) return;
    const existing = this.connections.get(device.id);
    if (existing) {
      existing.stop();
    }

    let conn = null;
    switch (device.connectionMethod) {
      case 'custom_rest':
        conn = new RestConnection(device);
        break;
      case 'websocket':
        conn = new WebSocketConnection(device);
        break;
      case 'server_api':
        conn = new ServerApiConnection(device);
        break;
      default:
        return; // handled by particleApi / webSerial / simulator
    }

    conn.onData((data, dev) => {
      this.dataListeners.forEach(fn => fn(dev.id, data, conn.latencyMs));
    });

    this.connections.set(device.id, conn);
    conn.start();
    console.log(`[IoTGateway] Started ${device.connectionMethod} connection for "${device.name}"`);
  }

  stopDevice(deviceId) {
    const conn = this.connections.get(deviceId);
    if (conn) {
      conn.stop();
      this.connections.delete(deviceId);
    }
  }

  stopAll() {
    this.connections.forEach(conn => conn.stop());
    this.connections.clear();
  }

  getConnectionStatus(deviceId) {
    const conn = this.connections.get(deviceId);
    if (!conn) return { active: false, latencyMs: 0, retryCount: 0, lastDataTs: null };
    return {
      active: conn.active,
      latencyMs: conn.latencyMs,
      retryCount: conn.retryCount,
      lastDataTs: conn.lastDataTs
    };
  }

  // --- Self-Registration API (browser side) ---

  /**
   * Processes a self-registration payload from a device.
   * Can be called:
   *   - When a device POSTs to /api/register and browser polls for it
   *   - When user manually pastes the JSON into the Auto-Discover UI
   *   - When a device announces itself over WebSocket/mDNS
   *
   * Expected payload:
   * {
   *   id: 'my_device_001',
   *   name: 'My Sensor Node',
   *   firmware: 'arduino' | 'micropython' | 'particle' | 'custom',
   *   connectionMethod: 'custom_rest' | 'websocket' | 'server_api',
   *   endpoint: 'http://192.168.1.100/telemetry',
   *   wsEndpoint: 'ws://192.168.1.100:81',
   *   zone: 'Lab Room A',
   *   sensorSchema: [
   *     { key: 'temp', label: 'Temperature', unit: '°C', type: 'gauge', min: 0, max: 60, icon: '🌡️' },
   *     { key: 'hum', label: 'Humidity', unit: '%', type: 'gauge', min: 0, max: 100, icon: '💧' }
   *   ]
   * }
   */
  registerFromPayload(payload) {
    if (!payload || !payload.id) return null;

    const connectionMethod = payload.connectionMethod || 'custom_rest';
    const credentials = {};
    if (payload.endpoint) credentials.endpoint = payload.endpoint;
    if (payload.wsEndpoint) credentials.wsEndpoint = payload.wsEndpoint;
    if (payload.apiBase) credentials.apiBase = payload.apiBase;
    if (payload.pollIntervalMs) credentials.pollIntervalMs = payload.pollIntervalMs;

    const device = deviceRegistry.registerDevice({
      id: payload.id,
      name: payload.name || 'Custom IoT Device',
      type: payload.firmware || 'custom',
      boardProfileId: payload.boardProfileId || 'esp32',
      connectionMethod,
      status: 'online',
      credentials,
      zone: payload.zone || 'Remote Node',
      sensorSchema: payload.sensorSchema || [],
      attachedSensors: payload.attachedSensors || []
    });

    // Persist to self-reg storage
    try {
      const stored = JSON.parse(localStorage.getItem(SELF_REG_STORAGE_KEY) || '[]');
      const idx = stored.findIndex(d => d.id === payload.id);
      if (idx >= 0) stored[idx] = payload;
      else stored.push(payload);
      localStorage.setItem(SELF_REG_STORAGE_KEY, JSON.stringify(stored));
    } catch (_) {}

    this.registrationListeners.forEach(fn => fn(device));
    this.startDevice(device);
    return device;
  }

  /**
   * Load previously self-registered devices from localStorage on startup.
   */
  restorePersistedConnections() {
    try {
      const stored = JSON.parse(localStorage.getItem(SELF_REG_STORAGE_KEY) || '[]');
      stored.forEach(payload => {
        // Only start gateway connections — skip re-registering in deviceRegistry (already loaded there)
        const device = deviceRegistry.getDevices().find(d => d.id === payload.id);
        if (device && ['custom_rest', 'websocket', 'server_api'].includes(device.connectionMethod)) {
          this.startDevice(device);
        }
      });
    } catch (_) {}
  }

  /**
   * Poll /api/register?since=<ts> to check for devices that self-registered via the server.
   */
  startServerRegistrationPolling(apiBase = '/api', intervalMs = 5000) {
    if (this._selfRegPollTimer) clearInterval(this._selfRegPollTimer);
    this._selfRegPollTimer = setInterval(async () => {
      try {
        const resp = await fetch(`${apiBase}/register?since=${this._lastRegTs}`, {
          signal: AbortSignal.timeout(3000)
        });
        if (!resp.ok) return;
        const { devices } = await resp.json();
        if (Array.isArray(devices) && devices.length > 0) {
          this._lastRegTs = Date.now();
          devices.forEach(payload => this.registerFromPayload(payload));
        }
      } catch (_) {}
    }, intervalMs);
  }

  stopServerRegistrationPolling() {
    if (this._selfRegPollTimer) {
      clearInterval(this._selfRegPollTimer);
      this._selfRegPollTimer = null;
    }
  }

  // --- Utility: generate registration code snippet ---

  /**
   * Returns a multi-language code snippet that a developer can add to their firmware
   * to auto-register with this dashboard.
   */
  generateRegistrationSnippet(options = {}) {
    const {
      deviceId = 'my_device_001',
      deviceName = 'My Custom Node',
      deviceIp = '192.168.1.XXX',
      firmware = 'arduino', // 'arduino', 'micropython', 'particle', 'nodemcu_lua', 'node_js'
      apiBase = window.location.origin + '/api',
      sensorSchema = [
        { key: 'temp', label: 'Temperature', unit: '°C', type: 'gauge', min: -40, max: 80, icon: '🌡️' },
        { key: 'hum', label: 'Humidity', unit: '%', type: 'gauge', min: 0, max: 100, icon: '💧' }
      ]
    } = options;

    const regPayload = JSON.stringify({
      id: deviceId,
      name: deviceName,
      firmware,
      connectionMethod: 'custom_rest',
      endpoint: `http://${deviceIp}/telemetry`,
      zone: 'Remote Zone',
      sensorSchema
    }, null, 2);

    const payloadOneLine = JSON.stringify({
      id: deviceId,
      name: deviceName,
      firmware,
      connectionMethod: 'custom_rest',
      endpoint: `http://${deviceIp}/telemetry`,
      zone: 'Remote Zone',
      sensorSchema
    });

    const snippets = {
      arduino: `
// === SmartRoom IoT Hub — Auto-Register Snippet (Arduino / ESP32) ===
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* DASHBOARD_API = "${apiBase}";
const char* DEVICE_ID     = "${deviceId}";
const char* DEVICE_IP     = "${deviceIp}";

void registerWithDashboard() {
  HTTPClient http;
  http.begin(String(DASHBOARD_API) + "/register");
  http.addHeader("Content-Type", "application/json");
  String payload = String(${JSON.stringify(payloadOneLine)});
  int code = http.POST(payload);
  Serial.printf("[SmartRoom] Self-register: HTTP %d\\n", code);
  http.end();
}

// Call registerWithDashboard() once in setup(), then post telemetry in loop():
void postTelemetry(float temp, float hum) {
  HTTPClient http;
  http.begin(String(DASHBOARD_API) + "/telemetry?device=" + DEVICE_ID);
  http.addHeader("Content-Type", "application/json");
  StaticJsonDocument<128> doc;
  doc["temp"] = temp;
  doc["hum"] = hum;
  String body;
  serializeJson(doc, body);
  http.POST(body);
  http.end();
}
`,
      micropython: `
# === SmartRoom IoT Hub — Auto-Register Snippet (MicroPython / CircuitPython) ===
import urequests, ujson, time

DASHBOARD_API = "${apiBase}"
DEVICE_ID = "${deviceId}"

REG_PAYLOAD = ujson.dumps(${JSON.stringify({
  id: deviceId, name: deviceName, firmware: 'micropython',
  connectionMethod: 'custom_rest',
  endpoint: `http://${deviceIp}/telemetry`,
  zone: 'Remote Zone', sensorSchema
})})

def register():
    r = urequests.post(DASHBOARD_API + "/register",
                       headers={"Content-Type": "application/json"},
                       data=REG_PAYLOAD)
    print("[SmartRoom] Registered:", r.status_code)
    r.close()

def post_telemetry(temp, hum):
    body = ujson.dumps({"temp": temp, "hum": hum})
    r = urequests.post(DASHBOARD_API + "/telemetry?device=" + DEVICE_ID,
                       headers={"Content-Type": "application/json"},
                       data=body)
    r.close()

# Call register() once at boot, then post_telemetry() in your loop
`,
      particle: `
// === SmartRoom IoT Hub — Auto-Register Snippet (Particle Photon/Argon) ===
#include "HttpClient.h"  // Install from Particle Library Manager

HttpClient http;
http_request_t req;
http_response_t res;
http_header_t headers[] = {
  { "Content-Type", "application/json" },
  { NULL, NULL }
};

void registerWithDashboard() {
  req.hostname = "${apiBase.replace('https://', '').replace('http://', '').split('/')[0]}";
  req.port = 443; // HTTPS
  req.path = "/api/register";
  req.body = String("${payloadOneLine.replace(/"/g, '\\"')}");
  http.post(req, res, headers);
  Particle.publish("sr_register", String(res.status), PRIVATE);
}
`,
      nodemcu_lua: `
-- === SmartRoom IoT Hub — Auto-Register Snippet (NodeMCU Lua / ESP8266) ===
local http = require("http")

local function register()
  http.post("${apiBase}/register",
    "Content-Type: application/json\\r\\n",
    '${payloadOneLine.replace(/'/g, "\\'")}',
    function(code, data)
      print("[SmartRoom] Registered: " .. code)
    end)
end

local function postTelemetry(temp, hum)
  local body = string.format('{"temp":%.1f,"hum":%.1f}', temp, hum)
  http.post("${apiBase}/telemetry?device=${deviceId}",
    "Content-Type: application/json\\r\\n",
    body, function(code, data) end)
end
`,
      node_js: `
// === SmartRoom IoT Hub — Auto-Register Snippet (Node.js / Raspberry Pi) ===
const fetch = require('node-fetch'); // npm install node-fetch

const DASHBOARD_API = '${apiBase}';
const DEVICE_ID = '${deviceId}';

async function register() {
  const res = await fetch(DASHBOARD_API + '/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(${JSON.stringify({ id: deviceId, name: deviceName, firmware: 'node_js', connectionMethod: 'custom_rest', endpoint: `http://${deviceIp}/telemetry`, zone: 'Remote Zone', sensorSchema })})
  });
  console.log('[SmartRoom] Registered:', res.status);
}

async function postTelemetry(data) {
  await fetch(DASHBOARD_API + '/telemetry?device=' + DEVICE_ID, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

register(); // call once
setInterval(() => postTelemetry({ temp: 24.5, hum: 55 }), 3000); // update every 3s
`
    };

    return snippets[firmware] || snippets.arduino;
  }
}

export const iotGateway = new IoTGateway();
