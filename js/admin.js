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
  let alertedOrderIds = new Set();
  let isFirstLoad = true;
  let isSwitchingPeriod = false;

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

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeHttpUrl(value) {
    if (!value) return '';
    try {
      const url = new URL(String(value), window.location.origin);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch (e) {
      return '';
    }
  }

  function formatWhatsAppPhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.startsWith('20')) return digits;
    if (digits.startsWith('0')) return '20' + digits.slice(1);
    if (digits.length === 10 && digits.startsWith('1')) return '20' + digits;
    return digits;
  }

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
      soundIcon.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      soundLabel.textContent = 'الصوت مفعل';

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
      soundIcon.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
      soundLabel.textContent = 'تفعيل الصوت';
    }
  });

  /* ============================================================
     MULTI-WINDOW FLOATING ORDER NOTIFICATIONS (Interactive Dock)
     ============================================================ */

  function showOrderNotifications(newOrders) {
    if (!newOrders || newOrders.length === 0 || !notificationsDock) return;
    if (currentPeriod !== 'shift' || isSwitchingPeriod) return;

    playNotificationSound();

    newOrders.forEach((order, idx) => {
      if (document.getElementById(`notifWin_${order._id}`)) return;

      const win = document.createElement('div');
      win.className = 'order-notif-window';
      win.id = `notifWin_${order._id}`;
      win.style.animationDelay = `${idx * 0.12}s`;

      const header = document.createElement('div');
      header.className = 'notif-win-header';
      const badge = document.createElement('div');
      badge.className = 'notif-win-badge';
      const bell = document.createElement('i');
      bell.className = 'fa-solid fa-bell';
      const title = document.createElement('span');
      title.textContent = 'طلب جديد';
      const number = document.createElement('span');
      number.className = 'notif-win-num';
      number.textContent = `#${order.orderNumber || '0000'}`;
      badge.append(bell, title, number);
      const close = document.createElement('button');
      close.className = 'notif-win-close';
      close.type = 'button';
      close.title = 'إغلاق النافذة';
      close.setAttribute('aria-label', 'إغلاق النافذة');
      close.textContent = '×';
      header.append(badge, close);

      const body = document.createElement('div');
      body.className = 'notif-win-body';
      const customer = document.createElement('div');
      customer.className = 'notif-win-customer';
      const customerIcon = document.createElement('i');
      customerIcon.className = 'fa-solid fa-user';
      const customerName = document.createElement('strong');
      customerName.textContent = order.customerName || 'عميل';
      customer.append(customerIcon, customerName);
      if (order.customerPhone) {
        const phone = document.createElement('span');
        phone.textContent = ` — ${order.customerPhone}`;
        customer.appendChild(phone);
      }
      const items = document.createElement('div');
      items.className = 'notif-win-items';
      const itemsIcon = document.createElement('i');
      itemsIcon.className = 'fa-solid fa-utensils';
      const itemsSummary = (order.items || [])
        .map(it => `${it.quantity || 0}× ${it.name || 'صنف'}${it.variantLabel ? ` (${it.variantLabel})` : ''}`)
        .join(' ، ');
      const itemsText = document.createElement('span');
      itemsText.textContent = itemsSummary || 'الأصناف';
      items.title = itemsSummary || 'الأصناف';
      items.append(itemsIcon, itemsText);
      const total = document.createElement('div');
      total.className = 'notif-win-total';
      const totalIcon = document.createElement('i');
      totalIcon.className = 'fa-solid fa-coins';
      const totalText = document.createElement('span');
      totalText.textContent = `الإجمالي: ${order.totalAmount || 0} جنيه`;
      total.append(totalIcon, totalText);
      body.append(customer, items, total);

      const actions = document.createElement('div');
      actions.className = 'notif-win-actions';
      const printBtn = document.createElement('button');
      printBtn.className = 'notif-btn-print';
      printBtn.type = 'button';
      printBtn.dataset.orderId = order._id;
      printBtn.textContent = 'قبول وطباعة';
      const viewBtn = document.createElement('button');
      viewBtn.className = 'notif-btn-view';
      viewBtn.type = 'button';
      viewBtn.dataset.orderId = order._id;
      viewBtn.textContent = 'عرض';
      const dismissBtn = document.createElement('button');
      dismissBtn.className = 'notif-btn-dismiss';
      dismissBtn.type = 'button';
      dismissBtn.textContent = 'فهمت';
      actions.append(printBtn, viewBtn, dismissBtn);
      win.append(header, body, actions);

      const closeWin = () => {
        win.classList.add('removing');
        setTimeout(() => win.remove(), 300);
      };
      close.addEventListener('click', closeWin);
      dismissBtn.addEventListener('click', closeWin);

      printBtn.addEventListener('click', async () => {
        printBtn.disabled = true;
        printBtn.textContent = 'جارٍ الطباعة...';
        try {
          await CrepeAPI.apiUpdateOrderStatus(order._id, 'accepted');
          order.status = 'accepted';
          printThermalTickets(order);
          closeWin();
          loadStats();
          loadOrders();
        } catch (err) {
          alert(err.message || 'حدث خطأ أثناء قبول الطلب');
          printBtn.disabled = false;
          printBtn.textContent = 'قبول وطباعة';
        }
      });

      viewBtn.addEventListener('click', () => {
        const orderCard = Array.from(document.querySelectorAll('[data-card-order-id]'))
          .find(card => card.dataset.cardOrderId === order._id);
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

  async function showDashboard() {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'block';

    try {
      const shiftData = await CrepeAPI.apiGetShift();
      if (shiftData && shiftData.shiftStart) {
        localStorage.setItem(SHIFT_STORAGE_KEY, shiftData.shiftStart);
      }
    } catch (e) {
      console.warn('Could not sync shift from server:', e);
    }

    updateShiftTimeDisplay();
    isFirstLoad = true;
    knownOrderIds.clear();
    loadStats();
    loadOrders();
    if (refreshInterval) clearInterval(refreshInterval);
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
        period: 'shift',
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
    activeFilterBanner.replaceChildren();
    const content = document.createElement('span');
    const icon = document.createElement('i');
    icon.className = 'fa-regular fa-calendar';
    icon.style.marginLeft = '0.35rem';
    content.append(icon, document.createTextNode(` أنت تستعرض الآن: ${label}`));
    if (currentPeriod === 'custom' && startDate) {
      const sStr = new Date(startDate).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
      const eStr = endDate ? new Date(endDate).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : 'الآن';
      content.replaceChildren();
      content.append(icon, document.createTextNode(` استعراض طلبات وإيرادات الفترة من ${sStr} إلى ${eStr}`));
    }
    activeFilterBanner.append(content);
    activeFilterBanner.style.display = 'flex';
  }

  /* ============================================================
     LOAD STATS
     ============================================================ */

  async function loadStats() {
    try {
      const { startDate, endDate, period, statSuffix } = getDateRangeForPeriod();
      const data = await CrepeAPI.apiGetStats(startDate, endDate, period);
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

    document.getElementById('ktOrderNum').textContent = '#' + (order.orderNumber || '0');
    document.getElementById('ktTime').textContent = timeStr;
    document.getElementById('ktCustomer').textContent = 'العميل: ' + (order.customerName || 'عميل') + (order.customerPhone ? ' (' + order.customerPhone + ')' : '');

    const ktItems = document.getElementById('ktItems');
    ktItems.replaceChildren();
    (order.items || []).forEach(item => {
      const row = document.createElement('div');
      row.className = 'kitchen-item-row';
      const line = document.createElement('div');
      const qty = document.createElement('span');
      qty.className = 'item-qty';
      qty.textContent = `${Number(item.quantity) || 0}×`;
      const name = document.createElement('strong');
      name.textContent = item.name || 'صنف';
      line.append(qty, name);
      row.append(line);
      if (item.variantLabel) {
        const variant = document.createElement('div');
        variant.className = 'kitchen-item-notes';
        variant.textContent = `الحجم/النوع: ${item.variantLabel}`;
        row.append(variant);
      }
      if (Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0) {
        const options = document.createElement('div');
        options.className = 'kitchen-item-notes';
        options.textContent = `إضافات: ${item.selectedOptions.join(' + ')}`;
        row.append(options);
      }
      ktItems.append(row);
    });

    const ktNotes = document.getElementById('ktNotes');
    ktNotes.replaceChildren();
    if (order.notes) {
      const label = document.createElement('strong');
      label.textContent = 'ملاحظات العميل:';
      const notes = document.createElement('span');
      notes.textContent = order.notes;
      ktNotes.append(label, document.createTextNode(' '), notes);
    }

    document.getElementById('ctOrderNum').textContent = '#' + (order.orderNumber || '0');
    document.getElementById('ctTime').textContent = timeStr;
    document.getElementById('ctCustomer').textContent = order.customerName || 'عميل';
    document.getElementById('ctPhone').textContent = order.customerPhone || '-';
    document.getElementById('ctAddress').textContent = order.deliveryAddress || 'استلام من المطعم';

    const ctMapRow = document.getElementById('ctMapRow');
    const ctMap = document.getElementById('ctMap');
    const mapUrl = safeHttpUrl(order.mapLocation);
    ctMap.replaceChildren();
    if (mapUrl) {
      ctMapRow.style.display = 'block';
      const link = document.createElement('a');
      link.href = mapUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.color = '#000';
      link.style.textDecoration = 'underline';
      link.textContent = 'فتح موقع GPS في جوجل ماب';
      ctMap.append(link);
    } else {
      ctMapRow.style.display = 'none';
    }

    const ctItems = document.getElementById('ctItems');
    ctItems.replaceChildren();
    (order.items || []).forEach(item => {
      const row = document.createElement('div');
      row.className = 'receipt-item-row';
      const name = document.createElement('div');
      name.style.flex = '2';
      const itemName = document.createElement('strong');
      itemName.textContent = item.name || 'صنف';
      name.append(itemName);
      if (item.variantLabel) name.append(document.createTextNode(` (${item.variantLabel})`));
      if (Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0) {
        const options = document.createElement('div');
        options.style.fontSize = '10px';
        options.style.color = '#555';
        options.textContent = `+ ${item.selectedOptions.join(', ')}`;
        name.append(options);
      }
      const qty = document.createElement('div');
      qty.style.flex = '1';
      qty.style.textAlign = 'center';
      qty.textContent = String(Number(item.quantity) || 0);
      const total = document.createElement('div');
      total.style.flex = '1';
      total.style.textAlign = 'left';
      total.style.fontWeight = 'bold';
      total.textContent = `${Number(item.totalPrice) || 0} ج`;
      row.append(name, qty, total);
      ctItems.append(row);
    });
    document.getElementById('ctSubtotal').textContent = `${Number(order.totalAmount) || 0} ج`;
    document.getElementById('ctDelivery').textContent = '0 ج';
    document.getElementById('ctTotal').textContent = `${Number(order.totalAmount) || 0} ج`;

    setTimeout(() => {
      window.print();
    }, 150);
  }

  /* ============================================================
     LOAD ORDERS (with new order detection)
     ============================================================ */

  async function loadOrders() {
    try {
      const { startDate, endDate, period } = getDateRangeForPeriod();
      const data = await CrepeAPI.apiGetOrders(1, 50, currentFilter || undefined, startDate, endDate, period);
      if (!data.success || data.orders.length === 0) {
        currentLoadedOrders = [];
        ordersList.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:2rem;">لا توجد طلبات في هذه الفترة</p>';
        isFirstLoad = false;
        isSwitchingPeriod = false;
        return;
      }

      currentLoadedOrders = data.orders;

      // ---- Detect genuinely new incoming orders ----
      // Rules for firing alarms & notification windows:
      // 1. Must be active shift view (currentPeriod === 'shift')
      // 2. Must NOT be initial page load or switching periods
      // 3. Sound must be enabled
      // 4. Order must be 'pending' status
      // 5. Order must NOT have been alerted before
      // 6. Order must be recently created (within last 15 minutes)
      const newOrders = [];

      if (currentPeriod === 'shift' && !isFirstLoad && !isSwitchingPeriod) {
        const nowMs = Date.now();
        data.orders.forEach(order => {
          if (order.status !== 'pending') return;
          if (alertedOrderIds.has(order._id)) return;
          const createdMs = new Date(order.createdAt).getTime();
          if (!isNaN(createdMs) && (nowMs - createdMs < 15 * 60 * 1000)) {
            newOrders.push(order);
          }
        });

        if (newOrders.length > 0) {
          newOrders.forEach(o => alertedOrderIds.add(o._id));
          showOrderNotifications(newOrders);
        }
      }

      // Mark all orders as known
      data.orders.forEach(order => {
        knownOrderIds.add(order._id);
        if (currentPeriod !== 'shift') {
          // If viewing historical orders, permanently mark them as alerted so returning to shift never alarms on them
          alertedOrderIds.add(order._id);
        }
      });

      isFirstLoad = false;
      isSwitchingPeriod = false;

      // ---- Render orders ----
      const newOrderIdSet = new Set(newOrders.map(o => o._id));

      ordersList.innerHTML = data.orders.map(order => {
        const date = new Date(order.createdAt);
        const timeStr = date.toLocaleString('ar-EG', {
          month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        const items = order.items || [];
        const itemsHtml = items.map(item =>
          `<div class="order-item-row">
            <span>${escapeHtml(item.name)} ${item.variantLabel ? `(${escapeHtml(item.variantLabel)})` : ''} × ${escapeHtml(item.quantity)}</span>
            <span>${escapeHtml(item.totalPrice)} ج</span>
          </div>`
        ).join('');

        let actionsHtml = '';
        const s = order.status;
        const actions = [];

        if (s !== 'delivered' && s !== 'cancelled') {
          if (s === 'pending') {
            actions.push({ action: 'accept_print', label: 'قبول وطباعة', cls: 'accept-print' });
            actions.push({ action: 'accepted', label: 'قبول فقط', cls: 'accept' });
          }
          if (s === 'accepted') actions.push({ action: 'preparing', label: 'بدأ التحضير', cls: 'prepare' });
          if (s === 'preparing') actions.push({ action: 'ready', label: 'جاهز للتسليم', cls: 'ready' });
          if (s === 'ready') actions.push({ action: 'delivered', label: 'تم التوصيل', cls: 'deliver' });
          actions.push({ action: 'cancelled', label: 'إلغاء', cls: 'cancel' });
        }

        actions.push({ action: 'print_only', label: 'طباعة الفاتورة', cls: 'print' });

        actionsHtml = `<div class="order-status-actions">
          ${actions.map(a => `<button class="status-action-btn status-action-btn--${escapeHtml(a.cls)}" data-order-id="${escapeHtml(order._id)}" data-action="${escapeHtml(a.action)}">${escapeHtml(a.label)}</button>`).join('')}
        </div>`;

        const highlightClass = newOrderIdSet.has(order._id) ? ' new-order-highlight' : '';
        const phoneDigits = String(order.customerPhone || '').replace(/\D/g, '');
        const whatsappPhone = formatWhatsAppPhone(order.customerPhone);
        const mapUrl = safeHttpUrl(order.mapLocation);

        return `
          <div class="admin-order-card${highlightClass}" data-card-order-id="${escapeHtml(order._id)}">
            <div class="order-card-header">
              <div>
                <span class="order-num">#${escapeHtml(order.orderNumber)}</span>
                <span class="order-customer"> — ${escapeHtml(order.customerName || 'عميل')}</span>
              </div>
              <span class="order-status-badge" style="background:${escapeHtml(statusColors[order.status] || '#6B7280')};">${escapeHtml(statusLabels[order.status] || order.status)}</span>
            </div>
            <div class="order-items-list">${itemsHtml}</div>
            
            <div class="order-customer-details">
              ${phoneDigits ? `
                <div class="order-detail-line">
                  <span>الهاتف:</span>
                  <a href="tel:${phoneDigits}" class="detail-link">${escapeHtml(order.customerPhone)}</a>
                  ${whatsappPhone ? `<a href="https://wa.me/${whatsappPhone}" target="_blank" rel="noopener noreferrer" class="detail-wa-btn">واتساب</a>` : ''}
                </div>
              ` : ''}
              ${order.deliveryAddress ? `
                <div class="order-detail-line">
                  <span>العنوان:</span>
                  <span style="color:var(--color-text);font-weight:600;">${escapeHtml(order.deliveryAddress)}</span>
                </div>
              ` : ''}
              ${mapUrl ? `
                <div class="order-detail-line">
                  <span>الموقع بالخريطة:</span>
                  <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="detail-map-btn">
                    <i class="fa-solid fa-location-dot"></i> موقع العميل GPS
                  </a>
                </div>
              ` : ''}
            </div>

            ${order.notes ? `<div class="order-notes">ملاحظات: ${escapeHtml(order.notes)}</div>` : ''}
            <div class="order-card-footer">
              <span class="order-total">${escapeHtml(order.totalAmount)} جنيه</span>
              <span class="order-time">${escapeHtml(timeStr)}</span>
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
      ordersList.replaceChildren();
      const message = document.createElement('p');
      message.style.cssText = 'text-align:center;color:#FF4D4D;padding:2rem;';
      message.textContent = error.message || 'حصل مشكلة';
      ordersList.append(message);
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

      try {
        const res = await CrepeAPI.apiResetShift();
        if (res && res.shiftStart) {
          localStorage.setItem(SHIFT_STORAGE_KEY, res.shiftStart);
        }
      } catch (err) {
        console.warn('Server shift reset fallback:', err);
        localStorage.setItem(SHIFT_STORAGE_KEY, new Date().toISOString());
      }
      currentPeriod = 'shift';
      isSwitchingPeriod = true;
      knownOrderIds.clear();
      alertedOrderIds.clear();

      // 1. Instantly zero out stats optimistically
      const statTotalOrders = document.getElementById('statTotalOrders');
      const statRevenue = document.getElementById('statRevenue');
      const statPending = document.getElementById('statPending');
      const statPreparing = document.getElementById('statPreparing');
      if (statTotalOrders) statTotalOrders.textContent = '0';
      if (statRevenue) statRevenue.textContent = '0';
      if (statPending) statPending.textContent = '0';
      if (statPreparing) statPreparing.textContent = '0';

      // 2. Clear notifications dock & orders list immediately
      if (notificationsDock) notificationsDock.innerHTML = '';
      if (ordersList) {
        ordersList.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:2rem;">بدأت وردية جديدة. في انتظار الطلبات الجديدة...</p>';
      }

      document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
      document.querySelector('.period-tab[data-period="shift"]')?.classList.add('active');
      if (customDtBox) customDtBox.style.display = 'none';

      updateShiftTimeDisplay();
      updateActiveFilterBanner();
      await loadStats();
      await loadOrders();
      CrepeAPI.showToast('تم تصفير الوردية وبدء شيفت جديد بنجاح', 'success');
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
      isSwitchingPeriod = true;
      updateActiveFilterBanner();
      loadStats();
      loadOrders();
    });
  });

  // Apply Custom Date/Time Range
  if (btnApplyCustomDt) {
    btnApplyCustomDt.addEventListener('click', () => {
      const startValue = dtStart.value;
      if (!startValue) {
        alert('يرجى تحديد تاريخ وساعة البداية أولاً');
        return;
      }
      const startDate = new Date(startValue);
      if (isNaN(startDate.getTime())) {
        alert('تاريخ وساعة البداية غير صحيحين');
        return;
      }
      let endDate = null;
      if (dtEnd.value) {
        endDate = new Date(dtEnd.value);
        if (isNaN(endDate.getTime())) {
          alert('تاريخ وساعة النهاية غير صحيحين');
          return;
        }
        if (endDate < startDate) {
          alert('يجب أن يكون تاريخ النهاية بعد تاريخ البداية أو مساوياً له');
          return;
        }
      }
      customStartDate = startDate.toISOString();
      customEndDate = endDate ? endDate.toISOString() : null;
      currentPeriod = 'custom';
      isSwitchingPeriod = true;
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
      isSwitchingPeriod = true;
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
