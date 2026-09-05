/**
 * TekStep Apps Uganda Information & Contact Center
 * Presents organization metadata, African IoT innovation mission,
 * developer contact channels, and open-source licensing details.
 */

export const TEKSTEP_INFO = {
  appName: 'SMART IOT HUB',
  developer: 'TekStep Apps Uganda 🇺🇬',
  country: 'Uganda (East Africa)',
  city: 'Kampala',
  email: 'support@tekstepapps.org',
  devEmail: 'innovations@tekstepapps.org',
  website: 'https://tekstepapps.org',
  github: 'https://github.com/tekstep-apps/smart-iot-hub',
  license: 'MIT Open-Source License',
  version: '2.5.0-Universal',
  mission: 'Empowering African and global engineers, makers, agritech farmers, and drone operators with world-class, open-source multi-technology telemetry, automation, and hardware tools. Visit tekstepapps.org for energy & digital innovations.'
};

export function renderAboutModalHtml() {
  return `
    <div class="tekstep-about-container">
      <div class="tekstep-hero-card">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <div style="font-size: 32px;">🇺🇬</div>
          <div>
            <div style="font-size: 18px; font-weight: 800; color: var(--accent-cyan); letter-spacing: 0.5px;">SMART IOT HUB</div>
            <div style="font-size: 12px; font-weight: 700; color: var(--text-main);">Built by TekStep Apps Uganda</div>
          </div>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px;">
          ${TEKSTEP_INFO.mission}
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <span class="badge" style="background: rgba(0, 242, 254, 0.15); color: var(--accent-cyan); border: 1px solid rgba(0, 242, 254, 0.3);">Open-Source (MIT)</span>
          <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); border: 1px solid rgba(16, 185, 129, 0.3);">Uganda 🇺🇬 Innovation</span>
          <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: var(--accent-amber); border: 1px solid rgba(245, 158, 11, 0.3);">v${TEKSTEP_INFO.version}</span>
          <a href="https://tekstepapps.org" target="_blank" rel="noopener noreferrer" class="badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); text-decoration: none;">tekstepapps.org ↗</a>
        </div>
      </div>

      <div class="two-point-grid" style="gap: 12px; margin-top: 14px;">
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px;">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--accent-cyan); font-weight: 700; margin-bottom: 6px;">Contact & Support</div>
          <div style="font-size: 12px; color: var(--text-main); margin-bottom: 4px;">
            🌐 <strong>Web:</strong> <a href="${TEKSTEP_INFO.website}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-cyan); text-decoration: none;">${TEKSTEP_INFO.website}</a>
          </div>
          <div style="font-size: 12px; color: var(--text-main); margin-bottom: 4px;">
            📧 <strong>Email:</strong> <a href="mailto:${TEKSTEP_INFO.email}" style="color: var(--accent-cyan); text-decoration: none;">${TEKSTEP_INFO.email}</a>
          </div>
          <div style="font-size: 12px; color: var(--text-main); margin-bottom: 4px;">
            🛠️ <strong>Engineering:</strong> <a href="mailto:${TEKSTEP_INFO.devEmail}" style="color: var(--accent-cyan); text-decoration: none;">${TEKSTEP_INFO.devEmail}</a>
          </div>
          <div style="font-size: 12px; color: var(--text-main);">
            📍 <strong>Location:</strong> Kampala, Uganda
          </div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px;">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--accent-cyan); font-weight: 700; margin-bottom: 6px;">Supported Ecosystems</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 11px; color: var(--text-dim); line-height: 1.6;">
            <li>12+ Microcontrollers (Arduino, ESP32, STM32, Pico, Particle)</li>
            <li>Drones & UAV Flight Telemetry (PX4, ArduPilot MAVLink)</li>
            <li>Agritech Smart Irrigation & Soil NPK Analyzers</li>
            <li>WebUSB, WebSerial, Web Bluetooth (BLE) & Cellular SIM</li>
          </ul>
        </div>
      </div>

      <div style="margin-top: 14px; padding: 12px; background: rgba(0, 0, 0, 0.25); border-radius: var(--radius-md); font-family: var(--font-mono); font-size: 11px; color: var(--text-dim);">
        <strong style="color: var(--text-main);">Open-Source License Notice:</strong><br>
        Permission is hereby granted, free of charge, to any person obtaining a copy of this software to use, copy, modify, merge, publish, distribute, sublicense, and sell copies under the MIT License.
      </div>
    </div>
  `;
}
