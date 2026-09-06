/**
 * Admin Dashboard Logic — Crepe Hekaya
 * Handles admin login, stats display, orders management, status updates,
 * and real-time notification system with audio + visual alerts.
 */
(function () {
  'use strict';

  const loginScreen = document.getElementById('adminLoginScreen');
  const dashboard = document.getElementById('adminDashboard');
  const loginForm = document.getElementById('adminLoginForm');
  const loginError = document.getElementById('adminLoginError');
  const logoutBtn = document.getElementById('adminLogoutBtn');
  const ordersList = document.getElementById('adminOrdersList');

  // Notification elements
  const soundBtn = document.getElementById('adminSoundBtn');
  const soundIcon = document.getElementById('soundIcon');
  const soundLabel = document.getElementById('soundLabel');
  const notificationOverlay = document.getElementById('notificationOverlay');
  const notifTitle = document.getElementById('notifTitle');
  const notifDetails = document.getElementById('notifDetails');
  const notifDismissBtn = document.getElementById('notifDismissBtn');

  let currentFilter = '';
  let refreshInterval = null;

  // Notification state
  let soundEnabled = false;
  let audioContext = null;
  let knownOrderIds = new Set();
  let isFirstLoad = true;
  let notificationQueue = [];
  let isShowingNotification = false;

  const statusLabels = {
    pending: '\u0641\u064a \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
    accepted: '\u062a\u0645 \u0627\u0644\u0642\u0628\u0648\u0644',
    preparing: '\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0636\u064a\u0631',
    ready: '\u062c\u0627\u0647\u0632',
    delivered: '\u062a\u0645 \u0627\u0644\u062a\u0648\u0635\u064a\u0644',
    cancelled: '\u0645\u0644\u063a\u064a'
  };

  const statusColors = {
    pending: '#F59E0B',
    accepted: '#3B82F6',
    preparing: '#8B5CF6',
    ready: '#10B981',
    delivered: '#6B7280',
    cancelled: '#EF4444'
  };

  /* ============================================================
     NOTIFICATION SOUND SYSTEM (Web Audio API)
     ============================================================ */

  /**
   * Initialize the Web Audio API context.
   * Must be called from a user gesture (click) due to browser autoplay policy.
   */
  function initAudioContext() {
    if (audioContext) return;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  /**
   * Play a loud, attention-grabbing notification sound.
   * Uses Web Audio API to generate a multi-tone alarm sequence.
   * No external audio files needed!
   */
  function playNotificationSound() {
    if (!audioContext || !soundEnabled) return;

    // Resume context if it was suspended (browser policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const now = audioContext.currentTime;

    // Create a repeating alarm pattern: high-low-high-low
    const frequencies = [880, 660, 880, 660, 1100, 880, 1100, 880];
    const noteDuration = 0.15;
    const gap = 0.05;

    frequencies.forEach((freq, i) => {
      const startTime = now + i * (noteDuration + gap);

      // Oscillator (the tone)
      const osc = audioContext.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      // Gain (volume envelope)
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gain.gain.linearRampToValueAtTime(0.3, startTime + noteDuration - 0.02);
      gain.gain.linearRampToValueAtTime(0, startTime + noteDuration);

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });

    // Second pass: play the sequence again after a brief pause for urgency
    const secondPassStart = frequencies.length * (noteDuration + gap) + 0.3;
    frequencies.forEach((freq, i) => {
      const startTime = now + secondPassStart + i * (noteDuration + gap);

      const osc = audioContext.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
      gain.gain.linearRampToValueAtTime(0.35, startTime + noteDuration - 0.02);
      gain.gain.linearRampToValueAtTime(0, startTime + noteDuration);

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });
  }

  /* ============================================================
     SOUND TOGGLE
     ============================================================ */

  soundBtn.addEventListener('click', () => {
    initAudioContext();
    soundEnabled = !soundEnabled;

    if (soundEnabled) {
      soundBtn.classList.add('sound-active');
      soundIcon.textContent = '\uD83D\uDD0A';
      soundLabel.textContent = '\u0627\u0644\u0635\u0648\u062a \u0645\u0641\u0639\u0644';

      // Play a short test beep to confirm it works
      if (audioContext) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioContext.currentTime);
        gain.gain.setValueAtTime(0.15, audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start();
        osc.stop(audioContext.currentTime + 0.2);
      }
    } else {
      soundBtn.classList.remove('sound-active');
      soundIcon.textContent = '\uD83D\uDD07';
      soundLabel.textContent = '\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0635\u0648\u062a';
    }
  });

  /* ============================================================
     NOTIFICATION OVERLAY
     ============================================================ */

  function showNotificationOverlay(newOrders) {
    if (newOrders.length === 0) return;

    // Build notification content
    const order = newOrders[0]; // Show the first new order
    const remaining = newOrders.length - 1;

    notifTitle.textContent = newOrders.length === 1
      ? '\u0637\u0644\u0628 \u062c\u062f\u064a\u062f!'
      : `${newOrders.length} \u0637\u0644\u0628\u0627\u062a \u062c\u062f\u064a\u062f\u0629!`;

    let detailsHtml = `
      <div><strong>#${order.orderNumber}</strong></div>
      <div>${order.customerName || '\u0639\u0645\u064a\u0644'}</div>
      <div>${order.items.length} \u0635\u0646\u0641 \u2014 ${order.totalAmount} \u062c\u0646\u064a\u0647</div>
    `;

    if (remaining > 0) {
      detailsHtml += `<div style="margin-top:0.5rem;font-size:0.85rem;color:#FFD700;">+ ${remaining} \u0637\u0644\u0628\u0627\u062a \u062a\u0627\u0646\u064a\u0629</div>`;
    }

    notifDetails.innerHTML = detailsHtml;

    // Show overlay
    notificationOverlay.classList.add('active');
    isShowingNotification = true;

    // Play sound
    playNotificationSound();

    // Play sound again after 3 seconds if still showing
    setTimeout(() => {
      if (isShowingNotification) {
        playNotificationSound();
      }
    }, 3000);
  }

  function dismissNotification() {
    notificationOverlay.classList.remove('active');
    isShowingNotification = false;

    // Process queue
    if (notificationQueue.length > 0) {
      const nextBatch = notificationQueue.splice(0);
      setTimeout(() => showNotificationOverlay(nextBatch), 500);
    }
  }

  notifDismissBtn.addEventListener('click', dismissNotification);

  // Also dismiss on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isShowingNotification) {
      dismissNotification();
    }
  });

  /* ============================================================
     INIT & NAVIGATION
     ============================================================ */

  function init() {
    if (CrepeAPI.isLoggedIn() && CrepeAPI.isAdmin()) {
      showDashboard();
    } else {
      if (CrepeAPI.isLoggedIn() && !CrepeAPI.isAdmin()) {
        CrepeAPI.removeToken();
      }
      showLogin();
    }
  }

  function showLogin() {
    loginScreen.style.display = 'flex';
    dashboard.style.display = 'none';
    if (refreshInterval) clearInterval(refreshInterval);
  }

  function showDashboard() {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'block';
    isFirstLoad = true;
    knownOrderIds.clear();
    loadStats();
    loadOrders();
    // Auto-refresh every 10 seconds (was 30s before)
    refreshInterval = setInterval(() => {
      loadStats();
      loadOrders();
    }, 10000);
  }

  /* ============================================================
     LOGIN
     ============================================================ */

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';

    const username = document.getElementById('adminUser').value.trim();
    const password = document.getElementById('adminPass').value;

    try {
      const data = await CrepeAPI.apiLogin(username, password);
      if (data.user.role !== 'admin') {
        CrepeAPI.removeToken();
        loginError.textContent = '\u0647\u0630\u0627 \u0627\u0644\u062d\u0633\u0627\u0628 \u0644\u064a\u0633 \u062d\u0633\u0627\u0628 \u0623\u062f\u0645\u0646';
        return;
      }
      showDashboard();
    } catch (error) {
      loginError.textContent = error.message || '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062f\u062e\u0648\u0644 \u063a\u0644\u0637';
    }
  });

  /* ============================================================
     LOGOUT
     ============================================================ */

  logoutBtn.addEventListener('click', () => {
    CrepeAPI.logout();
  });

  /* ============================================================
     LOAD STATS
     ============================================================ */

  async function loadStats() {
    try {
      const data = await CrepeAPI.apiGetStats();
      if (data.success) {
        document.getElementById('statTotalOrders').textContent = data.stats.totalOrdersToday;
        document.getElementById('statRevenue').textContent = data.stats.totalRevenueToday;
        document.getElementById('statPending').textContent = data.stats.pendingOrders;
        document.getElementById('statPreparing').textContent = data.stats.preparingOrders;
      }
    } catch (error) {
      console.error('Stats error:', error);
    }
  }

  /* ============================================================
     LOAD ORDERS (with new order detection)
     ============================================================ */

  async function loadOrders() {
    try {
      const data = await CrepeAPI.apiGetOrders(1, 50, currentFilter || undefined);
      if (!data.success || data.orders.length === 0) {
        ordersList.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:2rem;">\u0645\u0641\u064a\u0634 \u0637\u0644\u0628\u0627\u062a</p>';
        return;
      }

      // ---- Detect new orders ----
      const currentIds = new Set(data.orders.map(o => o._id));
      const newOrders = [];

      if (!isFirstLoad) {
        // Find orders that we haven't seen before
        data.orders.forEach(order => {
          if (!knownOrderIds.has(order._id)) {
            newOrders.push(order);
          }
        });

        // Trigger notification for genuinely new orders
        if (newOrders.length > 0 && soundEnabled) {
          if (isShowingNotification) {
            // Queue them
            notificationQueue.push(...newOrders);
          } else {
            showNotificationOverlay(newOrders);
          }
        }
      }

      // Update known IDs
      knownOrderIds = currentIds;
      isFirstLoad = false;

      // ---- Render orders ----
      const newOrderIdSet = new Set(newOrders.map(o => o._id));

      ordersList.innerHTML = data.orders.map(order => {
        const date = new Date(order.createdAt);
        const timeStr = date.toLocaleString('ar-EG', {
          month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });

        const itemsHtml = order.items.map(item =>
          `<div class="order-item-row">
            <span>${item.name} ${item.variantLabel ? '(' + item.variantLabel + ')' : ''} \u00D7 ${item.quantity}</span>
            <span>${item.totalPrice} \u062C</span>
          </div>`
        ).join('');

        // Status action buttons based on current status
        let actionsHtml = '';
        const s = order.status;
        if (s !== 'delivered' && s !== 'cancelled') {
          const actions = [];
          if (s === 'pending') actions.push({ status: 'accepted', label: '\u0642\u0628\u0648\u0644', cls: 'accept' });
          if (s === 'accepted') actions.push({ status: 'preparing', label: '\u0628\u062f\u0623 \u0627\u0644\u062a\u062d\u0636\u064a\u0631', cls: 'prepare' });
          if (s === 'preparing') actions.push({ status: 'ready', label: '\u062c\u0627\u0647\u0632', cls: 'ready' });
          if (s === 'ready') actions.push({ status: 'delivered', label: '\u062a\u0645 \u0627\u0644\u062a\u0648\u0635\u064a\u0644', cls: 'deliver' });
          actions.push({ status: 'cancelled', label: '\u0625\u0644\u063a\u0627\u0621', cls: 'cancel' });

          actionsHtml = `<div class="order-status-actions">
            ${actions.map(a => `<button class="status-action-btn status-action-btn--${a.cls}" data-order-id="${order._id}" data-new-status="${a.status}">${a.label}</button>`).join('')}
          </div>`;
        }

        // Add highlight class for new orders
        const highlightClass = newOrderIdSet.has(order._id) ? ' new-order-highlight' : '';

        return `
          <div class="admin-order-card${highlightClass}">
            <div class="order-card-header">
              <div>
                <span class="order-num">#${order.orderNumber}</span>
                <span class="order-customer"> \u2014 ${order.customerName || '\u0639\u0645\u064a\u0644'}</span>
              </div>
              <span class="order-status-badge" style="background:${statusColors[order.status] || '#6B7280'};">${statusLabels[order.status] || order.status}</span>
            </div>
            <div class="order-items-list">${itemsHtml}</div>
            
            <div class="order-customer-details">
              ${order.customerPhone ? `
                <div class="order-detail-line">
                  <span>\u0627\u0644\u0647\u0627\u062a\u0641:</span>
                  <a href="tel:${order.customerPhone}" class="detail-link">${order.customerPhone}</a>
                  <a href="https://wa.me/2${order.customerPhone.replace(/^0/, '')}" target="_blank" class="detail-wa-btn">\u0648\u0627\u062a\u0633\u0627\u0628</a>
                </div>
              ` : ''}
              ${order.deliveryAddress ? `
                <div class="order-detail-line">
                  <span>\u0627\u0644\u0639\u0646\u0648\u0627\u0646:</span>
                  <span style="color:var(--color-text);font-weight:600;">${order.deliveryAddress}</span>
                </div>
              ` : ''}
            </div>

            ${order.notes ? `<div class="order-notes">\u0645\u0644\u0627\u062d\u0638\u0627\u062a: ${order.notes}</div>` : ''}
            <div class="order-card-footer">
              <span class="order-total">${order.totalAmount} \u062c\u0646\u064a\u0647</span>
              <span class="order-time">${timeStr}</span>
            </div>
            ${actionsHtml}
          </div>
        `;
      }).join('');

    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        showLogin();
        return;
      }
      ordersList.innerHTML = `<p style="text-align:center;color:#FF4D4D;padding:2rem;">${error.message || '\u062d\u0635\u0644 \u0645\u0634\u0643\u0644\u0629'}</p>`;
    }
  }

  /* ============================================================
     STATUS UPDATE
     ============================================================ */

  ordersList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.status-action-btn');
    if (!btn) return;

    const orderId = btn.dataset.orderId;
    const newStatus = btn.dataset.newStatus;

    if (newStatus === 'cancelled' && !confirm('\u0645\u062a\u0623\u0643\u062f \u0625\u0646\u0643 \u0639\u0627\u064a\u0632 \u062a\u0644\u063a\u064a \u0627\u0644\u0637\u0644\u0628 \u062f\u0647\u061f')) {
      return;
    }

    btn.disabled = true;
    btn.textContent = '...';

    try {
      await CrepeAPI.apiUpdateOrderStatus(orderId, newStatus);
      loadStats();
      loadOrders();
    } catch (error) {
      alert(error.message || '\u062d\u0635\u0644 \u0645\u0634\u0643\u0644\u0629 \u0641\u064a \u062a\u062d\u062f\u064a\u062b \u062d\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628');
      btn.disabled = false;
    }
  });

  /* ============================================================
     FILTER
     ============================================================ */

  document.querySelector('.admin-filter-bar').addEventListener('click', (e) => {
    const btn = e.target.closest('.admin-filter-btn');
    if (!btn) return;

    document.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    loadOrders();
  });

  /* ============================================================
     START
     ============================================================ */

  init();
})();
