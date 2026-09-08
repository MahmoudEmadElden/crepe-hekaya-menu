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
  const notificationsDock = document.getElementById('adminNotificationsDock');

  let currentFilter = '';
  let refreshInterval = null;

  // Shift & Date Range State
  const SHIFT_STORAGE_KEY = 'crepeHekayaShiftStart';
  let currentPeriod = 'shift'; // 'shift', 'today', 'yesterday', 'all', 'custom'
  let customStartDate = null;
  let customEndDate = null;

  // DOM Elements for Shift & Period & Password
  const btnAdminPw = document.getElementById('btnAdminPw');
  const btnResetShift = document.getElementById('btnResetShift');
  const shiftTimeDisplay = document.getElementById('shiftTimeDisplay');
  const customDtBox = document.getElementById('customDtBox');
  const dtStart = document.getElementById('dtStart');
  const dtEnd = document.getElementById('dtEnd');
  const btnApplyCustomDt = document.getElementById('btnApplyCustomDt');
  const btnClearCustomDt = document.getElementById('btnClearCustomDt');
  const activeFilterBanner = document.getElementById('activeFilterBanner');

  // Notification state
  let soundEnabled = false;
  let audioContext = null;
  let knownOrderIds = new Set();
  let isFirstLoad = true;

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
     MULTI-WINDOW FLOATING ORDER NOTIFICATIONS (Interactive Dock)
     ============================================================ */

  function showOrderNotifications(newOrders) {
    if (!newOrders || newOrders.length === 0 || !notificationsDock) return;

    // Play attention sound
    playNotificationSound();

    newOrders.forEach((order, idx) => {
      // Avoid duplicate windows for the same order
      if (document.getElementById(`notifWin_${order._id}`)) return;

      const win = document.createElement('div');
      win.className = 'order-notif-window';
      win.id = `notifWin_${order._id}`;
      win.style.animationDelay = `${idx * 0.12}s`;

      const itemsSummary = (order.items || [])
        .map(it => `${it.quantity}× ${it.name}${it.variantLabel ? ' (' + it.variantLabel + ')' : ''}`)
        .join(' ، ');

      win.innerHTML = `
        <div class="notif-win-header">
          <div class="notif-win-badge">
            <span class="bell">🔔</span>
            <span>طلب جديد</span>
            <span class="notif-win-num">#${order.orderNumber}</span>
          </div>
          <button class="notif-win-close" title="إغلاق النافذة">&times;</button>
        </div>
        <div class="notif-win-body">
          <div class="notif-win-customer">👤 <strong>${order.customerName || 'عميل'}</strong> ${order.customerPhone ? ' — ' + order.customerPhone : ''}</div>
          <div class="notif-win-items" title="${itemsSummary}">🍽️ ${itemsSummary || 'الأصناف'}</div>
          <div class="notif-win-total">💰 الإجمالي: ${order.totalAmount} جنيه</div>
        </div>
        <div class="notif-win-actions">
          <button class="notif-btn-print" data-order-id="${order._id}">
            <span>🖨️</span> قبول وطباعة
          </button>
          <button class="notif-btn-view" data-order-id="${order._id}">
            <span>🔍</span> عرض
          </button>
          <button class="notif-btn-dismiss">
            فهمت ✓
          </button>
        </div>
      `;

      // Handlers
      const closeWin = () => {
        win.classList.add('removing');
        setTimeout(() => win.remove(), 300);
      };

      // Close & Dismiss buttons
      win.querySelector('.notif-win-close').addEventListener('click', closeWin);
      win.querySelector('.notif-btn-dismiss').addEventListener('click', closeWin);

      // Print & Accept button directly from the window!
      win.querySelector('.notif-btn-print').addEventListener('click', async () => {
        const btn = win.querySelector('.notif-btn-print');
        btn.disabled = true;
        btn.innerHTML = 'جارٍ الطباعة...';
        try {
          await CrepeAPI.apiUpdateOrderStatus(order._id, 'accepted');
          order.status = 'accepted';
          printThermalTickets(order);
          closeWin();
          loadStats();
          loadOrders();
        } catch (err) {
          alert(err.message || 'حدث خطأ أثناء قبول الطلب');
          btn.disabled = false;
          btn.innerHTML = '<span>🖨️</span> قبول وطباعة';
        }
      });

      // View & Highlight in main list
      win.querySelector('.notif-btn-view').addEventListener('click', () => {
        const orderCard = document.querySelector(`[data-card-order-id="${order._id}"]`);
        if (orderCard) {
          orderCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          orderCard.classList.add('new-order-highlight');
          setTimeout(() => orderCard.classList.remove('new-order-highlight'), 3000);
        }
      });

      notificationsDock.appendChild(win);
    });
  }

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
     SHIFT & DATE RANGE HELPERS
     ============================================================ */

  function getShiftStartTime() {
    let stored = localStorage.getItem(SHIFT_STORAGE_KEY);
    if (!stored) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      stored = d.toISOString();
      localStorage.setItem(SHIFT_STORAGE_KEY, stored);
    }
    return stored;
  }

  function updateShiftTimeDisplay() {
    if (!shiftTimeDisplay) return;
    const shiftStart = new Date(getShiftStartTime());
    const now = new Date();
    const isToday = shiftStart.toDateString() === now.toDateString();

    const timeStr = shiftStart.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (isToday) {
      shiftTimeDisplay.textContent = `اليوم منذ ${timeStr}`;
    } else {
      const dateStr = shiftStart.toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric'
      });
      shiftTimeDisplay.textContent = `${dateStr} الساعة ${timeStr}`;
    }
  }

  function getDateRangeForPeriod() {
    const now = new Date();

    if (currentPeriod === 'shift') {
      return {
        startDate: getShiftStartTime(),
        endDate: null,
        label: 'الوردية الحالية',
        statSuffix: 'الوردية'
      };
    }

    if (currentPeriod === 'today') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        label: 'اليوم كاملاً',
        statSuffix: 'اليوم'
      };
    }

    if (currentPeriod === 'yesterday') {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        label: 'أمس',
        statSuffix: 'أمس'
      };
    }

    if (currentPeriod === 'custom') {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
        label: 'فترة مخصصة',
        statSuffix: 'الفترة المحددة'
      };
    }

    // 'all'
    return {
      startDate: 'all',
      endDate: null,
      label: 'كل الأوقات',
      statSuffix: 'الكلي'
    };
  }

  function updateActiveFilterBanner() {
    if (!activeFilterBanner) return;
    if (currentPeriod === 'shift') {
      activeFilterBanner.style.display = 'none';
      return;
    }

    const { label, startDate, endDate } = getDateRangeForPeriod();
    let text = `<span>📅 أنت تستعرض الآن: <strong>${label}</strong></span>`;
    if (currentPeriod === 'custom' && startDate) {
      const sStr = new Date(startDate).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
      const eStr = endDate ? new Date(endDate).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : 'الآن';
      text = `<span>📅 استعراض طلبات وإيرادات الفترة من <strong>${sStr}</strong> إلى <strong>${eStr}</strong></span>`;
    }
    activeFilterBanner.innerHTML = text;
    activeFilterBanner.style.display = 'flex';
  }

  /* ============================================================
     LOAD STATS
     ============================================================ */

  async function loadStats() {
    try {
      const { startDate, endDate, statSuffix } = getDateRangeForPeriod();
      const data = await CrepeAPI.apiGetStats(startDate, endDate);
      if (data.success) {
        document.getElementById('statTotalOrders').textContent = data.stats.totalOrdersToday;
        document.getElementById('statRevenue').textContent = data.stats.totalRevenueToday;
        document.getElementById('statPending').textContent = data.stats.pendingOrders;
        document.getElementById('statPreparing').textContent = data.stats.preparingOrders;

        const statTotalLabel = document.querySelector('#statTotalOrders + .stat-label');
        const statRevenueLabel = document.querySelector('#statRevenue + .stat-label');
        if (statTotalLabel) statTotalLabel.textContent = `طلبات ${statSuffix}`;
        if (statRevenueLabel) statRevenueLabel.textContent = `إيرادات ${statSuffix} (ج)`;
      }
    } catch (error) {
      console.error('Stats error:', error);
    }
  }

  /* ============================================================
     LOAD ORDERS (with new order detection)
     ============================================================ */

  let currentLoadedOrders = [];

  /* ============================================================
     DUAL THERMAL PRINTING LOGIC (Kitchen Ticket + Cashier Receipt)
     ============================================================ */

  function printThermalTickets(order) {
    if (!order) return;

    const date = new Date(order.createdAt || Date.now());
    const timeStr = date.toLocaleString('ar-EG', {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    // 1. Kitchen Ticket (No Prices, Large bold text, items + variations + notes)
    document.getElementById('ktOrderNum').textContent = '#' + (order.orderNumber || '0');
    document.getElementById('ktTime').textContent = timeStr;
    document.getElementById('ktCustomer').textContent = 'العميل: ' + (order.customerName || 'عميل') + (order.customerPhone ? ' (' + order.customerPhone + ')' : '');

    const ktItemsHtml = (order.items || []).map(item => {
      const variantStr = item.variantLabel ? `<div class="kitchen-item-notes">الحجم/النوع: ${item.variantLabel}</div>` : '';
      const optionsStr = item.selectedOptions && item.selectedOptions.length
        ? `<div class="kitchen-item-notes">إضافات: ${item.selectedOptions.join(' + ')}</div>`
        : '';
      return `
        <div class="kitchen-item-row">
          <div><span class="item-qty">${item.quantity}×</span> <strong>${item.name}</strong></div>
          ${variantStr}
          ${optionsStr}
        </div>
      `;
    }).join('');
    document.getElementById('ktItems').innerHTML = ktItemsHtml;
    document.getElementById('ktNotes').innerHTML = order.notes ? `<strong>ملاحظات العميل:</strong> ${order.notes}` : '';

    // 2. Cashier Ticket (Full Breakdown with Prices & Total)
    document.getElementById('ctOrderNum').textContent = '#' + (order.orderNumber || '0');
    document.getElementById('ctTime').textContent = timeStr;
    document.getElementById('ctCustomer').textContent = order.customerName || 'عميل';
    document.getElementById('ctPhone').textContent = order.customerPhone || '-';
    document.getElementById('ctAddress').textContent = order.deliveryAddress || 'استلام من المطعم';

    const ctMapRow = document.getElementById('ctMapRow');
    const ctMap = document.getElementById('ctMap');
    if (order.mapLocation) {
      ctMapRow.style.display = 'block';
      ctMap.innerHTML = `<a href="${order.mapLocation}" target="_blank" style="color:#000;text-decoration:underline;">فتح موقع GPS في جوجل ماب</a>`;
    } else {
      ctMapRow.style.display = 'none';
    }

    const ctItemsHtml = (order.items || []).map(item => {
      const optStr = item.selectedOptions && item.selectedOptions.length
        ? `<div style="font-size:10px;color:#555;">+ ${item.selectedOptions.join(', ')}</div>`
        : '';
      return `
        <div class="receipt-item-row">
          <div style="flex:2;">
            <strong>${item.name}</strong> ${item.variantLabel ? '(' + item.variantLabel + ')' : ''}
            ${optStr}
          </div>
          <div style="flex:1;text-align:center;">${item.quantity}</div>
          <div style="flex:1;text-align:left;font-weight:bold;">${item.totalPrice} ج</div>
        </div>
      `;
    }).join('');
    document.getElementById('ctItems').innerHTML = ctItemsHtml;
    document.getElementById('ctSubtotal').textContent = `${order.totalAmount || 0} ج`;
    document.getElementById('ctDelivery').textContent = `0 ج`;
    document.getElementById('ctTotal').textContent = `${order.totalAmount || 0} ج`;

    // Trigger native print dialog (compatible with Windows print & Chrome --kiosk-printing)
    setTimeout(() => {
      window.print();
    }, 150);
  }

  /* ============================================================
     LOAD ORDERS (with new order detection)
     ============================================================ */

  async function loadOrders() {
    try {
      const { startDate, endDate } = getDateRangeForPeriod();
      const data = await CrepeAPI.apiGetOrders(1, 50, currentFilter || undefined, startDate, endDate);
      if (!data.success || data.orders.length === 0) {
        currentLoadedOrders = [];
        ordersList.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:2rem;">\u0644\u0627 \u062a\u0648\u062c\u062f \u0637\u0644\u0628\u0627\u062a \u0641\u064a \u0647\u0630\u0647 \u0627\u0644\u0641\u062a\u0631\u0629</p>';
        return;
      }

      currentLoadedOrders = data.orders;

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

        // Trigger notification windows for genuinely new orders
        if (newOrders.length > 0 && soundEnabled) {
          showOrderNotifications(newOrders);
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
        const actions = [];

        if (s !== 'delivered' && s !== 'cancelled') {
          if (s === 'pending') {
            actions.push({ action: 'accept_print', label: '🖨️ قبول وطباعة', cls: 'accept-print' });
            actions.push({ action: 'accepted', label: 'قبول فقط', cls: 'accept' });
          }
          if (s === 'accepted') actions.push({ action: 'preparing', label: 'بدأ التحضير', cls: 'prepare' });
          if (s === 'preparing') actions.push({ action: 'ready', label: 'جاهز للتسليم', cls: 'ready' });
          if (s === 'ready') actions.push({ action: 'delivered', label: 'تم التوصيل', cls: 'deliver' });
          actions.push({ action: 'cancelled', label: 'إلغاء', cls: 'cancel' });
        }

        // Always provide thermal print action
        actions.push({ action: 'print_only', label: '🖨️ طباعة الفاتورة', cls: 'print' });

        actionsHtml = `<div class="order-status-actions">
          ${actions.map(a => `<button class="status-action-btn status-action-btn--${a.cls}" data-order-id="${order._id}" data-action="${a.action}">${a.label}</button>`).join('')}
        </div>`;

        // Add highlight class for new orders
        const highlightClass = newOrderIdSet.has(order._id) ? ' new-order-highlight' : '';

        return `
          <div class="admin-order-card${highlightClass}" data-card-order-id="${order._id}">
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
              ${order.mapLocation ? `
                <div class="order-detail-line">
                  <span>الموقع بالخريطة:</span>
                  <a href="${order.mapLocation}" target="_blank" class="detail-map-btn">
                    <i class="fa-solid fa-location-dot"></i> موقع العميل GPS
                  </a>
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
     STATUS & PRINT ACTIONS
     ============================================================ */

  ordersList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.status-action-btn');
    if (!btn) return;

    const orderId = btn.dataset.orderId;
    const action = btn.dataset.action;
    const order = currentLoadedOrders.find(o => o._id === orderId);

    // Print Only
    if (action === 'print_only') {
      if (order) {
        printThermalTickets(order);
      }
      return;
    }

    // Accept and Print
    if (action === 'accept_print') {
      btn.disabled = true;
      const originalText = btn.textContent;
      btn.textContent = 'جارٍ الطباعة...';

      try {
        await CrepeAPI.apiUpdateOrderStatus(orderId, 'accepted');
        if (order) {
          order.status = 'accepted';
          printThermalTickets(order);
        }
        await loadStats();
        await loadOrders();
      } catch (error) {
        alert(error.message || 'حدث خطأ أثناء قبول الطلب');
        btn.disabled = false;
        btn.textContent = originalText;
      }
      return;
    }

    // Status updates
    if (action === 'cancelled' && !confirm('\u0645\u062a\u0623\u0643\u062f \u0625\u0646\u0643 \u0639\u0627\u064a\u0632 \u062a\u0644\u063a\u064a \u0627\u0644\u0637\u0644\u0628 \u062f\u0647\u061f')) {
      return;
    }

    btn.disabled = true;
    btn.textContent = '...';

    try {
      await CrepeAPI.apiUpdateOrderStatus(orderId, action);
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
     SHIFT, DATE FILTER & PASSWORD LISTENERS
     ============================================================ */

  // Admin Change Password
  if (btnAdminPw) {
    btnAdminPw.addEventListener('click', () => {
      CrepeAPI.openChangePasswordModal();
    });
  }

  // Reset Shift Button
  if (btnResetShift) {
    btnResetShift.addEventListener('click', async () => {
      const ok = confirm('هل أنت متأكد من تصفير الوردية وبدء شيفت جديد للكاشير؟\nسيتم احتساب الطلبات والإيرادات للوردية الجديدة فقط بدءاً من الآن.');
      if (!ok) return;

      localStorage.setItem(SHIFT_STORAGE_KEY, new Date().toISOString());
      currentPeriod = 'shift';
      document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
      document.querySelector('.period-tab[data-period="shift"]')?.classList.add('active');
      if (customDtBox) customDtBox.style.display = 'none';

      updateShiftTimeDisplay();
      updateActiveFilterBanner();
      await loadStats();
      await loadOrders();
      CrepeAPI.showToast('تم تصفير الوردية وبدء شيفت جديد بنجاح! 🚀', 'success');
    });
  }

  // Period Tabs Click
  document.querySelectorAll('.period-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const period = tab.dataset.period;
      if (period === 'custom') {
        if (customDtBox) {
          customDtBox.style.display = customDtBox.style.display === 'none' ? 'block' : 'none';
        }
        return;
      }
      if (customDtBox) customDtBox.style.display = 'none';
      document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentPeriod = period;
      updateActiveFilterBanner();
      loadStats();
      loadOrders();
    });
  });

  // Apply Custom Date/Time Range
  if (btnApplyCustomDt) {
    btnApplyCustomDt.addEventListener('click', () => {
      if (!dtStart.value) {
        alert('يرجى تحديد تاريخ وساعة البداية أولاً');
        return;
      }
      customStartDate = new Date(dtStart.value).toISOString();
      customEndDate = dtEnd.value ? new Date(dtEnd.value).toISOString() : null;
      currentPeriod = 'custom';
      document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
      document.getElementById('tabCustomPeriod')?.classList.add('active');
      updateActiveFilterBanner();
      loadStats();
      loadOrders();
    });
  }

  // Clear Custom Date/Time Range
  if (btnClearCustomDt) {
    btnClearCustomDt.addEventListener('click', () => {
      if (dtStart) dtStart.value = '';
      if (dtEnd) dtEnd.value = '';
      if (customDtBox) customDtBox.style.display = 'none';
      currentPeriod = 'shift';
      document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
      document.querySelector('.period-tab[data-period="shift"]')?.classList.add('active');
      updateActiveFilterBanner();
      loadStats();
      loadOrders();
    });
  }

  /* ============================================================
     START
     ============================================================ */

  updateShiftTimeDisplay();
  init();
})();
