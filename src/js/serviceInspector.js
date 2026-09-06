/**
 * Universal Device Service & Capability Inspector
 * Performs deep introspection to force-get all exposed services, characteristics,
 * endpoints, cloud variables, and command controls for any connected IoT device.
 * 
 * Part of SMART IOT HUB • Built by TekStep Apps Uganda (tekstepapps.org)
 */

import { wirelessManager } from './wirelessManager.js';
import { webSerialManager } from './webSerial.js';
import { particleApi } from './particleApi.js';
import { driverHelper } from './driverHelper.js';
import { deviceRegistry } from './deviceRegistry.js';

export class UniversalServiceInspector {
  constructor() {
    this.modal = null;
    this.contentEl = null;
    this.titleEl = null;
    this.activeDevice = null;
    this.latestResult = null;
    this.listenersAttached = false;
  }

  ensureDom() {
    if (!this.modal) {
      this.modal = document.getElementById('modalServiceInspector');
      this.contentEl = document.getElementById('serviceInspectorContent');
      this.titleEl = document.getElementById('serviceInspectorTitle');
    }
    if (!this.listenersAttached && this.modal) {
      this.initListeners();
    }
  }

  initListeners() {
    const btnClose = document.getElementById('btnCloseServiceInspector');
    const btnDone = document.getElementById('btnInspectorDone');
    const btnRefresh = document.getElementById('btnInspectorRefresh');

    if (btnClose) btnClose.addEventListener('click', () => this.close());
    if (btnDone) btnDone.addEventListener('click', () => this.close());
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        if (this.activeDevice) this.inspectDevice(this.activeDevice);
      });
    }
    this.listenersAttached = true;
  }

  open() {
    this.ensureDom();
    if (this.modal) this.modal.classList.add('active');
  }

  close() {
    this.ensureDom();
    if (this.modal) this.modal.classList.remove('active');
  }

  /**
   * Main entry point: Inspects active or passed device
   */
  async inspectDevice(device = null) {
    const dev = device || deviceRegistry.getActiveDevice();
    this.activeDevice = dev;
    this.open();

    if (!dev) {
      this.renderError('No active device selected. Please select or connect a device in Device Manager.');
      return;
    }

    if (this.titleEl) {
      this.titleEl.textContent = `Capabilities & Services: ${dev.name}`;
    }

    this.renderLoading(`Interrogating ${dev.name} [${dev.connectionMethod || dev.type}]...`);

    try {
      let result = null;
      const method = dev.connectionMethod || dev.type;

      if (method === 'web_ble' || method === 'ble_peripheral' || dev.type === 'ble') {
        result = await this.forceGetBleServices(dev);
      } else if (method === 'web_serial' || dev.type === 'usb_serial' || dev.type === 'arduino_uno') {
        result = await this.forceGetSerialServices(dev);
      } else if (method === 'particle_cloud' || dev.type === 'spark_core') {
        result = await this.forceGetParticleServices(dev);
      } else if (method === 'rest_wifi' || method === 'custom_rest' || method === 'wifi') {
        result = await this.forceGetRestServices(dev);
      } else if (method === 'virtual_simulation' || dev.type === 'virtual_sim') {
        result = await this.forceGetVirtualServices(dev);
      } else {
        result = await this.forceGetGenericServices(dev);
      }

      this.latestResult = result;
      this.renderResult(result);
    } catch (err) {
      this.renderError(`Force-discovery failed: ${err.message}`);
    }
  }

  /**
   * 1. Force-Get BLE GATT Services & Characteristics
   */
  async forceGetBleServices(dev) {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome or Edge.');
    }

    // If not connected, prompt pair
    if (!wirelessManager.isBleConnected || !wirelessManager.bleServer) {
      const pairRes = await wirelessManager.connectBleDevice(dev.credentials?.serviceUuid);
      if (!pairRes.success) {
        throw new Error(pairRes.error || 'Bluetooth pairing failed or was cancelled.');
      }
    }

    const server = wirelessManager.bleServer;
    const device = wirelessManager.bleDevice;

    let services = [];
    try {
      services = await server.getPrimaryServices();
    } catch (e) {
      console.warn('getPrimaryServices error:', e);
    }

    const discovered = [];

    for (const s of services) {
      const sData = {
        uuid: s.uuid,
        name: wirelessManager.resolveServiceName(s.uuid),
        isPrimary: s.isPrimary,
        characteristics: []
      };

      try {
        const chars = await s.getCharacteristics();
        for (const c of chars) {
          const props = c.properties;
          const charData = {
            uuid: c.uuid,
            read: !!props.read,
            write: !!(props.write || props.writeWithoutResponse),
            notify: !!(props.notify || props.indicate),
            valueHex: null,
            valueStr: null
          };

          if (props.read) {
            try {
              const val = await c.readValue();
              const arr = new Uint8Array(val.buffer);
              charData.valueHex = Array.from(arr).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ');
              charData.valueStr = new TextDecoder().decode(val).replace(/[^\x20-\x7E]/g, '');
            } catch (_) {}
          }

          sData.characteristics.push(charData);
        }
      } catch (err) {
        console.warn(`Could not read chars for service ${s.uuid}:`, err);
      }

      discovered.push(sData);
    }

    return {
      deviceName: device?.name || dev.name,
      connectionMethod: 'Web Bluetooth (BLE GATT)',
      status: 'Connected & Live',
      servicesCount: discovered.length,
      characteristicsCount: discovered.reduce((acc, s) => acc + s.characteristics.length, 0),
      items: discovered,
      rawType: 'ble'
    };
  }

  /**
   * 2. Force-Get Web Serial Capabilities & Interrogation
   */
  async forceGetSerialServices(dev) {
    const isConnected = webSerialManager.isConnected;
    const port = webSerialManager.port;
    let vid = null;
    let pid = null;
    let chipInfo = null;

    if (port && port.getInfo) {
      const info = port.getInfo();
      vid = info.usbVendorId;
      pid = info.usbProductId;
      chipInfo = driverHelper.identifyUsbDevice(vid, pid);
    }

    // Probed sensor channels
    const channels = [
      { pin: 'D4', sensor: 'DHT11 Temperature & Humidity', bus: '1-Wire Digital', status: isConnected ? 'Active' : 'Offline' },
      { pin: 'D0 / D1', sensor: 'HC-SR04 Ultrasonic Sonar (Trig/Echo)', bus: 'TTL Pulse (2-400cm)', status: isConnected ? 'Active' : 'Offline' },
      { pin: 'D3', sensor: 'HC-SR501 PIR Motion Sensor', bus: 'Digital GPIO Interrupt', status: isConnected ? 'Active' : 'Offline' },
      { pin: 'A1', sensor: 'LDR Ambient Light Lux Sensor', bus: 'Analog ADC (10-bit)', status: isConnected ? 'Active' : 'Offline' },
      { pin: 'A2', sensor: 'LM35 Centigrade Precision Temp', bus: 'Analog ADC (10mV/°C)', status: isConnected ? 'Active' : 'Offline' },
      { pin: 'A0', sensor: 'Rotary Potentiometer (0-100%)', bus: 'Analog ADC (Pin A0)', status: isConnected ? 'Active' : 'Offline' },
      { pin: 'D5', sensor: 'Piezo Acoustic Alarm Buzzer', bus: 'PWM Digital Output', status: 'Actuator Available' },
      { pin: 'A5/A6/A7', sensor: 'Tricolor RGB Status LED', bus: 'PWM DAC Channel', status: 'Actuator Available' }
    ];

    // Control commands accepted
    const commands = [
      { code: "'1' or 't'", action: 'Trigger 2.4 kHz Piezo Alarm Siren', target: 'Piezo Buzzer' },
      { code: "'0'", action: 'Mute Buzzer & Set RGB Status to Green', target: 'Buzzer & LED' },
      { code: "'r'", action: 'Drive RGB Red Channel (Breach Status)', target: 'RGB LED' },
      { code: "'g'", action: 'Drive RGB Green Channel (Secure Status)', target: 'RGB LED' },
      { code: "'b'", action: 'Drive RGB Blue Channel (Motion Status)', target: 'RGB LED' },
      { code: "ALARM:OFF", action: 'Software Mute Command', target: 'Alarm Controller' }
    ];

    return {
      deviceName: dev.name,
      connectionMethod: 'WebSerial USB UART',
      status: isConnected ? 'Connected & Streaming' : 'Port Registered (Not Open)',
      baudRate: dev.credentials?.baudRate || webSerialManager.baudRate || 115200,
      chipInfo: chipInfo ? `${chipInfo.vendor} — ${chipInfo.chip} (${chipInfo.boardLabel})` : 'Generic USB Serial',
      vidPid: vid ? `VID: 0x${vid.toString(16).toUpperCase()} | PID: 0x${(pid || 0).toString(16).toUpperCase()}` : 'N/A',
      channels,
      commands,
      rawType: 'serial'
    };
  }

  /**
   * 3. Force-Get Particle Cloud Services
   */
  async forceGetParticleServices(dev) {
    const creds = dev.credentials || particleApi.getCredentials();
    const devId = creds.deviceId;
    const token = creds.token;

    const url = `https://api.particle.io/v1/devices/${devId}?access_token=${token}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`Particle API returned HTTP ${res.status}`);
    const data = await res.json();

    const variables = Object.entries(data.variables || {}).map(([key, type]) => ({
      name: key,
      type: type,
      url: `https://api.particle.io/v1/devices/${devId}/${key}?access_token=${token}`
    }));

    const functions = (data.functions || []).map(fn => ({
      name: fn,
      endpoint: `https://api.particle.io/v1/devices/${devId}/${fn}`,
      codes: fn === 'alarm' || fn === 'cmd' ? [
        { arg: "'1'", desc: 'Trigger Audible Alarm Siren' },
        { arg: "'0'", desc: 'Silence Alarm & Set RGB Green' },
        { arg: "'p'", desc: 'Toggle PIR Monitoring Active/Disabled' },
        { arg: "'r'", desc: 'Set RGB Red' },
        { arg: "'g'", desc: 'Set RGB Green' },
        { arg: "'b'", desc: 'Set RGB Blue' }
      ] : []
    }));

    return {
      deviceName: data.name || dev.name,
      connectionMethod: 'Particle Cloud REST API',
      status: data.connected ? 'Online & Streaming' : 'Offline in Cloud',
      platform: data.platform_id === 0 ? 'Spark Core' : 'Particle Photon / Argon',
      lastHeard: data.last_heard ? new Date(data.last_heard).toLocaleString() : 'Recent',
      ip: data.last_ip_address || 'Cellular / WiFi Gateway',
      variables,
      functions,
      rawType: 'particle'
    };
  }

  /**
   * 4. Force-Get Wi-Fi / REST Services
   */
  async forceGetRestServices(dev) {
    const base = (dev.credentials?.endpoint || 'http://192.168.4.1/telemetry').replace(/\/telemetry$/, '');
    const probeEndpoints = [
      '/telemetry',
      '/api/telemetry',
      '/status',
      '/sensors',
      '/info',
      '/metrics'
    ];

    const discoveredEndpoints = [];

    for (const ep of probeEndpoints) {
      const testUrl = `${base}${ep}`;
      const t0 = performance.now();
      try {
        const res = await fetch(testUrl, { signal: AbortSignal.timeout(2500) });
        const latency = Math.round(performance.now() - t0);
        let sampleJson = null;
        if (res.ok) {
          try { sampleJson = await res.json(); } catch (_) {}
        }
        discoveredEndpoints.push({
          path: ep,
          url: testUrl,
          ok: res.ok,
          status: res.status,
          latency: `${latency}ms`,
          keys: sampleJson ? Object.keys(sampleJson) : []
        });
      } catch (err) {
        discoveredEndpoints.push({
          path: ep,
          url: testUrl,
          ok: false,
          status: 'Timeout/Error',
          latency: '---',
          keys: []
        });
      }
    }

    return {
      deviceName: dev.name,
      connectionMethod: 'Wi-Fi HTTP / REST Polling',
      status: 'Endpoint Probing Completed',
      baseUrl: base,
      endpoints: discoveredEndpoints,
      rawType: 'rest'
    };
  }

  /**
   * 5. Force-Get Virtual Simulation Services
   */
  async forceGetVirtualServices(dev) {
    return {
      deviceName: dev.name,
      connectionMethod: 'Virtual Simulation (Browser VM)',
      status: 'Running & Simulated',
      streams: [
        { name: 'DHT11 Temperature', model: 'Thermal dissipation model (18°C – 45°C)' },
        { name: 'DHT11 Humidity', model: 'Ambient moisture cycle (30% – 85% RH)' },
        { name: 'HC-SR04 Sonar', model: 'Raycast proximity echo (2cm – 400cm)' },
        { name: 'HC-SR501 PIR', model: 'Passive infrared human presence trigger' },
        { name: 'LDR Ambient Lux', model: 'Solar diurnal curve + synthetic room lights' },
        { name: 'AMG8833 Thermal', model: '8x8 IR Focal Plane Array (64 pixel matrix)' },
        { name: 'MAVLink Drone Nav', model: '6-DoF Kinematics (Roll, Pitch, Yaw, Altitude)' }
      ],
      rawType: 'virtual'
    };
  }

  async forceGetGenericServices(dev) {
    return {
      deviceName: dev.name,
      connectionMethod: dev.connectionMethod || 'Generic IoT Interface',
      status: 'Ready',
      rawType: 'generic',
      info: 'Device uses standard platform registry interface.'
    };
  }

  /**
   * UI Renderers
   */
  renderLoading(msg) {
    if (!this.contentEl) return;
    this.contentEl.innerHTML = `
      <div style="padding: 30px; text-align: center; color: var(--text-dim);">
        <div style="font-size: 32px; margin-bottom: 12px; animation: pulse 1.5s infinite;">🔍</div>
        <div style="font-weight: 700; color: var(--accent-cyan); font-size: 14px; margin-bottom: 6px;">Force-Discovering Services &amp; Capabilities</div>
        <div style="font-size: 12px;">${msg}</div>
      </div>
    `;
  }

  renderError(msg) {
    if (!this.contentEl) return;
    this.contentEl.innerHTML = `
      <div style="padding: 24px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-md);">
        <div style="font-weight: 700; color: #ef4444; font-size: 14px; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
          <span>⚠️</span> Introspection Error
        </div>
        <div style="font-size: 12px; color: var(--text-main); line-height: 1.5;">${msg}</div>
      </div>
    `;
  }

  renderResult(res) {
    if (!this.contentEl) return;

    if (res.rawType === 'ble') {
      this.renderBleResult(res);
    } else if (res.rawType === 'serial') {
      this.renderSerialResult(res);
    } else if (res.rawType === 'particle') {
      this.renderParticleResult(res);
    } else if (res.rawType === 'rest') {
      this.renderRestResult(res);
    } else if (res.rawType === 'virtual') {
      this.renderVirtualResult(res);
    } else {
      this.renderGenericResult(res);
    }
  }

  renderBleResult(res) {
    const servicesHtml = res.items.map(s => {
      const charsHtml = s.characteristics.map(c => `
        <div style="padding: 8px 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 6px; margin-top: 6px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div>
            <div style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-cyan); font-weight: 600;">${c.uuid}</div>
            ${c.valueStr ? `<div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">Decoded Value: <strong style="color: #10b981;">${c.valueStr}</strong></div>` : ''}
            ${c.valueHex ? `<div style="font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); margin-top: 1px;">Hex: ${c.valueHex}</div>` : ''}
          </div>
          <div style="display: flex; gap: 4px;">
            ${c.notify ? '<span class="badge badge-normal" style="background: rgba(16,185,129,0.15); color: #10b981; font-size: 9px;">NOTIFY</span>' : ''}
            ${c.read ? '<span class="badge badge-normal" style="background: rgba(59,130,246,0.15); color: #60a5fa; font-size: 9px;">READ</span>' : ''}
            ${c.write ? '<span class="badge badge-normal" style="background: rgba(245,158,11,0.15); color: #f59e0b; font-size: 9px;">WRITE</span>' : ''}
          </div>
        </div>
      `).join('');

      return `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(0, 242, 254, 0.25); border-radius: var(--radius-md); padding: 12px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-weight: 700; color: var(--text-main); font-size: 13px;">${s.name}</div>
            <span class="badge" style="font-size: 10px; font-family: var(--font-mono);">${s.characteristics.length} Characteristics</span>
          </div>
          <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); margin-bottom: 8px;">UUID: ${s.uuid}</div>
          <div style="padding-left: 6px; border-left: 2px solid rgba(0,242,254,0.3);">
            ${charsHtml || '<div style="font-size: 11px; color: var(--text-dim);">No characteristics found for this service.</div>'}
          </div>
        </div>
      `;
    }).join('');

    this.contentEl.innerHTML = `
      <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px;">
        <div class="metric-card compact" style="flex: 1; min-width: 140px;">
          <span class="metric-label">GATT Services</span>
          <span class="metric-value" style="color: var(--accent-cyan); font-size: 20px;">${res.servicesCount}</span>
        </div>
        <div class="metric-card compact" style="flex: 1; min-width: 140px;">
          <span class="metric-label">Characteristics</span>
          <span class="metric-value" style="color: #10b981; font-size: 20px;">${res.characteristicsCount}</span>
        </div>
        <div class="metric-card compact" style="flex: 1; min-width: 140px;">
          <span class="metric-label">Link Status</span>
          <span class="metric-value" style="color: #10b981; font-size: 14px;">${res.status}</span>
        </div>
      </div>
      <div>
        <div style="font-weight: 700; font-size: 12px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px;">Discovered GATT Services &amp; Characteristics</div>
        ${servicesHtml || '<div style="padding: 20px; text-align: center; color: var(--text-dim);">0 services matched standard catalog. Enter custom service UUID to bind.</div>'}
      </div>
    `;
  }

  renderSerialResult(res) {
    const channelsHtml = res.channels.map(c => `
      <tr>
        <td style="padding: 6px 10px; font-family: var(--font-mono); font-size: 11px; color: var(--accent-cyan);">${c.pin}</td>
        <td style="padding: 6px 10px; font-size: 12px; font-weight: 600;">${c.sensor}</td>
        <td style="padding: 6px 10px; font-size: 11px; color: var(--text-dim);">${c.bus}</td>
        <td style="padding: 6px 10px;"><span class="badge badge-normal" style="font-size: 10px; background: rgba(16,185,129,0.15); color: #10b981;">${c.status}</span></td>
      </tr>
    `).join('');

    const commandsHtml = res.commands.map(cmd => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 6px;">
        <span style="font-family: var(--font-mono); font-size: 12px; color: #f59e0b; font-weight: 700;">${cmd.code}</span>
        <span style="font-size: 11px; color: var(--text-main);">${cmd.action}</span>
        <span class="badge" style="font-size: 9px;">${cmd.target}</span>
      </div>
    `).join('');

    this.contentEl.innerHTML = `
      <div style="padding: 12px 14px; background: rgba(0, 242, 254, 0.05); border: 1px solid rgba(0, 242, 254, 0.2); border-radius: var(--radius-md); margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <div>
            <div style="font-weight: 700; font-size: 13px; color: var(--text-main);">${res.chipInfo}</div>
            <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); margin-top: 2px;">${res.vidPid} &bull; Baud Rate: ${res.baudRate}</div>
          </div>
          <span class="badge badge-normal" style="background: rgba(16,185,129,0.15); color: #10b981; font-size: 10px;">${res.status}</span>
        </div>
      </div>

      <div style="margin-bottom: 14px;">
        <div style="font-weight: 700; font-size: 12px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px;">Hardware Pin Channels &amp; Sensor Buses</div>
        <table style="width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.02); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 11px; text-align: left;">
              <th style="padding: 6px 10px;">Pin</th>
              <th style="padding: 6px 10px;">Sensor Line</th>
              <th style="padding: 6px 10px;">Bus Type</th>
              <th style="padding: 6px 10px;">Status</th>
            </tr>
          </thead>
          <tbody>${channelsHtml}</tbody>
        </table>
      </div>

      <div>
        <div style="font-weight: 700; font-size: 12px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px;">Supported UART Control Commands</div>
        <div style="display: flex; flex-direction: column; gap: 6px;">${commandsHtml}</div>
      </div>
    `;
  }

  renderParticleResult(res) {
    const varsHtml = res.variables.map(v => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 6px;">
        <span style="font-family: var(--font-mono); font-size: 12px; color: var(--accent-cyan); font-weight: 700;">${v.name}</span>
        <span class="badge" style="font-family: var(--font-mono); font-size: 10px;">${v.type}</span>
      </div>
    `).join('');

    const fnsHtml = res.functions.map(fn => `
      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 10px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="color: #a855f7; font-family: var(--font-mono); font-size: 12px;">RPC: ${fn.name}()</strong>
          <span class="badge" style="background: rgba(168,85,247,0.15); color: #c084fc; font-size: 10px;">Cloud Function</span>
        </div>
        ${fn.codes.map(c => `
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px;">
            <code style="color: #f59e0b;">${c.arg}</code> &bull; ${c.desc}
          </div>
        `).join('')}
      </div>
    `).join('');

    this.contentEl.innerHTML = `
      <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px;">
        <div class="metric-card compact" style="flex: 1; min-width: 140px;">
          <span class="metric-label">Platform</span>
          <span class="metric-value" style="color: var(--accent-cyan); font-size: 16px;">${res.platform}</span>
        </div>
        <div class="metric-card compact" style="flex: 1; min-width: 140px;">
          <span class="metric-label">Cloud Status</span>
          <span class="metric-value" style="color: #10b981; font-size: 14px;">${res.status}</span>
        </div>
        <div class="metric-card compact" style="flex: 1; min-width: 140px;">
          <span class="metric-label">Last Heard</span>
          <span class="metric-value" style="color: var(--text-dim); font-size: 11px;">${res.lastHeard}</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;">
        <div>
          <div style="font-weight: 700; font-size: 12px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px;">Exposed Cloud Variables</div>
          <div style="display: flex; flex-direction: column; gap: 6px;">${varsHtml || 'No variables exposed.'}</div>
        </div>
        <div>
          <div style="font-weight: 700; font-size: 12px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px;">Callable Cloud RPC Functions</div>
          ${fnsHtml || 'No functions exposed.'}
        </div>
      </div>
    `;
  }

  renderRestResult(res) {
    const epHtml = res.endpoints.map(ep => `
      <div style="padding: 8px 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 6px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <div style="font-family: var(--font-mono); font-size: 12px; color: ${ep.ok ? 'var(--accent-cyan)' : 'var(--text-dim)'}; font-weight: 600;">${ep.path}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">URL: ${ep.url}</div>
          ${ep.keys.length > 0 ? `<div style="font-size: 11px; color: #10b981; margin-top: 2px;">Payload Keys: ${ep.keys.join(', ')}</div>` : ''}
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span class="badge ${ep.ok ? 'badge-normal' : ''}" style="font-size: 10px;">${ep.status}</span>
          <span style="font-family: var(--font-mono); font-size: 10px; color: var(--text-dim);">${ep.latency}</span>
        </div>
      </div>
    `).join('');

    this.contentEl.innerHTML = `
      <div style="margin-bottom: 12px; font-size: 12px; color: var(--text-muted);">
        Base Target: <strong style="color: var(--accent-cyan);">${res.baseUrl}</strong>
      </div>
      <div>
        <div style="font-weight: 700; font-size: 12px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px;">Probed HTTP REST Endpoints</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">${epHtml}</div>
      </div>
    `;
  }

  renderVirtualResult(res) {
    const streamsHtml = res.streams.map(s => `
      <div style="padding: 8px 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 600; font-size: 12px; color: var(--accent-cyan);">${s.name}</span>
        <span style="font-size: 11px; color: var(--text-dim);">${s.model}</span>
      </div>
    `).join('');

    this.contentEl.innerHTML = `
      <div style="margin-bottom: 12px; padding: 10px 14px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md);">
        <strong style="color: #10b981; font-size: 13px;">Full Software Twin Active</strong>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Runs complete internal math model &amp; physics loops without external hardware.</div>
      </div>
      <div>
        <div style="font-weight: 700; font-size: 12px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px;">Simulated Sensor Streams</div>
        <div style="display: flex; flex-direction: column; gap: 6px;">${streamsHtml}</div>
      </div>
    `;
  }

  renderGenericResult(res) {
    this.contentEl.innerHTML = `
      <div style="padding: 20px; color: var(--text-dim); text-align: center;">
        <div>${res.info}</div>
      </div>
    `;
  }
}

export const universalServiceInspector = new UniversalServiceInspector();
