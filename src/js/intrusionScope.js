/**
 * SmartRoom IoT Sentinel - Intrusion Scope & Spatial Security Map
 * Provides:
 * 1. Dual-Channel Real-time Oscilloscope for PIR (D3) & IR (D6) voltages (0 - 3.3V)
 * 2. 2D Spatial Security Floorplan Map with dynamic IR laser beam & PIR detection cone
 */

class IntrusionScope {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.animId = null;

    // Rolling waveform history (120 points ~ 6 seconds at 20Hz sample)
    this.bufferLength = 120;
    this.pirHistory = new Array(this.bufferLength).fill(0.04);
    this.irHistory = new Array(this.bufferLength).fill(3.28);

    // Current live states
    this.pirVoltage = 0.04;
    this.irVoltage = 3.28;
    this.isPirActive = false;
    this.isIrBroken = false;
    this.isProximity = false;
    this.distance = 150;

    // Simulation overrides for manual testing
    this.simPirHoldUntil = 0;
    this.simIrHoldUntil = 0;

    // SVG Map DOM elements
    this.mapContainer = null;
  }

  init(canvasElement, mapContainerElement) {
    this.canvas = canvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
    this.mapContainer = mapContainerElement;

    if (this.mapContainer) {
      this.renderSpatialMap();
    }

    this.startLoop();
  }

  updateReadings({ pirActive, irBroken, isProximity, distance, rawMotionMask }) {
    const now = Date.now();

    // Check manual simulation overrides
    if (now < this.simPirHoldUntil) pirActive = true;
    if (now < this.simIrHoldUntil) irBroken = true;

    this.isPirActive = Boolean(pirActive);
    this.isIrBroken = Boolean(irBroken);
    this.isProximity = Boolean(isProximity);
    if (distance !== undefined) this.distance = Number(distance);

    // Micro-fluctuations for realistic oscilloscope voltage noise (±0.03V)
    const noise = (Math.random() - 0.5) * 0.05;

    // PIR: LOW (0.02V - 0.08V) on standby; HIGH (3.25V - 3.32V) on motion
    this.pirVoltage = this.isPirActive ? Math.min(3.35, 3.28 + noise) : Math.max(0.01, 0.04 + noise * 0.4);

    // IR: Active-LOW sensor! HIGH (3.26V - 3.30V) when beam intact; LOW (0.03V - 0.09V) when beam broken
    this.irVoltage = this.isIrBroken ? Math.max(0.02, 0.05 + noise * 0.4) : Math.min(3.34, 3.28 + noise);

    // Push into circular buffer
    this.pirHistory.push(this.pirVoltage);
    if (this.pirHistory.length > this.bufferLength) this.pirHistory.shift();

    this.irHistory.push(this.irVoltage);
    if (this.irHistory.length > this.bufferLength) this.irHistory.shift();

    this.updateDomReadouts();
    this.updateSpatialMapState();
  }

  updateDomReadouts() {
    // Voltage badges
    const txtPirVolt = document.getElementById('txtScopePirVoltage');
    const badgePirState = document.getElementById('badgeScopePirState');
    if (txtPirVolt) {
      txtPirVolt.textContent = `${this.pirVoltage.toFixed(2)}V`;
      txtPirVolt.style.color = this.isPirActive ? '#ef4444' : '#00f2fe';
    }
    if (badgePirState) {
      badgePirState.textContent = this.isPirActive ? 'MOTION ACTIVE (HIGH)' : 'IDLE / ARMED (LOW)';
      badgePirState.className = this.isPirActive ? 'metric-badge badge-danger' : 'metric-badge badge-cyan';
    }

    const txtIrVolt = document.getElementById('txtScopeIrVoltage');
    const badgeIrState = document.getElementById('badgeScopeIrState');
    if (txtIrVolt) {
      txtIrVolt.textContent = `${this.irVoltage.toFixed(2)}V`;
      txtIrVolt.style.color = this.isIrBroken ? '#ef4444' : '#10b981';
    }
    if (badgeIrState) {
      badgeIrState.textContent = this.isIrBroken ? '🚨 BEAM BROKEN (LOW)' : 'OPTICAL CLEAR (HIGH)';
      badgeIrState.className = this.isIrBroken ? 'metric-badge badge-danger' : 'metric-badge badge-normal';
    }
  }

  startLoop() {
    if (this.animId) cancelAnimationFrame(this.animId);

    const render = () => {
      this.drawOscilloscope();
      this.animId = requestAnimationFrame(render);
    };
    this.animId = requestAnimationFrame(render);
  }

  drawOscilloscope() {
    if (!this.ctx || !this.canvas) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // 1. Dark phosphor phosphor grid background
    ctx.fillStyle = '#030810';
    ctx.fillRect(0, 0, w, h);

    // 2. Draw Voltage Grid Lines (0V, 1.1V, 2.2V, 3.3V)
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.12)';
    ctx.setLineDash([4, 4]);

    const vLevels = [0, 1.1, 2.2, 3.3];
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';

    vLevels.forEach(v => {
      // Map 0V - 3.5V to height
      const y = h - ((v / 3.6) * (h - 26) + 12);
      ctx.beginPath();
      ctx.moveTo(34, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();

      ctx.fillText(`${v.toFixed(1)}V`, 4, y + 3);
    });

    // Vertical time division marks
    for (let x = 40; x < w - 10; x += (w - 50) / 6) {
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, h - 10);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 3. Logic Threshold Line (2.0V TTL standard)
    const yThresh = h - ((2.0 / 3.6) * (h - 26) + 12);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(34, yThresh);
    ctx.lineTo(w - 10, yThresh);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.fillText('2.0V THRESHOLD', w - 90, yThresh - 4);

    // Helper to calculate coordinate
    const getX = (idx) => 36 + (idx / (this.bufferLength - 1)) * (w - 46);
    const getY = (volt) => h - ((Math.max(0, Math.min(3.6, volt)) / 3.6) * (h - 26) + 12);

    // 4. Trace 1: PIR Motion Channel (D3) - Cyan Glow
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 2.2;
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    this.pirHistory.forEach((v, idx) => {
      const x = getX(idx);
      const y = getY(v);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // PIR Leading Dot
    const lastPirX = getX(this.pirHistory.length - 1);
    const lastPirY = getY(this.pirHistory[this.pirHistory.length - 1]);
    ctx.fillStyle = '#00f2fe';
    ctx.beginPath();
    ctx.arc(lastPirX, lastPirY, 4, 0, Math.PI * 2);
    ctx.fill();

    // 5. Trace 2: IR Optical Beam Channel (D6) - Amber / Coral Glow
    ctx.strokeStyle = this.isIrBroken ? '#f43f5e' : '#10b981';
    ctx.lineWidth = 2;
    ctx.shadowColor = this.isIrBroken ? '#f43f5e' : '#10b981';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    this.irHistory.forEach((v, idx) => {
      const x = getX(idx);
      const y = getY(v);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // IR Leading Dot
    const lastIrX = getX(this.irHistory.length - 1);
    const lastIrY = getY(this.irHistory[this.irHistory.length - 1]);
    ctx.fillStyle = this.isIrBroken ? '#f43f5e' : '#10b981';
    ctx.beginPath();
    ctx.arc(lastIrX, lastIrY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  renderSpatialMap() {
    if (!this.mapContainer) return;

    this.mapContainer.innerHTML = `
      <div class="spatial-map-wrapper" style="position: relative; width: 100%; height: 260px; background: radial-gradient(circle, #071322 0%, #030812 100%); border: 1px solid rgba(0, 242, 254, 0.2); border-radius: 8px; overflow: hidden;">
        
        <!-- Architectural Floorplan Blueprint Grid -->
        <svg id="svgSpatialMap" width="100%" height="100%" viewBox="0 0 500 260" xmlns="http://www.w3.org/2000/svg" style="display: block;">
          <defs>
            <!-- Blueprint Pattern -->
            <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0, 242, 254, 0.05)" stroke-width="1"/>
            </pattern>

            <!-- Radial Gradients for Sensors -->
            <radialGradient id="pirConeGradient" cx="12%" cy="20%" r="75%">
              <stop offset="0%" stop-color="rgba(0, 242, 254, 0.45)" />
              <stop offset="60%" stop-color="rgba(0, 242, 254, 0.12)" />
              <stop offset="100%" stop-color="transparent" />
            </radialGradient>
            
            <radialGradient id="pirConeAlertGradient" cx="12%" cy="20%" r="75%">
              <stop offset="0%" stop-color="rgba(239, 68, 68, 0.65)" />
              <stop offset="60%" stop-color="rgba(239, 68, 68, 0.25)" />
              <stop offset="100%" stop-color="transparent" />
            </radialGradient>

            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- Background Grid -->
          <rect width="100%" height="100%" fill="url(#gridPattern)" />

          <!-- Room Architectural Perimeter Walls -->
          <rect x="25" y="20" width="450" height="220" rx="6" fill="none" stroke="rgba(255, 255, 255, 0.18)" stroke-width="2"/>
          <text x="35" y="38" fill="rgba(255, 255, 255, 0.4)" font-size="10" font-family="monospace" font-weight="700">ZONE-A: MAIN CHAMBER</text>

          <!-- Doorway Opening on Right Wall (IR Barrier) -->
          <line x1="475" y1="90" x2="475" y2="170" stroke="#030812" stroke-width="6" />
          <rect x="470" y="86" width="10" height="6" fill="#64748b" rx="1"/>
          <rect x="470" y="168" width="10" height="6" fill="#64748b" rx="1"/>
          <text x="410" y="82" fill="#94a3b8" font-size="9" font-family="monospace">DOORWAY ENTRY</text>

          <!-- 1. PIR Coverage Sector (Top Left Corner: Pin D3) -->
          <path id="svgPirCone" d="M 45 35 L 280 40 A 260 260 0 0 1 120 220 Z" fill="url(#pirConeGradient)" style="transition: fill 0.3s ease; pointer-events: none;" />
          
          <!-- PIR Distance Arc Rings -->
          <path d="M 120 37 A 90 90 0 0 1 65 110" fill="none" stroke="rgba(0, 242, 254, 0.2)" stroke-dasharray="3,3" />
          <path d="M 190 38 A 160 160 0 0 1 90 170" fill="none" stroke="rgba(0, 242, 254, 0.15)" stroke-dasharray="3,3" />

          <!-- PIR Sensor Icon Node -->
          <g transform="translate(45, 35)">
            <circle r="12" fill="#041226" stroke="#00f2fe" stroke-width="2" />
            <circle id="svgPirPulse" r="18" fill="none" stroke="#00f2fe" stroke-width="1.5" opacity="0.6"/>
            <text x="0" y="4" text-anchor="middle" font-size="11">🏃</text>
          </g>
          <text x="65" y="32" fill="#00f2fe" font-size="10" font-family="monospace" font-weight="700">PIR (D3)</text>
          <text id="svgPirStatusText" x="65" y="44" fill="rgba(148, 163, 184, 0.8)" font-size="9" font-family="monospace">110° Cone: ARMED</text>

          <!-- Motion Blip Indicator (When PIR active) -->
          <g id="svgPirBlipGroup" transform="translate(170, 110)" style="display: none;">
            <circle r="14" fill="rgba(239, 68, 68, 0.3)" />
            <circle r="6" fill="#ef4444" />
            <text x="12" y="4" fill="#ef4444" font-size="9" font-family="monospace" font-weight="700">INTRUDER</text>
          </g>

          <!-- 2. IR Intrusion Laser Barrier (Doorway: Pin D6) -->
          <!-- Optical Emitter & Receiver Nodes -->
          <g transform="translate(475, 92)">
            <circle r="5" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
          </g>
          <g transform="translate(475, 168)">
            <circle r="5" fill="#0f172a" stroke="#10b981" stroke-width="1.5" />
          </g>
          
          <!-- Laser Beam Line -->
          <line id="svgIrBeamLine" x1="475" y1="95" x2="475" y2="165" stroke="#10b981" stroke-width="2.5" filter="url(#laserGlow)" style="transition: stroke 0.2s ease, stroke-width 0.2s ease;"/>

          <!-- Laser Breach Warning Pulse Line -->
          <line id="svgIrBreachCross" x1="460" y1="130" x2="490" y2="130" stroke="#ef4444" stroke-width="2" style="display: none;" />

          <text x="350" y="134" text-anchor="end" id="svgIrStatusText" fill="#10b981" font-size="10" font-family="monospace" font-weight="700">IR BEAM D6: SECURE</text>

          <!-- 3. Sonar Radar Visualizer (HC-SR04 Center Node) -->
          <g transform="translate(250, 130)">
            <!-- Concentric Proximity Rings -->
            <circle r="30" fill="none" stroke="rgba(0, 242, 254, 0.15)" stroke-dasharray="2,2"/>
            <circle r="60" fill="none" stroke="rgba(0, 242, 254, 0.12)" stroke-dasharray="2,2"/>
            <circle r="90" fill="none" stroke="rgba(0, 242, 254, 0.08)" stroke-dasharray="2,2"/>
            
            <circle id="svgSonarPulseRing" r="20" fill="none" stroke="#00f2fe" stroke-width="1.5" opacity="0.4"/>
            <circle r="9" fill="#031124" stroke="#00f2fe" stroke-width="2"/>
            <text x="0" y="3.5" text-anchor="middle" font-size="9">📡</text>
          </g>
          <text x="250" y="152" text-anchor="middle" fill="#00f2fe" font-size="9" font-family="monospace" font-weight="700">HC-SR04 SONAR</text>
          <text id="svgSonarDistText" x="250" y="164" text-anchor="middle" fill="rgba(148, 163, 184, 0.9)" font-size="9" font-family="monospace">150 cm</text>
        </svg>

        <!-- Floating Interactive Quick Test Badges (Bottom Overlay) -->
        <div style="position: absolute; bottom: 8px; left: 12px; right: 12px; display: flex; justify-content: space-between; align-items: center; pointer-events: auto;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <button id="btnTestTriggerPir" class="btn-mini-tool" style="background: rgba(0, 242, 254, 0.15); border-color: #00f2fe; color: #00f2fe; font-size: 10px; padding: 3px 8px;" title="Simulate PIR motion pulse (D3)">
              🏃 Test PIR Trigger (3.3V)
            </button>
            <button id="btnTestTriggerIr" class="btn-mini-tool" style="background: rgba(244, 63, 94, 0.15); border-color: #f43f5e; color: #f43f5e; font-size: 10px; padding: 3px 8px;" title="Simulate IR beam break (D6 Active-Low)">
              👁️ Test IR Break (0.04V)
            </button>
          </div>
          <div id="spatialMapSummaryBadge" class="metric-badge badge-normal" style="font-size: 9px; padding: 2px 8px;">
            PERIMETER SECURE
          </div>
        </div>
      </div>
    `;

    // Connect test buttons
    const btnPir = document.getElementById('btnTestTriggerPir');
    if (btnPir) {
      btnPir.addEventListener('click', () => {
        this.simPirHoldUntil = Date.now() + 2500; // Hold for 2.5s
      });
    }

    const btnIr = document.getElementById('btnTestTriggerIr');
    if (btnIr) {
      btnIr.addEventListener('click', () => {
        this.simIrHoldUntil = Date.now() + 2500; // Hold for 2.5s
      });
    }
  }

  updateSpatialMapState() {
    const pirCone = document.getElementById('svgPirCone');
    const pirText = document.getElementById('svgPirStatusText');
    const pirBlip = document.getElementById('svgPirBlipGroup');
    const pirPulse = document.getElementById('svgPirPulse');

    if (pirCone && pirText && pirBlip) {
      if (this.isPirActive) {
        pirCone.setAttribute('fill', 'url(#pirConeAlertGradient)');
        pirText.textContent = '🚨 MOTION DETECTED!';
        pirText.setAttribute('fill', '#ef4444');
        pirBlip.style.display = 'block';
        if (pirPulse) pirPulse.setAttribute('stroke', '#ef4444');
      } else {
        pirCone.setAttribute('fill', 'url(#pirConeGradient)');
        pirText.textContent = '110° Cone: ARMED';
        pirText.setAttribute('fill', 'rgba(148, 163, 184, 0.8)');
        pirBlip.style.display = 'none';
        if (pirPulse) pirPulse.setAttribute('stroke', '#00f2fe');
      }
    }

    const irBeam = document.getElementById('svgIrBeamLine');
    const irText = document.getElementById('svgIrStatusText');
    const irCross = document.getElementById('svgIrBreachCross');

    if (irBeam && irText) {
      if (this.isIrBroken) {
        irBeam.setAttribute('stroke', '#ef4444');
        irBeam.setAttribute('stroke-width', '4');
        irText.textContent = '🚨 TRIPWIRE BREACHED!';
        irText.setAttribute('fill', '#ef4444');
        if (irCross) irCross.style.display = 'block';
      } else {
        irBeam.setAttribute('stroke', '#10b981');
        irBeam.setAttribute('stroke-width', '2.5');
        irText.textContent = 'IR BEAM D6: SECURE';
        irText.setAttribute('fill', '#10b981');
        if (irCross) irCross.style.display = 'none';
      }
    }

    const sonarDist = document.getElementById('svgSonarDistText');
    const sonarPulse = document.getElementById('svgSonarPulseRing');
    if (sonarDist) {
      sonarDist.textContent = `${this.distance.toFixed(0)} cm ${this.isProximity ? '(BREACH)' : ''}`;
      sonarDist.setAttribute('fill', this.isProximity ? '#ef4444' : 'rgba(148, 163, 184, 0.9)');
    }
    if (sonarPulse) {
      sonarPulse.setAttribute('stroke', this.isProximity ? '#ef4444' : '#00f2fe');
    }

    const mapBadge = document.getElementById('spatialMapSummaryBadge');
    if (mapBadge) {
      if (this.isIrBroken || this.isPirActive || this.isProximity) {
        mapBadge.className = 'metric-badge badge-danger';
        mapBadge.textContent = this.isIrBroken ? '🚨 IR TRIPWIRE BREACH' : (this.isPirActive ? '🏃 MOTION DETECTED' : '⚠️ PROXIMITY ALERT');
      } else {
        mapBadge.className = 'metric-badge badge-normal';
        mapBadge.textContent = 'PERIMETER SECURE';
      }
    }
  }
}

export const intrusionScope = new IntrusionScope();
