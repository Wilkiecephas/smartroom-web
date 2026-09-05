/**
 * Interactive Circuit Board Schematics & Pin Matrix Subsystem
 * Renders realistic interactive SVG/HTML circuit boards, copper routing traces,
 * live pin voltages, attached sensor wiring guides, and full pin matrix for each microcontroller.
 * 
 * Part of SMART IOT HUB &bull; Built by TekStep Apps Uganda (tekstepapps.org)
 */

import { BOARD_PROFILES } from './boardProfiles.js';
import { pinConfig } from './pinConfig.js';
import { portPinger } from './pinger.js';

export class CircuitBoardSchematic {
  constructor() {
    this.selectedBoardId = pinConfig.getActiveBoard().id || 'spark_core';
    this.selectedPinName = null;
    this.showWiringGuide = true;
    this.showVoltages = true;
    this.activePinFilter = 'all';
    this.latestTelemetry = null;
    this.container = null;
    this.onActiveBoardChangeCallback = null;
  }

  init(containerElement) {
    this.container = containerElement || document.getElementById('circuitBoardSchematicSection');
    if (!this.container) return;

    // Default selected pin from active board mapping
    const board = this.getBoard();
    const mapping = pinConfig.mapping;
    if (mapping.dht11 && mapping.dht11.pin) {
      this.selectedPinName = mapping.dht11.pin;
    } else if (board.pins && board.pins.length > 0) {
      this.selectedPinName = board.pins[0].name;
    }

    this.render();
  }

  getBoard(boardId = this.selectedBoardId) {
    return BOARD_PROFILES[boardId] || BOARD_PROFILES['spark_core'];
  }

  setBoard(boardId) {
    if (!BOARD_PROFILES[boardId]) return;
    this.selectedBoardId = boardId;
    const board = this.getBoard();
    if (board.pins && board.pins.length > 0) {
      this.selectedPinName = board.pins[0].name;
    }
    this.render();
  }

  updateTelemetry(data) {
    this.latestTelemetry = data;
    this.updateVoltageReadouts();
  }

  onSelectActiveBoard(cb) {
    this.onActiveBoardChangeCallback = cb;
  }

  getAssignedSensor(pinName) {
    const entry = Object.entries(pinConfig.mapping).find(([_, s]) => s.pin === pinName);
    return entry ? { id: entry[0], ...entry[1] } : null;
  }

  calculatePinVoltage(pin, assigned) {
    if (!this.latestTelemetry) {
      if (pin.type === 'analog') return '1.82V (ADC)';
      if (pin.type === 'serial') return '3.30V (HIGH)';
      return pin.is5V ? '3.30V' : '3.30V';
    }

    if (!assigned) {
      if (pin.type === 'analog') return '0.04V (FLOAT)';
      return '0.00V (LOW)';
    }

    const t = this.latestTelemetry;
    switch (assigned.id) {
      case 'dht11':
        return '3.28V (DATA)';
      case 'buzzer':
        return t.isAlerting ? '3.30V (ACTIVE HIGH)' : '0.00V (OFF)';
      case 'ultrasonic_trig':
        return '3.30V (10µs PULSE)';
      case 'ultrasonic_echo': {
        const d = t.distance || 178;
        return `${Math.min(5.0, (d / 60)).toFixed(2)}V (ECHO)`;
      }
      case 'pir_motion':
        return t.motion === 1 ? '3.30V (MOTION HIGH)' : '0.00V (SECURE LOW)';
      case 'ldr_light': {
        const v = Math.min(3.3, ((t.light || 620) / 4095 * 3.3)).toFixed(2);
        return `${v}V (ADC)`;
      }
      case 'lm35_temp': {
        const temp = t.temperature || 24.2;
        return `${(temp * 0.01).toFixed(2)}V (${temp}°C)`;
      }
      case 'potentiometer': {
        const d = t.distance || 150;
        const pct = Math.min(1, Math.max(0, d / 250));
        return `${(pct * 3.3).toFixed(2)}V (${Math.round(pct * 100)}%)`;
      }
      case 'rgb_red':
        return t.distance < 20 ? '3.30V (100% PWM)' : '0.00V (0%)';
      case 'rgb_green':
        return t.distance >= 20 ? '3.30V (100% PWM)' : '0.00V (0%)';
      case 'rgb_blue':
        return t.motion === 1 ? '3.30V (100% PWM)' : '0.00V (0%)';
      case 'btn_key1':
      case 'btn_key2':
        return '0.00V (PULL-DOWN)';
      default:
        return '3.30V';
    }
  }

