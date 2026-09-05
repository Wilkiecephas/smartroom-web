/**
 * Home & Facility Information Manager with Dynamic App Branding
 * Manages user home metadata, room/zone names, and ThingSpeak cloud settings.
 * Dynamically rebrands the dashboard title and browser tab.
 */

export const DEFAULT_HOME_CONFIG = {
  homeName: 'SMART IOT HUB',
  zoneName: 'Central Command & Field Telemetry',
  subtitle: 'Open-Source Multi-Tech Telemetry & Drone Platform',
  ownerName: 'IoT Engineer',
  locationTag: 'Kampala Station / Global',
  builtBy: 'TekStep Apps Uganda 🇺🇬',
  contactEmail: 'support@tekstepapps.org',
  website: 'https://tekstepapps.org',
  thingspeakChannelId: '3475948',
  thingspeakWriteKey: '2W20O13FTT3CIUD3',
  thingspeakReadKey: '',
  autoPublish: true,
  publishIntervalSec: 15 // ThingSpeak free-tier minimum is 15 seconds
};

class HomeConfigManager {
  constructor() {
    this.storageKey = 'sr_home_facility_config_v2';
    this.config = this.loadConfig();
    this.listeners = new Set();
  }

  loadConfig() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          return { ...DEFAULT_HOME_CONFIG, ...JSON.parse(saved) };
        }
      }
    } catch (e) {
      console.warn('Could not parse saved home config:', e);
    }
    return { ...DEFAULT_HOME_CONFIG };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.config));
      }
    } catch (_) {}
    this.applyBranding();
    this.notify();
  }

  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.config));
  }

  applyBranding() {
    if (typeof document === 'undefined') return;

    // 1. Update Browser Window Title
    const homeName = this.config.homeName || DEFAULT_HOME_CONFIG.homeName;
    document.title = `${homeName} - Universal Multi-Domain Telemetry Platform`;

    // 2. Update Header Brand Heading
    const titleEl = document.getElementById('appMainTitle');
    if (titleEl) {
      titleEl.textContent = homeName.toUpperCase();
    }

    // 3. Update Header Brand Subtitle (Without fixed org position)
    const subtitleZoneEl = document.getElementById('brandZoneSubtitle');
    if (subtitleZoneEl) {
      const zone = this.config.zoneName || DEFAULT_HOME_CONFIG.zoneName;
      subtitleZoneEl.innerHTML = `${zone} &bull; <span style="color: var(--accent-cyan); font-weight: 600;">Field Telemetry &amp; Multi-Domain Ops</span>`;
    }

    // 4. Update ThingSpeak Channel Badge
    const tsBadge = document.getElementById('brandTsBadge');
    if (tsBadge) {
      tsBadge.textContent = `THINGSPEAK #${this.config.thingspeakChannelId || '3475948'}`;
    }
  }

  resetDefaults() {
    this.config = { ...DEFAULT_HOME_CONFIG };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.storageKey);
      }
    } catch (_) {}
    this.applyBranding();
    this.notify();
  }
}

export const homeConfig = new HomeConfigManager();
