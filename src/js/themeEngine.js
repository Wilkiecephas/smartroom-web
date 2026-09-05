/**
 * Theme Engine
 * Manages 10 environment design themes and coordinates live style switching.
 */

export const THEME_CATALOG = [
  { id: 'cyber-home', name: 'Cyberpunk Neo-Home', icon: '⚡', category: 'Home' },
  { id: 'modern-home', name: 'Minimal Scandinavian Home', icon: '🏡', category: 'Home' },
  { id: 'luxury-villa', name: 'Luxury Architectural Villa', icon: '🏛️', category: 'Home' },
  { id: 'corporate-office', name: 'Executive Corporate Office', icon: '🏢', category: 'Office' },
  { id: 'heavy-factory', name: 'Industrial Heavy Factory', icon: '🏭', category: 'Factory' },
  { id: 'smart-warehouse', name: 'Smart Logistics Warehouse', icon: '📦', category: 'Warehouse' },
  { id: 'neon-nightclub', name: 'Electric Rave Nightclub', icon: '🔮', category: 'Nightclub' },
  { id: 'space-station', name: 'Deep Orbit Space Station', icon: '🚀', category: 'Science' },
  { id: 'cleanroom-lab', name: 'Bio-Medical Cleanroom Lab', icon: '🔬', category: 'Science' },
  { id: 'matrix-datacenter', name: 'Matrix Server Datacenter', icon: '💾', category: 'Tech' }
];

class ThemeEngine {
  constructor() {
    this.storageKey = 'sr_environment_theme_v1';
    this.activeTheme = this.loadTheme();
    this.listeners = new Set();
    this.applyTheme(this.activeTheme);
  }

  loadTheme() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(this.storageKey);
        if (saved && THEME_CATALOG.some(t => t.id === saved)) {
          return saved;
        }
      }
    } catch (_) {}
    return 'cyber-home';
  }

  setTheme(themeId) {
    if (!THEME_CATALOG.some(t => t.id === themeId)) return;
    this.activeTheme = themeId;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, themeId);
      }
    } catch (_) {}
    this.applyTheme(themeId);
    this.notify();
  }

  applyTheme(themeId) {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', themeId);
  }

  onChange(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.activeTheme));
  }

  getActiveThemeInfo() {
    return THEME_CATALOG.find(t => t.id === this.activeTheme) || THEME_CATALOG[0];
  }
}

export const themeEngine = new ThemeEngine();