  render() {
    if (!this.container) return;

    const currentGlobalBoard = pinConfig.getActiveBoard();
    const isGlobalActive = currentGlobalBoard.id === this.selectedBoardId;
    const board = this.getBoard();
    const pins = board.pins || [];

    this.container.innerHTML = `
      <div class="glass-card circuit-schematic-card" style="border-color: rgba(0, 242, 254, 0.28); margin-bottom: 24px;">
        <!-- Card Header & Board Architecture Info -->
        <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
          <div class="card-title" style="display: flex; align-items: center; gap: 10px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-cyan);">
              <rect x="2" y="2" width="20" height="20" rx="3"/>
              <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
              <circle cx="17" cy="7" r="1.5" fill="currentColor"/>
              <circle cx="7" cy="17" r="1.5" fill="currentColor"/>
              <circle cx="17" cy="17" r="1.5" fill="currentColor"/>
              <line x1="7" y1="9" x2="7" y2="15"/>
              <line x1="17" y1="9" x2="17" y2="15"/>
              <line x1="9" y1="7" x2="15" y2="7"/>
              <line x1="9" y1="17" x2="15" y2="17"/>
              <rect x="10" y="10" width="4" height="4" fill="currentColor"/>
            </svg>
            <span>INTERACTIVE CIRCUIT BOARD SCHEMATIC &amp; PIN MATRIX</span>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            ${isGlobalActive 
              ? `<span class="badge badge-normal" style="background: rgba(0, 242, 254, 0.15); color: var(--accent-cyan); font-weight: 700; padding: 4px 10px; border: 1px solid rgba(0, 242, 254, 0.3);">⚡ ACTIVE SYSTEM CONTROLLER</span>`
              : `<button id="btnApplyBoardAsActive" class="btn-primary" style="padding: 5px 14px; font-size: 11px; background: linear-gradient(135deg, #0284c7, #00f2fe); color: #040914; font-weight: 700;">⚡ Set as Active Hardware Profile</button>`
            }
            <button id="btnToggleWiringGuide" class="btn-outline ${this.showWiringGuide ? 'active' : ''}" style="padding: 5px 12px; font-size: 11px;" title="Toggle sensor wiring overlay connecting MCU pins to sensors">
              🔌 Wiring Guide: ${this.showWiringGuide ? 'ON' : 'OFF'}
            </button>
            <button id="btnToggleLiveVoltages" class="btn-outline ${this.showVoltages ? 'active' : ''}" style="padding: 5px 12px; font-size: 11px;" title="Toggle live estimated pin voltage indicators">
              ⚡ Voltages: ${this.showVoltages ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <!-- Microcontroller & Board Profile Selector Tabs -->
        <div class="schematic-board-selector-bar">
          <div class="schematic-board-pills-scroll" id="schematicBoardTabs">
            ${this.renderBoardTabsHtml()}
          </div>
        </div>

        <!-- Main 2-Column Split: Visual Circuit Board (Left) & Pin Inspector + Specs (Right) -->
        <div class="schematic-studio-grid">
          <!-- Left: High-Tech Interactive Circuit Board Viewer -->
          <div class="pcb-viewport-card">
            <div class="pcb-viewport-header">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="pcb-chip-indicator"></span>
                <span style="font-weight: 700; color: var(--text-main); font-size: 13px;">${board.name}</span>
                <span style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-cyan);">[${board.formFactor}]</span>
              </div>
              <div style="font-size: 11px; color: var(--text-dim);">
                Click or hover any pin pad to inspect live traces &amp; signals
              </div>
            </div>

            <!-- SVG Circuit Board Render -->
            <div class="pcb-canvas-container" id="pcbCanvasContainer">
              ${this.renderCircuitBoardSvg(board)}
            </div>

            <!-- Board Bottom Micro-Diagnostics Bar -->
            <div class="pcb-footer-bar">
              <div class="pcb-spec-chip"><span>LOGIC:</span> <strong>${board.voltage}</strong></div>
              <div class="pcb-spec-chip"><span>CLOCK:</span> <strong>${board.clock}</strong></div>
              <div class="pcb-spec-chip"><span>FLASH:</span> <strong>${board.flash}</strong></div>
              <div class="pcb-spec-chip"><span>PINS:</span> <strong>${pins.length} I/O LINES</strong></div>
            </div>
          </div>

          <!-- Right: Hardware Specs & Live Pin Inspector -->
          <div class="schematic-inspector-column">
            <!-- Selected Pin Inspector Card -->
            <div class="glass-card pin-inspector-box" id="pinInspectorBox">
              ${this.renderPinInspectorHtml(board)}
            </div>

            <!-- Hardware Specifications Card -->
            <div class="glass-card board-specs-box">
              <div style="font-size: 12px; font-weight: 700; color: var(--accent-cyan); text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                HARDWARE ARCHITECTURE &amp; ELECTRICAL SPECS
              </div>
              <div class="specs-grid">
                <div class="spec-cell"><span class="spec-label">MCU Core</span><span class="spec-val">${board.arch}</span></div>
                <div class="spec-cell"><span class="spec-label">Operating Voltage</span><span class="spec-val" style="color: var(--accent-emerald);">${board.voltage}</span></div>
                <div class="spec-cell"><span class="spec-label">Default Baud</span><span class="spec-val">${board.defaultBaud} bps</span></div>
                <div class="spec-cell"><span class="spec-label">Firmware Target</span><span class="spec-val">${board.firmwareType}</span></div>
                <div class="spec-cell"><span class="spec-label">Board Family</span><span class="spec-val">${board.family}</span></div>
                <div class="spec-cell"><span class="spec-label">Package Layout</span><span class="spec-val">${board.formFactor}</span></div>
              </div>
              <div style="margin-top: 10px; padding: 8px 12px; background: rgba(0, 242, 254, 0.04); border: 1px solid rgba(0, 242, 254, 0.15); border-radius: var(--radius-sm); font-size: 11px; color: var(--text-muted); line-height: 1.45;">
                <strong style="color: var(--accent-cyan);">Wiring Caution:</strong> ${this.getWiringTip(board.id)}
              </div>
            </div>
          </div>
        </div>

        <!-- Interactive Pin Matrix Table (Full-Width Below Schematic) -->
        <div class="pin-matrix-section">
          <div class="matrix-filter-header">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 12px; font-weight: 700; color: var(--text-main); text-transform: uppercase;">
                ${board.name} Pinout Matrix
              </span>
              <span style="font-size: 11px; color: var(--text-dim);">(${pins.length} Channels Total)</span>
            </div>
            <!-- Matrix Filter Buttons -->
            <div class="matrix-filter-pills">
              <button class="filter-pill ${this.activePinFilter === 'all' ? 'active' : ''}" data-filter="all">All (${pins.length})</button>
              <button class="filter-pill ${this.activePinFilter === 'assigned' ? 'active' : ''}" data-filter="assigned">Assigned Sensors</button>
              <button class="filter-pill ${this.activePinFilter === 'analog' ? 'active' : ''}" data-filter="analog">Analog (ADC)</button>
              <button class="filter-pill ${this.activePinFilter === 'digital' ? 'active' : ''}" data-filter="digital">Digital &amp; PWM</button>
              <button class="filter-pill ${this.activePinFilter === '5v' ? 'active' : ''}" data-filter="5v">5V Tolerant</button>
            </div>
          </div>

          <!-- Matrix Grid Table -->
          <div class="matrix-table-container">
            <table class="circuit-pin-matrix-table">
              <thead>
                <tr>
                  <th>Pin Header</th>
                  <th>Electrical Type</th>
                  <th>Voltage Standard</th>
                  <th>Supported Capabilities</th>
                  <th>Assigned Sensor</th>
                  <th>Live Voltage / State</th>
                  <th>Port Diagnostics</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${this.renderMatrixRowsHtml(board)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderBoardTabsHtml() {
    return Object.entries(BOARD_PROFILES).map(([bId, bObj]) => {
      const isSelected = bId === this.selectedBoardId;
      const currentGlobalBoard = pinConfig.getActiveBoard();
      const isGlobalActive = currentGlobalBoard.id === bId;

      let icon = '⚡';
      if (bObj.family.includes('Arduino')) icon = '🟦';
      else if (bObj.family.includes('ESP')) icon = '📡';
      else if (bObj.family.includes('STM32')) icon = '🔵';
      else if (bObj.family.includes('Raspberry')) icon = '🍓';
      else if (bObj.family.includes('DIP')) icon = '🔌';
      else if (bObj.family.includes('Drone') || bObj.family.includes('Robotics')) icon = '🛸';

      return `
        <button class="schematic-board-pill ${isSelected ? 'active' : ''}" data-board-id="${bId}" title="${bObj.name} (${bObj.arch})">
          <span class="board-icon">${icon}</span>
          <span class="board-label">${bObj.name}</span>
          ${isGlobalActive ? '<span class="active-dot-pill" title="Currently active controller"></span>' : ''}
        </button>
      `;
    }).join('');
  }

  renderCircuitBoardSvg(board) {
    const pins = board.pins || [];
    const mid = Math.ceil(pins.length / 2);
    const leftPins = pins.slice(0, mid);
    const rightPins = pins.slice(mid);

    const svgWidth = 620;
    const pcbHeight = Math.max(340, Math.max(leftPins.length, rightPins.length) * 26 + 100);
    const pcbWidth = 320;
    const pcbX = (svgWidth - pcbWidth) / 2;
    const pcbY = 20;

    const rowSpacing = (pcbHeight - 80) / Math.max(leftPins.length, rightPins.length, 1);

    // Color theme by board family
    let solderMaskColor = '#0a192f'; // Deep navy
    let traceColor = 'rgba(0, 242, 254, 0.35)';
    if (board.family.includes('Arduino')) {
      solderMaskColor = '#0b263b';
      traceColor = 'rgba(56, 189, 248, 0.4)';
    } else if (board.family.includes('ESP')) {
      solderMaskColor = '#12121e';
      traceColor = 'rgba(234, 179, 8, 0.35)';
    } else if (board.family.includes('STM32')) {
      solderMaskColor = '#061d33';
      traceColor = 'rgba(0, 242, 254, 0.4)';
    } else if (board.family.includes('Raspberry')) {
      solderMaskColor = '#1e1122';
      traceColor = 'rgba(244, 63, 94, 0.35)';
    }

    // Microcontroller chip dimension
    const chipWidth = 84;
    const chipHeight = 84;
    const chipX = pcbX + (pcbWidth - chipWidth) / 2;
    const chipY = pcbY + (pcbHeight - chipHeight) / 2 + 10;

    let svgHtml = `
      <svg class="pcb-svg-canvas" viewBox="0 0 ${svgWidth} ${pcbHeight + 40}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="pcbNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
          <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#94a3b8"/>
            <stop offset="50%" stop-color="#cbd5e1"/>
            <stop offset="100%" stop-color="#64748b"/>
          </linearGradient>
          <linearGradient id="goldPadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#fbbf24"/>
            <stop offset="100%" stop-color="#d97706"/>
          </linearGradient>
        </defs>

        <!-- PCB Substrate (FR4 Board) -->
        <rect x="${pcbX}" y="${pcbY}" width="${pcbWidth}" height="${pcbHeight}" rx="14" fill="${solderMaskColor}" stroke="rgba(0, 242, 254, 0.4)" stroke-width="1.5"/>
        <rect x="${pcbX + 4}" y="${pcbY + 4}" width="${pcbWidth - 8}" height="${pcbHeight - 8}" rx="10" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" stroke-dasharray="4,4"/>

        <!-- Mounting Holes in 4 Corners -->
        <circle cx="${pcbX + 16}" cy="${pcbY + 16}" r="6" fill="#030712" stroke="url(#metalGrad)" stroke-width="1.5"/>
        <circle cx="${pcbX + pcbWidth - 16}" cy="${pcbY + 16}" r="6" fill="#030712" stroke="url(#metalGrad)" stroke-width="1.5"/>
        <circle cx="${pcbX + 16}" cy="${pcbY + pcbHeight - 16}" r="6" fill="#030712" stroke="url(#metalGrad)" stroke-width="1.5"/>
        <circle cx="${pcbX + pcbWidth - 16}" cy="${pcbY + pcbHeight - 16}" r="6" fill="#030712" stroke="url(#metalGrad)" stroke-width="1.5"/>

        <!-- USB Connector Top Center -->
        <rect x="${pcbX + pcbWidth / 2 - 24}" y="${pcbY - 6}" width="48" height="22" rx="3" fill="url(#metalGrad)" stroke="#475569" stroke-width="1"/>
        <rect x="${pcbX + pcbWidth / 2 - 16}" y="${pcbY}" width="32" height="12" rx="2" fill="#0f172a"/>
        <text x="${pcbX + pcbWidth / 2}" y="${pcbY + 8}" font-family="monospace" font-size="7" fill="#94a3b8" text-anchor="middle">USB-C / DFU</text>

        <!-- Crystal Oscillator -->
        <rect x="${pcbX + pcbWidth / 2 - 14}" y="${chipY - 26}" width="28" height="14" rx="3" fill="url(#metalGrad)" stroke="#334155"/>
        <text x="${pcbX + pcbWidth / 2}" y="${chipY - 17}" font-family="monospace" font-size="7" font-weight="bold" fill="#040914" text-anchor="middle">${board.clock}</text>

        <!-- Reset Button -->
        <rect x="${pcbX + 24}" y="${pcbY + 28}" width="16" height="16" rx="2" fill="#334155" stroke="#64748b"/>
        <circle cx="${pcbX + 32}" cy="${pcbY + 36}" r="5" fill="#f87171"/>
        <text x="${pcbX + 32}" y="${pcbY + 52}" font-family="monospace" font-size="7" fill="#94a3b8" text-anchor="middle">RST</text>

        <!-- Power & TX/RX Status LEDs -->
        <circle cx="${pcbX + pcbWidth - 32}" cy="${pcbY + 30}" r="4" fill="#10b981" filter="url(#pcbNeonGlow)"/>
        <text x="${pcbX + pcbWidth - 32}" y="${pcbY + 42}" font-family="monospace" font-size="7" fill="#6ee7b7" text-anchor="middle">PWR</text>
        <circle cx="${pcbX + pcbWidth - 32}" cy="${pcbY + 50}" r="3.5" fill="#38bdf8"/>
        <text x="${pcbX + pcbWidth - 32}" y="${pcbY + 62}" font-family="monospace" font-size="7" fill="#7dd3fc" text-anchor="middle">ACT</text>

        <!-- Silkscreen Branding on PCB -->
        <text x="${pcbX + pcbWidth / 2}" y="${chipY + chipHeight + 22}" font-family="sans-serif" font-weight="800" font-size="11" fill="rgba(255, 255, 255, 0.75)" text-anchor="middle" letter-spacing="1">${board.name.toUpperCase()}</text>
        <text x="${pcbX + pcbWidth / 2}" y="${chipY + chipHeight + 34}" font-family="monospace" font-size="8" fill="rgba(0, 242, 254, 0.6)" text-anchor="middle">TEKSTEP OPEN-SOURCE IOT ARCHITECTURE</text>

        <!-- Central MCU Chip -->
        <rect x="${chipX}" y="${chipY}" width="${chipWidth}" height="${chipHeight}" rx="4" fill="#090d16" stroke="#1e293b" stroke-width="2"/>
        <circle cx="${chipX + 8}" cy="${chipY + 8}" r="2" fill="rgba(255,255,255,0.4)"/>
        <text x="${chipX + chipWidth / 2}" y="${chipY + chipHeight / 2 - 6}" font-family="monospace" font-weight="bold" font-size="9" fill="var(--accent-cyan)" text-anchor="middle">${board.arch.split(' ')[0]}</text>
        <text x="${chipX + chipWidth / 2}" y="${chipY + chipHeight / 2 + 8}" font-family="monospace" font-size="7.5" fill="#94a3b8" text-anchor="middle">${board.voltage}</text>
        <text x="${chipX + chipWidth / 2}" y="${chipY + chipHeight / 2 + 20}" font-family="monospace" font-size="7" fill="#64748b" text-anchor="middle">CORE ENGINE</text>
    `;

    // Render Left Pin Row & Traces
    leftPins.forEach((pin, idx) => {
      const pinY = pcbY + 45 + idx * rowSpacing;
      const padX = pcbX + 16;
      const isSelected = this.selectedPinName === pin.name;
      const assigned = this.getAssignedSensor(pin.name);
      const isAssigned = !!assigned;

      // Copper trace from MCU to Pad
      const traceY = chipY + 10 + (idx / Math.max(1, leftPins.length - 1)) * (chipHeight - 20);
      const isHighlight = isSelected || isAssigned;
      const tColor = isHighlight ? 'var(--accent-cyan)' : traceColor;
      const tWidth = isHighlight ? '2' : '1';

      svgHtml += `
        <!-- Left Trace ${pin.name} -->
        <path d="M ${chipX} ${traceY} L ${chipX - 15} ${traceY} L ${padX + 20} ${pinY} L ${padX + 6} ${pinY}" fill="none" stroke="${tColor}" stroke-width="${tWidth}" opacity="${isHighlight ? '0.9' : '0.4'}"/>

        <!-- Pad & Via -->
        <g class="pcb-pin-group ${isSelected ? 'active-pin' : ''} ${isAssigned ? 'assigned-pin' : ''}" data-pin-name="${pin.name}" style="cursor: pointer;">
          <circle cx="${padX}" cy="${pinY}" r="7" fill="#040914" stroke="${isSelected ? '#00f2fe' : isAssigned ? '#10b981' : 'url(#goldPadGrad)'}" stroke-width="${isSelected ? '2.5' : '1.5'}" filter="${isSelected ? 'url(#pcbNeonGlow)' : 'none'}"/>
          <circle cx="${padX}" cy="${pinY}" r="3" fill="${isSelected ? '#00f2fe' : isAssigned ? '#10b981' : '#030712'}"/>
          <text x="${padX + 14}" y="${pinY + 3.5}" font-family="monospace" font-weight="${isSelected ? 'bold' : 'normal'}" font-size="9" fill="${isSelected ? '#00f2fe' : isAssigned ? '#34d399' : '#e2e8f0'}">${pin.name}</text>
          ${pin.is5V ? `<circle cx="${padX - 9}" cy="${pinY}" r="2" fill="#10b981" title="5V Tolerant"/>` : ''}
        </g>
      `;

      // Draw sensor wiring guide wire outside the PCB if enabled
      if (this.showWiringGuide && assigned) {
        const wireEndX = pcbX - 80;
        const wireEndY = pinY;
        svgHtml += `
          <!-- Wiring Jumper Guide to ${assigned.name} -->
          <path d="M ${padX - 8} ${pinY} C ${padX - 45} ${pinY}, ${wireEndX + 35} ${wireEndY}, ${wireEndX} ${wireEndY}" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="3,2"/>
          <rect x="${wireEndX - 55}" y="${wireEndY - 9}" width="52" height="18" rx="4" fill="#040914" stroke="#10b981" stroke-width="1.2"/>
          <text x="${wireEndX - 29}" y="${wireEndY + 3}" font-family="sans-serif" font-size="8" font-weight="bold" fill="#6ee7b7" text-anchor="middle">${assigned.name.split(' ')[0]}</text>
        `;
      }
    });

    // Render Right Pin Row & Traces
    rightPins.forEach((pin, idx) => {
      const pinY = pcbY + 45 + idx * rowSpacing;
      const padX = pcbX + pcbWidth - 16;
      const isSelected = this.selectedPinName === pin.name;
      const assigned = this.getAssignedSensor(pin.name);
      const isAssigned = !!assigned;

      // Copper trace from MCU to Pad
      const traceY = chipY + 10 + (idx / Math.max(1, rightPins.length - 1)) * (chipHeight - 20);
      const isHighlight = isSelected || isAssigned;
      const tColor = isHighlight ? 'var(--accent-cyan)' : traceColor;
      const tWidth = isHighlight ? '2' : '1';

      svgHtml += `
        <!-- Right Trace ${pin.name} -->
        <path d="M ${chipX + chipWidth} ${traceY} L ${chipX + chipWidth + 15} ${traceY} L ${padX - 20} ${pinY} L ${padX - 6} ${pinY}" fill="none" stroke="${tColor}" stroke-width="${tWidth}" opacity="${isHighlight ? '0.9' : '0.4'}"/>

        <!-- Pad & Via -->
        <g class="pcb-pin-group ${isSelected ? 'active-pin' : ''} ${isAssigned ? 'assigned-pin' : ''}" data-pin-name="${pin.name}" style="cursor: pointer;">
          <circle cx="${padX}" cy="${pinY}" r="7" fill="#040914" stroke="${isSelected ? '#00f2fe' : isAssigned ? '#10b981' : 'url(#goldPadGrad)'}" stroke-width="${isSelected ? '2.5' : '1.5'}" filter="${isSelected ? 'url(#pcbNeonGlow)' : 'none'}"/>
          <circle cx="${padX}" cy="${pinY}" r="3" fill="${isSelected ? '#00f2fe' : isAssigned ? '#10b981' : '#030712'}"/>
          <text x="${padX - 14}" y="${pinY + 3.5}" font-family="monospace" font-weight="${isSelected ? 'bold' : 'normal'}" font-size="9" fill="${isSelected ? '#00f2fe' : isAssigned ? '#34d399' : '#e2e8f0'}" text-anchor="end">${pin.name}</text>
          ${pin.is5V ? `<circle cx="${padX + 9}" cy="${pinY}" r="2" fill="#10b981" title="5V Tolerant"/>` : ''}
        </g>
      `;

      // Draw sensor wiring guide wire outside the PCB if enabled
      if (this.showWiringGuide && assigned) {
        const wireEndX = pcbX + pcbWidth + 80;
        const wireEndY = pinY;
        svgHtml += `
          <!-- Wiring Jumper Guide to ${assigned.name} -->
          <path d="M ${padX + 8} ${pinY} C ${padX + 45} ${pinY}, ${wireEndX - 35} ${wireEndY}, ${wireEndX} ${wireEndY}" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="3,2"/>
          <rect x="${wireEndX + 3}" y="${wireEndY - 9}" width="52" height="18" rx="4" fill="#040914" stroke="#10b981" stroke-width="1.2"/>
          <text x="${wireEndX + 29}" y="${wireEndY + 3}" font-family="sans-serif" font-size="8" font-weight="bold" fill="#6ee7b7" text-anchor="middle">${assigned.name.split(' ')[0]}</text>
        `;
      }
    });

    svgHtml += `</svg>`;
    return svgHtml;
  }

  renderPinInspectorHtml(board) {
    const pinName = this.selectedPinName;
    const pin = (board.pins || []).find(p => p.name === pinName) || board.pins[0] || { name: 'D0', type: 'digital', is5V: true, desc: 'General Purpose I/O' };
    const assigned = this.getAssignedSensor(pin.name);
    const voltage = this.calculatePinVoltage(pin, assigned);

    let pingBadge = '<span class="metric-badge badge-normal" style="font-size: 9px;">IDLE / READY</span>';
    let latencyText = '-- ms';
    if (assigned) {
      const ping = portPinger.getResult(assigned.id);
      if (ping && ping.status !== 'idle') {
        const isPass = ping.status === 'pass';
        pingBadge = `<span class="metric-badge ${isPass ? 'badge-normal' : 'badge-danger'}" style="font-size: 9px;">${ping.badge}</span>`;
        latencyText = `${ping.latencyMs} ms`;
      }
    }

    return `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
        <div>
          <div style="font-size: 11px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Selected Pin Inspector</div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 2px;">
            <span style="font-family: var(--font-mono); font-size: 18px; font-weight: 800; color: var(--accent-cyan);">${pin.name}</span>
            <span class="pin-badge ${pin.is5V ? 'v5' : 'v3'}" style="padding: 2px 6px; font-size: 10px;">${pin.is5V ? '5V TOLERANT' : '3.3V ONLY'}</span>
            <span class="pin-badge" style="background: rgba(255,255,255,0.06); color: var(--text-muted); font-size: 10px;">${pin.type.toUpperCase()}</span>
          </div>
        </div>
        <button class="btn-mini-tool btn-ping-active-pin" data-pin-name="${pin.name}" title="Send diagnostic test pulse to pin ${pin.name}">
          ⚡ Ping Pin
        </button>
      </div>

      <div class="inspector-detail-rows">
        <div class="inspector-row">
          <span class="inspector-label">Assigned Sensor:</span>
          <span class="inspector-val" style="color: ${assigned ? 'var(--accent-emerald)' : 'var(--text-dim)'}; font-weight: 700;">
            ${assigned ? `${assigned.name} [${assigned.id}]` : 'Available (Unassigned)'}
          </span>
        </div>

        <div class="inspector-row">
          <span class="inspector-label">Real-Time Voltage:</span>
          <span class="inspector-val" style="font-family: var(--font-mono); font-weight: 700; color: #38bdf8;">
            ${voltage}
          </span>
        </div>

        <div class="inspector-row">
          <span class="inspector-label">Hardware Capabilities:</span>
          <span class="inspector-val" style="font-size: 11px;">
            ${pin.desc || 'General Purpose Digital Input / Output'}
          </span>
        </div>

        <div class="inspector-row">
          <span class="inspector-label">Ping Status &amp; Latency:</span>
          <span class="inspector-val" style="display: flex; align-items: center; gap: 6px;">
            ${pingBadge}
            <span style="font-family: var(--font-mono); font-size: 10px; color: var(--text-dim);">Latency: ${latencyText}</span>
          </span>
        </div>

        ${assigned && assigned.instructions ? `
          <div style="margin-top: 10px; padding: 8px 10px; background: rgba(0,0,0,0.3); border-radius: var(--radius-sm); border-left: 2px solid var(--accent-cyan); font-size: 11px; color: var(--text-dim); line-height: 1.4;">
            <strong style="color: var(--text-main);">Pin Instructions:</strong> ${assigned.instructions}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderMatrixRowsHtml(board) {
    const pins = board.pins || [];
    const filter = this.activePinFilter;

    const filteredPins = pins.filter(p => {
      const assigned = this.getAssignedSensor(p.name);
      if (filter === 'assigned') return !!assigned;
      if (filter === 'analog') return p.type === 'analog';
      if (filter === 'digital') return p.type === 'digital';
      if (filter === '5v') return p.is5V;
      return true;
    });

    if (filteredPins.length === 0) {
      return `<tr><td colspan="8" style="text-align: center; padding: 18px; color: var(--text-dim);">No pins matching filter [${filter}].</td></tr>`;
    }

    return filteredPins.map(pin => {
      const assigned = this.getAssignedSensor(pin.name);
      const isSelected = this.selectedPinName === pin.name;
      const voltage = this.calculatePinVoltage(pin, assigned);

      let pingBadge = '<span class="status-dot-mini idle"></span> Idle';
      if (assigned) {
        const ping = portPinger.getResult(assigned.id);
        if (ping && ping.status !== 'idle') {
          const isPass = ping.status === 'pass';
          pingBadge = `<span class="status-dot-mini ${isPass ? 'pass' : 'fail'}"></span> ${ping.badge}`;
        }
      }

      return `
        <tr class="matrix-pin-row ${isSelected ? 'row-selected' : ''}" data-pin-name="${pin.name}" style="cursor: pointer;">
          <td style="font-family: var(--font-mono); font-weight: 700; color: ${isSelected ? 'var(--accent-cyan)' : 'var(--text-main)'};">
            ${pin.name}
          </td>
          <td>
            <span class="pin-badge ${pin.type === 'analog' ? 'v3' : 'v5'}" style="font-size: 9px; padding: 2px 6px;">${pin.type.toUpperCase()}</span>
          </td>
          <td>
            <span style="font-size: 11px; color: ${pin.is5V ? 'var(--accent-emerald)' : '#60a5fa'};">
              ${pin.is5V ? '5V Tolerant' : '3.3V Max'}
            </span>
          </td>
          <td style="font-size: 11px; color: var(--text-muted);">
            ${pin.desc || 'General I/O'}
          </td>
          <td>
            ${assigned 
              ? `<span style="font-weight: 600; color: var(--accent-emerald); display: flex; align-items: center; gap: 4px;">📡 ${assigned.name}</span>`
              : `<span style="color: var(--text-dim); font-size: 10px;">Available</span>`
            }
          </td>
          <td style="font-family: var(--font-mono); font-size: 11px; color: #38bdf8;">
            ${voltage}
          </td>
          <td style="font-size: 11px;">
            ${pingBadge}
          </td>
          <td>
            <button class="btn-mini-tool btn-matrix-select-pin" data-pin-name="${pin.name}" style="font-size: 10px; padding: 2px 6px;">
              ${isSelected ? 'Active' : 'Inspect'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  getWiringTip(boardId) {
    switch (boardId) {
      case 'spark_core':
        return 'Spark Core pins D0, D1, D3-D7 and TX/RX are 5V tolerant. Never connect 5V to analog pins A0-A7 or D2 (3.3V max).';
      case 'arduino_uno':
      case 'arduino_nano':
      case 'arduino_mega':
        return 'Standard 5V TTL logic native. When connecting 3.3V I2C/SPI sensors (e.g. BME280), utilize onboard 3.3V power and bidirectional logic level shifters.';
      case 'esp32':
      case 'esp8266':
        return 'ESP32 & ESP8266 pins are strictly 3.3V logic (NOT 5V tolerant!). Connect 5V sensor outputs (e.g. HC-SR04 Echo) through a 1k/2k resistor voltage divider.';
      case 'stm32_bluepill':
      case 'stm32_blackpill':
        return 'STM32 Blue Pill has dedicated FT (Five-volt Tolerant) pins (PA8-PA10, PB6-PB9). Analog channels PA0-PA7 and PB0-PB1 are strictly 3.3V.';
      case 'raspberry_pi_pico':
        return 'RP2040 GPIO pins operate at 3.3V logic with 12mA drive strength. Use ADC channels GP26-GP28 with 3.3V reference voltage.';
      case 'drone_mavlink':
        return 'MAVLink telemetry lines operate over 3.3V or 5V UART. Ensure common ground between flight autopilot and companion computing hub.';
      default:
        return 'Ensure ground (GND) is tied uniformly across all sensor modules and target microcontrollers to avoid ground loops and signal floating.';
    }
  }

  updateVoltageReadouts() {
    if (!this.container) return;
    const board = this.getBoard();
    const pin = (board.pins || []).find(p => p.name === this.selectedPinName);
    if (pin) {
      const inspectorBox = document.getElementById('pinInspectorBox');
      if (inspectorBox) {
        inspectorBox.innerHTML = this.renderPinInspectorHtml(board);
        this.bindInspectorButtons();
      }
    }
  }

  bindEvents() {
    if (!this.container) return;

    // 1. Board Tabs Click
    this.container.querySelectorAll('.schematic-board-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const bId = e.currentTarget.getAttribute('data-board-id');
        this.setBoard(bId);
      });
    });

    // 2. Set as Active Hardware Profile
    const btnApplyActive = document.getElementById('btnApplyBoardAsActive');
    if (btnApplyActive) {
      btnApplyActive.addEventListener('click', () => {
        pinConfig.setBoard(this.selectedBoardId);
        if (this.onActiveBoardChangeCallback) {
          this.onActiveBoardChangeCallback(this.selectedBoardId);
        }
        this.render();
      });
    }

    // 3. Toggle Wiring Guide
    const btnWiring = document.getElementById('btnToggleWiringGuide');
    if (btnWiring) {
      btnWiring.addEventListener('click', () => {
        this.showWiringGuide = !this.showWiringGuide;
        this.render();
      });
    }

    // 4. Toggle Live Voltages
    const btnVoltages = document.getElementById('btnToggleLiveVoltages');
    if (btnVoltages) {
      btnVoltages.addEventListener('click', () => {
        this.showVoltages = !this.showVoltages;
        this.render();
      });
    }

    // 5. Interactive PCB Pin Click
    this.container.querySelectorAll('.pcb-pin-group').forEach(group => {
      group.addEventListener('click', (e) => {
        const pinName = e.currentTarget.getAttribute('data-pin-name');
        this.selectPin(pinName);
      });
    });

    // 6. Matrix Pin Row Click
    this.container.querySelectorAll('.matrix-pin-row').forEach(row => {
      row.addEventListener('click', (e) => {
        const pinName = e.currentTarget.getAttribute('data-pin-name');
        this.selectPin(pinName);
      });
    });

    // 7. Matrix Filter Pills
    this.container.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        this.activePinFilter = e.currentTarget.getAttribute('data-filter');
        this.render();
      });
    });

    this.bindInspectorButtons();
  }

  selectPin(pinName) {
    if (!pinName) return;
    this.selectedPinName = pinName;
    const board = this.getBoard();

    // Re-render SVG to update active pin glow and traces
    const canvas = document.getElementById('pcbCanvasContainer');
    if (canvas) {
      canvas.innerHTML = this.renderCircuitBoardSvg(board);
      // Re-bind SVG pin clicks
      canvas.querySelectorAll('.pcb-pin-group').forEach(group => {
        group.addEventListener('click', (e) => {
          const pName = e.currentTarget.getAttribute('data-pin-name');
          this.selectPin(pName);
        });
      });
    }

    // Update Inspector Box
    const inspectorBox = document.getElementById('pinInspectorBox');
    if (inspectorBox) {
      inspectorBox.innerHTML = this.renderPinInspectorHtml(board);
      this.bindInspectorButtons();
    }

    // Update Matrix Rows highlight
    if (this.container) {
      this.container.querySelectorAll('.matrix-pin-row').forEach(row => {
        const pName = row.getAttribute('data-pin-name');
        if (pName === pinName) {
          row.classList.add('row-selected');
        } else {
          row.classList.remove('row-selected');
        }
      });
    }
  }

  bindInspectorButtons() {
    if (!this.container) return;
    const btnPing = this.container.querySelector('.btn-ping-active-pin');
    if (btnPing) {
      btnPing.addEventListener('click', async (e) => {
        const pinName = e.currentTarget.getAttribute('data-pin-name');
        const assigned = this.getAssignedSensor(pinName);
        btnPing.disabled = true;
        btnPing.innerHTML = '<span style="color: var(--accent-amber);">Pinging...</span>';

        if (assigned) {
          await portPinger.pingSensorPort(assigned.id, { temperature: 24, humidity: 55, distance: 178, motion: 0, light: 620 });
        } else {
          // General port ping delay
          await new Promise(r => setTimeout(r, 200));
        }

        btnPing.disabled = false;
        btnPing.innerHTML = '⚡ Ping Pin';
        this.updateVoltageReadouts();
      });
    }
  }
}

export const circuitBoardSchematic = new CircuitBoardSchematic();
