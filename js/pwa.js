/**
 * Crepe Hekaya — PWA Client Controller
 * Manages service worker registration, install banner, and mobile bottom navigation sync
 */
(function () {
  'use strict';

  let deferredPrompt = null;

  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered successfully, scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  // 2. Check if already installed / running in standalone mode
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  // 3. Listen for BeforeInstallPrompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (!isStandalone) {
      showInstallBanner();
    }
  });

  // 4. In-App Install Banner
  function showInstallBanner() {
    let banner = document.getElementById('pwa-install-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'pwa-install-banner';
      banner.className = 'pwa-install-banner';
      banner.innerHTML = `
        <div class="pwa-banner-content">
          <img src="assets/icons/icon-192.png" alt="كريب حكاية" class="pwa-banner-logo">
          <div class="pwa-banner-text">
            <h4>تطبيق كريب حكاية</h4>
            <p>تثبيت التطبيق على هاتفك لتجربة أسرع وطلب فوري</p>
          </div>
        </div>
        <div class="pwa-banner-actions">
          <button id="pwa-install-btn" class="btn-pwa-install">تثبيت التطبيق</button>
          <button id="pwa-close-btn" class="btn-pwa-dismiss" aria-label="إغلاق">&times;</button>
        </div>
      `;
      document.body.appendChild(banner);

      document.getElementById('pwa-install-btn').addEventListener('click', triggerInstall);
      document.getElementById('pwa-close-btn').addEventListener('click', () => {
        banner.style.display = 'none';
        sessionStorage.setItem('pwa-banner-dismissed', 'true');
      });
    }

    if (!sessionStorage.getItem('pwa-banner-dismissed')) {
      banner.classList.add('active');
    }
  }

  function triggerInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      }
      deferredPrompt = null;
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.style.display = 'none';
    });
  }

  // 5. Update Mobile Bottom Navigation Cart Badge
  function updateMobileCartBadge() {
    try {
      const raw = localStorage.getItem('crepeHekayaCart');
      const cart = raw ? JSON.parse(raw) : [];
      const totalCount = cart.reduce((sum, item) => sum + (item.qty || item.quantity || 1), 0);

      const badges = document.querySelectorAll('.mobile-nav-cart-badge');
      badges.forEach((b) => {
        b.textContent = totalCount;
        b.style.display = totalCount > 0 ? 'flex' : 'none';
      });
    } catch (e) {
      // Ignore
    }
  }

  // Listen for storage events & DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    updateMobileCartBadge();
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'crepeHekayaCart') {
      updateMobileCartBadge();
    }
  });

  // Expose global helper
  window.CrepeHekayaPWA = {
    triggerInstall,
    updateMobileCartBadge
  };
})();
