/**
 * Hesham Fouad King of Crepe — PWA Client Controller
 * Manages service worker registration, install prompts, and badge updates.
 */
(function () {
  'use strict';

  let deferredPrompt = null;

  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('service-worker.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered, scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  // 2. Check if already installed
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
    let banner = document.getElementById('hf-install-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'hf-install-banner';
      banner.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 16px;
        left: 16px;
        max-width: 420px;
        margin: 0 auto;
        background: rgba(3, 18, 21, 0.96);
        border: 1px solid var(--border-gold, #F5A623);
        border-radius: 16px;
        padding: 0.85rem 1rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(245, 166, 35, 0.2);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.85rem;
        z-index: 9999;
        backdrop-filter: blur(16px);
      `;
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <img src="assets/images/logo.png" alt="لوجو هشام فؤاد" style="width: 44px; height: 44px; border-radius: 50%; border: 1px solid #F5A623; object-fit: cover;">
          <div>
            <h4 style="margin: 0; font-size: 0.92rem; font-weight: 800; color: #fff;">تطبيق هشام فؤاد</h4>
            <p style="margin: 0; font-size: 0.78rem; color: #8AA8B0;">ثبّت التطبيق لطلب فوري وسريع</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button id="hf-install-btn" style="background: linear-gradient(135deg, #F5A623, #D9880A); color: #031215; border: none; border-radius: 9999px; padding: 0.45rem 0.9rem; font-weight: 800; font-size: 0.82rem; cursor: pointer;">تثبيت</button>
          <button id="hf-close-btn" style="background: none; border: none; color: #8AA8B0; font-size: 1.25rem; cursor: pointer; padding: 0 0.25rem;">&times;</button>
        </div>
      `;
      document.body.appendChild(banner);

      document.getElementById('hf-install-btn').addEventListener('click', () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('[PWA] User accepted the install prompt');
          }
          deferredPrompt = null;
          banner.style.display = 'none';
        });
      });

      document.getElementById('hf-close-btn').addEventListener('click', () => {
        banner.style.display = 'none';
        sessionStorage.setItem('hf-pwa-dismissed', 'true');
      });
    }

    if (!sessionStorage.getItem('hf-pwa-dismissed')) {
      banner.style.display = 'flex';
    }
  }

  // 5. Update Mobile Bottom Navigation Cart Badge
  function updateCartBadges() {
    try {
      const raw = localStorage.getItem('hesham_fouad_cart');
      const cart = raw ? JSON.parse(raw) : [];
      const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

      const badges = document.querySelectorAll('.cart-badge, .mobile-nav-cart-badge');
      badges.forEach((b) => {
        b.textContent = totalCount;
        b.style.display = totalCount > 0 ? 'flex' : 'none';
      });
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', updateCartBadges);
  window.addEventListener('cartUpdated', updateCartBadges);
})();
