/**
 * Progressive Web App (PWA) Installation & Service Worker Manager
 * Handles beforeinstallprompt, native install dialogs, offline caching, and cross-platform installation instructions.
 */
class PwaManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isSupported = 'serviceWorker' in navigator;
  }

  init() {
    this.registerServiceWorker();
    this.checkIfInstalled();
    this.bindInstallEvents();
  }

  registerServiceWorker() {
    if (!this.isSupported) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  checkIfInstalled() {
    // Check if running in standalone display mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      this.isInstalled = true;
      this.updateInstallUiInstalled();
    }
  }

  bindInstallEvents() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      this.deferredPrompt = e;

      console.log('[PWA] beforeinstallprompt event captured');
      this.showInstallButtons();
      this.showInstallBanner();
    });

    window.addEventListener('appinstalled', (evt) => {
      console.log('[PWA] SmartRoom Hub was installed successfully!');
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.updateInstallUiInstalled();
      this.hideInstallBanner();
    });
  }

  async install() {
    if (this.deferredPrompt) {
      // Trigger native browser install prompt
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      console.log(`[PWA] User response to install prompt: ${choiceResult.outcome}`);

      if (choiceResult.outcome === 'accepted') {
        this.updateInstallUiInstalled();
      }
      this.deferredPrompt = null;
      this.hideInstallBanner();
    } else {
      // If deferredPrompt is unavailable (e.g. iOS Safari, Edge manual, or already prompted), show the guided install modal
      this.openInstallModal();
    }
  }

  showInstallButtons() {
    const btnHeader = document.getElementById('btnInstallPwa');
    if (btnHeader) {
      btnHeader.style.display = 'inline-flex';
      btnHeader.classList.add('pulse-install-badge');
    }

    const mBtnInstall = document.getElementById('mBtnInstall');
    if (mBtnInstall) {
      mBtnInstall.style.display = 'inline-flex';
    }

    const compactBtn = document.getElementById('compactBtnInstallApp');
    if (compactBtn) {
      compactBtn.style.display = 'inline-flex';
    }
  }

  updateInstallUiInstalled() {
    const btnHeader = document.getElementById('btnInstallPwa');
    if (btnHeader) {
      btnHeader.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Installed</span>
      `;
      btnHeader.classList.remove('pulse-install-badge');
      btnHeader.disabled = true;
      btnHeader.style.opacity = '0.7';
    }

    const mBtnInstall = document.getElementById('mBtnInstall');
    if (mBtnInstall) {
      mBtnInstall.style.opacity = '0.5';
    }
  }

  showInstallBanner() {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner && !this.isInstalled) {
      banner.classList.add('visible');
    }
  }

  hideInstallBanner() {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) {
      banner.classList.remove('visible');
    }
  }

  openInstallModal() {
    const modal = document.getElementById('modalInstallApp');
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeInstallModal() {
    const modal = document.getElementById('modalInstallApp');
    if (modal) {
      modal.classList.remove('active');
    }
  }
}

export const pwaManager = new PwaManager();
