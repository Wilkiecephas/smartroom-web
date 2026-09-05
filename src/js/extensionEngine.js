/**
 * Open-Source Extensions Engine & Community Marketplace
 * Enables users to create, import, export, and 1-click install extensions
 * for Drones, Thermal Cameras, Soil NPK, GPS, Energy Monitors, and Biometrics.
 * 
 * Part of SMART IOT HUB &bull; Built by TekStep Apps Uganda
 */

export const PUBLIC_EXTENSIONS_CATALOG = [
  {
    id: 'ext_drone_hud',
    name: 'Universal Kinematics & Nav HUD (Flight, Swim, Glide, Direct)',
    author: 'TekStep Multi-Domain Systems',
    version: '3.0.0',
    icon: '🛸',
    category: 'Universal Navigation',
    badge: 'MULTI-DOMAIN',
    description: 'Universal telemetry and attitude instrumentation for aerial flight, marine/aquatic swimming, aerodynamic gliding, and direct surface navigation.',
    telemetryKeys: ['pitch', 'roll', 'altitude', 'speed', 'battery_v', 'armed', 'domain_mode'],
    render: (data = {}, isExpanded = false) => {
      const pitch = (data.pitch !== undefined ? data.pitch : 2.5).toFixed(1);
      const roll = (data.roll !== undefined ? data.roll : -1.2).toFixed(1);
      const alt = (data.altitude !== undefined ? data.altitude : 45.2).toFixed(1);
      const spd = (data.speed !== undefined ? data.speed : 12.8).toFixed(1);
      const batt = (data.battery_v !== undefined ? data.battery_v : 15.6).toFixed(1);
      const isArmed = data.armed !== undefined ? data.armed : true;

      if (!isExpanded) {
        return `
          <div class="ext-widget-card compact drone-hud-widget">
            <div class="ext-widget-header">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 16px;">🛸</span>
                <span style="font-weight: 700; font-size: 12px; color: var(--accent-cyan);">UNIVERSAL KINEMATICS HUD</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="badge ${isArmed ? 'badge-danger' : 'badge-normal'}" style="font-size: 9px;">${isArmed ? 'ACTIVE &bull; TRACKING' : 'STANDBY'}</span>
                <button class="btn-expand-ext" data-ext-id="ext_drone_hud" title="Click to Expand Full Multi-Domain Cockpit">↗ Expand &amp; Use</button>
              </div>
            </div>
            <div class="ext-compact-preview-row">
              <div class="ext-horizon-box ext-mini-horizon" title="Bank: ${roll}° | Incline: ${pitch}° (Flight / Swim / Glide / Direct)">
                <div class="ext-horizon-sky"></div>
                <div class="ext-horizon-ground"></div>
                <div class="ext-horizon-line" style="transform: rotate(${roll}deg) translateY(${pitch * 1.2}px);"></div>
                <div class="ext-horizon-reticle" style="font-size: 12px;">+</div>
              </div>
              <div style="flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; font-family: var(--font-mono); font-size: 10px;">
                <div class="ext-stat-box"><span>ALT / DEPTH</span><strong style="color: var(--accent-cyan); font-size: 11px;">${alt} m</strong></div>
                <div class="ext-stat-box"><span>VELOCITY</span><strong style="color: var(--accent-emerald); font-size: 11px;">${spd} m/s</strong></div>
                <div class="ext-stat-box"><span>POWER</span><strong style="color: var(--accent-amber); font-size: 11px;">${batt} V</strong></div>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="ext-widget-card expanded drone-hud-widget" style="grid-column: 1 / -1;">
          <div class="ext-widget-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">🛸</span>
              <span style="font-weight: 800; font-size: 14px; color: var(--accent-cyan);">UNIVERSAL KINEMATICS &amp; AUTOPILOT HUD [FLIGHT &bull; SWIMMING &bull; GLIDE &bull; DIRECT]</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge ${isArmed ? 'badge-danger' : 'badge-normal'}" style="font-size: 10px;">${isArmed ? 'NAV STREAM LOCKED' : 'STANDBY'}</span>
              <button class="btn-expand-ext" data-ext-id="ext_drone_hud" style="background: rgba(239, 68, 68, 0.15); color: var(--accent-rose); border-color: rgba(239, 68, 68, 0.3);">↙ Collapse Card</button>
            </div>
          </div>
          <!-- Multi-Domain Mode Selector Pills -->
          <div style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
            <span class="badge" style="background: rgba(0, 242, 254, 0.2); color: var(--accent-cyan); font-size: 11px; padding: 4px 8px; border: 1px solid rgba(0, 242, 254, 0.4);">✈️ Aerial Flight / UAV</span>
            <span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-size: 11px; padding: 4px 8px;">🏊 Aquatic / Submersible Swimming</span>
            <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); font-size: 11px; padding: 4px 8px;">🪂 Aerodynamic Glide</span>
            <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: var(--accent-amber); font-size: 11px; padding: 4px 8px;">🧭 Direct Terrestrial / Surface</span>
          </div>
          <div class="ext-horizon-box" style="height: 140px;">
            <div class="ext-horizon-sky"></div>
            <div class="ext-horizon-ground"></div>
            <div class="ext-horizon-line" style="transform: rotate(${roll}deg) translateY(${pitch * 2}px);"></div>
            <div class="ext-horizon-reticle">+</div>
            <div class="ext-horizon-pitch-text">ATTITUDE: PITCH ${pitch}° | ROLL ${roll}° | HEADING: 184° SSE | VECTOR: BALANCED</div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 10px; font-family: var(--font-mono); font-size: 11px;">
            <div class="ext-stat-box"><span>ALTITUDE / WATER DEPTH</span><strong style="color: var(--accent-cyan); font-size: 13px;">${alt} m</strong></div>
            <div class="ext-stat-box"><span>AIRSPEED / CURRENT FLOW</span><strong style="color: var(--accent-emerald); font-size: 13px;">${spd} m/s</strong></div>
            <div class="ext-stat-box"><span>BATTERY / POWER</span><strong style="color: var(--accent-amber); font-size: 13px;">${batt} V</strong></div>
            <div class="ext-stat-box"><span>MULTI-DOMAIN PROTOCOL</span><strong style="color: #60a5fa; font-size: 13px;">MAVLink / NMEA 57600</strong></div>
          </div>
        </div>
      `;
    }
  },
  {
    id: 'ext_amg8833_thermal',
    name: 'Universal Multi-Spectrum Thermal Matrix (Air, Aquatic & Surface Heat)',
    author: 'TekStep Vision Labs',
    version: '2.0.0',
    icon: '🌡️',
    category: 'Thermal Imaging',
    badge: 'MULTI-SPECTRUM',
    description: 'Universal 64-pixel FLIR heatmap for aerodynamic friction, marine swimming thermal plumes, glider updrafts, and direct surface heat tracking.',
    telemetryKeys: ['thermal_matrix', 't_max', 't_min'],
    render: (data = {}, isExpanded = false) => {
      const tMax = (data.t_max !== undefined ? data.t_max : 34.8).toFixed(1);
      const tMin = (data.t_min !== undefined ? data.t_min : 21.2).toFixed(1);
      
      const cells = [];
      for (let i = 0; i < 64; i++) {
        const row = Math.floor(i / 8);
        const col = i % 8;
        const distFromCenter = Math.hypot(row - 3.5, col - 3.5);
        const cellTemp = (34.8 - distFromCenter * 3.2 + Math.sin(i + Date.now() / 2000) * 1.5);
        const hue = Math.max(200, Math.min(360, 360 - (cellTemp - 20) * 8));
        cells.push(`<div style="background: hsl(${hue}, 100%, 50%); border-radius: 1px;" title="${cellTemp.toFixed(1)}°C"></div>`);
      }

      if (!isExpanded) {
        return `
          <div class="ext-widget-card compact thermal-widget">
            <div class="ext-widget-header">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 16px;">🌡️</span>
                <span style="font-weight: 700; font-size: 12px; color: var(--accent-rose);">UNIVERSAL THERMAL MATRIX</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="badge" style="font-size: 9px;">HOT: ${tMax}°C</span>
                <button class="btn-expand-ext" data-ext-id="ext_amg8833_thermal" title="Click to Expand Universal Thermal Studio">↗ Expand &amp; Use</button>
              </div>
            </div>
            <div class="ext-compact-preview-row">
              <div class="ext-mini-heat-grid" title="FLIR 64-Pixel Heatmap (Air / Aquatic / Surface)">
                ${cells.join('')}
              </div>
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-around; font-family: var(--font-mono); font-size: 10px; color: var(--text-dim);">
                <div>MAX HOTSPOT: <strong style="color: var(--accent-rose); font-size: 12px;">${tMax}°C</strong></div>
                <div>MIN AMBIENT: <strong style="color: var(--accent-cyan);">${tMin}°C</strong></div>
                <div>SIGNATURE: <strong style="color: var(--accent-amber);">MULTI-DOMAIN TARGET</strong></div>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="ext-widget-card expanded thermal-widget" style="grid-column: 1 / -1;">
          <div class="ext-widget-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">🌡️</span>
              <span style="font-weight: 800; font-size: 14px; color: var(--accent-rose);">UNIVERSAL MULTI-SPECTRUM THERMAL MATRIX &bull; FLIR HEATMAP STUDIO</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge" style="font-size: 10px;">PEAK HOTSPOT: ${tMax}°C</span>
              <button class="btn-expand-ext" data-ext-id="ext_amg8833_thermal" style="background: rgba(239, 68, 68, 0.15); color: var(--accent-rose); border-color: rgba(239, 68, 68, 0.3);">↙ Collapse Card</button>
            </div>
          </div>
          <!-- Multi-Domain Thermal Application Badges -->
          <div style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
            <span class="badge" style="background: rgba(239, 68, 68, 0.15); color: var(--accent-rose); font-size: 11px; padding: 4px 8px;">✈️ Flight Aero Heat</span>
            <span class="badge" style="background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); font-size: 11px; padding: 4px 8px;">🏊 Aquatic / Marine Plume</span>
            <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: var(--accent-amber); font-size: 11px; padding: 4px 8px;">🪂 Glider Updraft Thermals</span>
            <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); font-size: 11px; padding: 4px 8px;">🧭 Direct Surface Tracking</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; height: 160px; border-radius: var(--radius-sm); overflow: hidden; background: #000; padding: 6px;">
            ${cells.join('')}
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px; font-family: var(--font-mono); font-size: 11px;">
            <div class="ext-stat-box"><span>MIN AMBIENT</span><strong style="color: var(--accent-cyan); font-size: 13px;">${tMin}°C</strong></div>
            <div class="ext-stat-box"><span>THERMAL CLASSIFICATION</span><strong style="color: var(--accent-amber); font-size: 13px;">BIOLOGICAL / VEHICULAR HEAT</strong></div>
            <div class="ext-stat-box"><span>PEAK HOTSPOT</span><strong style="color: var(--accent-rose); font-size: 13px;">${tMax}°C</strong></div>
          </div>
        </div>
      `;
    }
  },
  {
    id: 'ext_gps_tracker',
    name: 'NEO-6M Global GPS & Satellite Navigation',
    author: 'TekStep Geodesy',
    version: '1.2.0',
    icon: '🛰️',
    category: 'Navigation & Drones',
    badge: 'FEATURED',
    description: 'Tracks real-time global positioning coordinates, satellite constellation lock count, altitude, and HDOP precision.',
    telemetryKeys: ['lat', 'lon', 'satellites', 'speed_kmh', 'hdop'],
    render: (data = {}) => {
      const lat = data.lat !== undefined ? data.lat : '0.3476 N';
      const lon = data.lon !== undefined ? data.lon : '32.5825 E (Kampala)';
      const sats = data.satellites !== undefined ? data.satellites : 11;
      const speed = data.speed_kmh !== undefined ? data.speed_kmh : '0.0';
      const hdop = data.hdop !== undefined ? data.hdop : '0.88';

      return `
        <div class="ext-widget-card gps-widget">
          <div class="ext-widget-header">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 16px;">🛰️</span>
              <span style="font-weight: 700; font-size: 13px; color: var(--accent-emerald);">NEO-6M GNSS GPS SATELLITE ENGINE</span>
            </div>
            <span class="badge badge-normal" style="font-size: 10px;">3D FIX (${sats} SATS)</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; font-family: var(--font-mono); font-size: 11px;">
            <div class="ext-stat-box"><span>LATITUDE</span><strong style="color: var(--text-main);">${lat}</strong></div>
            <div class="ext-stat-box"><span>LONGITUDE</span><strong style="color: var(--text-main);">${lon}</strong></div>
            <div class="ext-stat-box"><span>GROUND SPEED</span><strong style="color: var(--accent-cyan);">${speed} km/h</strong></div>
            <div class="ext-stat-box"><span>HDOP PRECISION</span><strong style="color: var(--accent-emerald);">${hdop} (High)</strong></div>
          </div>
        </div>
      `;
    }
  },
  {
    id: 'ext_soil_npk',
    name: 'Smart Agriculture 7-in-1 Soil NPK & Moisture',
    author: 'Uganda Agritech Open Labs',
    version: '2.0.1',
    icon: '🌱',
    category: 'Smart Agriculture',
    badge: 'AGRITECH',
    description: 'Precision agritech soil fertility monitoring: Nitrogen (N), Phosphorus (P), Potassium (K), Moisture %, EC, and pH.',
    telemetryKeys: ['soil_n', 'soil_p', 'soil_k', 'soil_moisture', 'soil_ph'],
    render: (data = {}) => {
      const n = data.soil_n !== undefined ? data.soil_n : 42;
      const p = data.soil_p !== undefined ? data.soil_p : 28;
      const k = data.soil_k !== undefined ? data.soil_k : 85;
      const moist = data.soil_moisture !== undefined ? data.soil_moisture : 62.4;
      const ph = data.soil_ph !== undefined ? data.soil_ph : 6.8;

      return `
        <div class="ext-widget-card soil-widget">
          <div class="ext-widget-header">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 16px;">🌱</span>
              <span style="font-weight: 700; font-size: 13px; color: #10b981;">SOIL NPK & MOISTURE (RS485)</span>
            </div>
            <span class="badge badge-normal" style="font-size: 10px;">SOIL FERTILE</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 10px; font-family: var(--font-mono); font-size: 11px; text-align: center;">
            <div class="ext-stat-box"><span>N (Nitrogen)</span><strong style="color: #38bdf8;">${n} mg/kg</strong></div>
            <div class="ext-stat-box"><span>P (Phosphorus)</span><strong style="color: #fbbf24;">${p} mg/kg</strong></div>
            <div class="ext-stat-box"><span>K (Potassium)</span><strong style="color: #ec4899;">${k} mg/kg</strong></div>
            <div class="ext-stat-box"><span>MOISTURE</span><strong style="color: #10b981;">${moist}%</strong></div>
            <div class="ext-stat-box"><span>SOIL pH</span><strong style="color: #a78bfa;">${ph} pH</strong></div>
          </div>
        </div>
      `;
    }
  },
  {
    id: 'ext_pzem_energy',
    name: 'PZEM-004T High-Voltage AC Power Analyzer',
    author: 'Grid Sentinel Group',
    version: '1.0.4',
    icon: '⚡',
    category: 'Energy & Power',
    badge: 'INDUSTRIAL',
    description: 'High-voltage grid power analysis: Voltage (V), Current (A), Active Power (W), Power Factor, and Total Energy (kWh).',
    telemetryKeys: ['ac_volts', 'ac_amps', 'ac_watts', 'ac_kwh', 'ac_hz'],
    render: (data = {}) => {
      const v = data.ac_volts !== undefined ? data.ac_volts : 238.4;
      const a = data.ac_amps !== undefined ? data.ac_amps : 4.12;
      const w = data.ac_watts !== undefined ? data.ac_watts : 982;
      const kwh = data.ac_kwh !== undefined ? data.ac_kwh : 14.85;
      const hz = data.ac_hz !== undefined ? data.ac_hz : 50.0;

      return `
        <div class="ext-widget-card pzem-widget">
          <div class="ext-widget-header">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 16px;">⚡</span>
              <span style="font-weight: 700; font-size: 13px; color: var(--accent-amber);">PZEM-004T AC ENERGY ANALYZER</span>
            </div>
            <span class="badge" style="font-size: 10px;">50.0 Hz MAINS</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 10px; font-family: var(--font-mono); font-size: 11px; text-align: center;">
            <div class="ext-stat-box"><span>VOLTAGE</span><strong style="color: var(--accent-cyan);">${v} V</strong></div>
            <div class="ext-stat-box"><span>CURRENT</span><strong style="color: var(--accent-amber);">${a} A</strong></div>
            <div class="ext-stat-box"><span>LOAD</span><strong style="color: var(--accent-rose);">${w} W</strong></div>
            <div class="ext-stat-box"><span>ENERGY</span><strong style="color: var(--accent-emerald);">${kwh} kWh</strong></div>
          </div>
        </div>
      `;
    }
  },
  {
    id: 'ext_max30102',
    name: 'MAX30102 Biometric Pulse & SpO2 Oximeter',
    author: 'BioHealth Open Source',
    version: '1.1.0',
    icon: '🫀',
    category: 'Healthcare',
    badge: 'BIOMEDICAL',
    description: 'Photoplethysmogram (PPG) optical pulse waveform, beats per minute (BPM), and blood oxygen saturation (% SpO2).',
    telemetryKeys: ['heart_bpm', 'spo2', 'finger_detected'],
    render: (data = {}) => {
      const bpm = data.heart_bpm !== undefined ? data.heart_bpm : 72;
      const spo2 = data.spo2 !== undefined ? data.spo2 : 98;
      const detected = data.finger_detected !== undefined ? data.finger_detected : true;

      return `
        <div class="ext-widget-card max-widget">
          <div class="ext-widget-header">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 16px;">🫀</span>
              <span style="font-weight: 700; font-size: 13px; color: var(--accent-rose);">MAX30102 PULSE OXIMETER & SpO2</span>
            </div>
            <span class="badge ${detected ? 'badge-normal' : 'badge-warning'}" style="font-size: 10px;">${detected ? 'FINGER DETECTED' : 'PLACE FINGER'}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; font-family: var(--font-mono); font-size: 11px;">
            <div class="ext-stat-box"><span>HEART RATE</span><strong style="color: var(--accent-rose); font-size: 18px;">${bpm} <span style="font-size: 11px;">BPM</span></strong></div>
            <div class="ext-stat-box"><span>BLOOD SpO2</span><strong style="color: var(--accent-cyan); font-size: 18px;">${spo2} <span style="font-size: 11px;">%</span></strong></div>
          </div>
        </div>
      `;
    }
  }
];

class ExtensionEngine {
  constructor() {
    this.storageKey = 'sr_installed_extensions_v1';
    this.installedIds = this.loadInstalledIds();
    this.customExtensions = this.loadCustomExtensions();
    this.expandedIds = new Set();
    this.listeners = new Set();
  }

  isExpanded(extId) {
    return this.expandedIds.has(extId);
  }

  toggleExpanded(extId) {
    if (this.expandedIds.has(extId)) {
      this.expandedIds.delete(extId);
    } else {
      this.expandedIds.add(extId);
    }
    this.notify();
    return this.isExpanded(extId);
  }

  setExpanded(extId, expanded = true) {
    if (expanded) this.expandedIds.add(extId);
    else this.expandedIds.delete(extId);
    this.notify();
  }

  loadInstalledIds() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) return JSON.parse(saved);
      }
    } catch (_) {}
    // Default installed extensions: Drone HUD and Thermal Camera
    return ['ext_drone_hud', 'ext_amg8833_thermal'];
  }

  loadCustomExtensions() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('sr_custom_extensions_v1');
        if (saved) return JSON.parse(saved);
      }
    } catch (_) {}
    return [];
  }

  saveState() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.installedIds));
        localStorage.setItem('sr_custom_extensions_v1', JSON.stringify(this.customExtensions));
      }
    } catch (_) {}
    this.notify();
  }

  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.getInstalledExtensions()));
  }

  getAllAvailable() {
    return [...PUBLIC_EXTENSIONS_CATALOG, ...this.customExtensions];
  }

  getInstalledExtensions() {
    const all = this.getAllAvailable();
    return all.filter(ext => this.installedIds.includes(ext.id));
  }

  isInstalled(extId) {
    return this.installedIds.includes(extId);
  }

  install(extId) {
    if (!this.installedIds.includes(extId)) {
      this.installedIds.push(extId);
      this.saveState();
    }
  }

  uninstall(extId) {
    this.installedIds = this.installedIds.filter(id => id !== extId);
    this.saveState();
  }

  createCustomExtension(manifest) {
    const custom = {
      id: 'custom_' + Date.now(),
      name: manifest.name || 'Custom IoT Peripheral',
      author: manifest.author || 'User',
      version: '1.0.0',
      icon: manifest.icon || '🧩',
      category: manifest.category || 'Custom Hardware',
      description: manifest.description || 'User-created custom sensor peripheral.',
      telemetryKeys: manifest.telemetryKeys || ['val1'],
      render: (data = {}) => {
        return `
          <div class="ext-widget-card">
            <div class="ext-widget-header">
              <span style="font-weight: 700; color: var(--accent-cyan);">${manifest.icon || '🧩'} ${manifest.name}</span>
              <span class="badge">CUSTOM</span>
            </div>
            <div style="padding: 10px; font-family: var(--font-mono); font-size: 12px; color: var(--text-main);">
              <div>Data Readout: <strong>${JSON.stringify(data) || 'Awaiting hardware...'}</strong></div>
            </div>
          </div>
        `;
      }
    };
    this.customExtensions.push(custom);
    this.installedIds.push(custom.id);
    this.saveState();
    return custom;
  }

  exportExtensionJson(extId) {
    const ext = this.getAllAvailable().find(e => e.id === extId);
    if (!ext) return null;
    const clean = { ...ext };
    delete clean.render;
    return JSON.stringify(clean, null, 2);
  }

  importExtensionJson(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.name || !parsed.id) throw new Error('Missing extension name or id.');
      
      const imported = {
        ...parsed,
        id: 'imported_' + Date.now(),
        render: (data = {}) => `
          <div class="ext-widget-card">
            <div class="ext-widget-header">
              <span style="font-weight: 700; color: var(--accent-cyan);">${parsed.icon || '🧩'} ${parsed.name}</span>
              <span class="badge">IMPORTED</span>
            </div>
            <div style="padding: 10px; font-family: var(--font-mono); font-size: 12px;">
              ${parsed.description || ''}
            </div>
          </div>
        `
      };
      this.customExtensions.push(imported);
      this.installedIds.push(imported.id);
      this.saveState();
      return { success: true, extension: imported };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

export const extensionEngine = new ExtensionEngine();
