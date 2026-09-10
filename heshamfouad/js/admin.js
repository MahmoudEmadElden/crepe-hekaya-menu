/**
 * Admin & Cashier Dashboard Logic â€” Hesham Fouad King of Crepe
 * Handles login, shift reset, date/time filtering, thermal ticket printing,
 * password change, audio alerts, and real-time order polling.
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

  let currentFilter = '';
  let refreshInterval = null;

  // Shift & Date Range State
  const SHIFT_STORAGE_KEY = 'heshamFouadShiftStart';
  let currentPeriod = 'shift';
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

  // Password Modal Elements
  const pwModal = document.getElementById('pwModal');
  const pwModalClose = document.getElementById('pwModalClose');
  const pwForm = document.getElementById('pwForm');
  const currentPwInput = document.getElementById('currentPw');
  const newPwInput = document.getElementById('newPw');
  const confirmPwInput = document.getElementById('confirmPw');
  const pwError = document.getElementById('pwError');
  const pwSuccess = document.getElementById('pwSuccess');

  // Audio Context & Notifications State
  let soundEnabled = false;
  let audioContext = null;
  let knownOrderIds = new Set();
  let alertedOrderIds = new Set();
  let isFirstLoad = true;
  let isSwitchingPeriod = false;

const statusLabels = {
    pending: 'قيد الانتظار',
    accepted: 'تم قبول الطلب',
    preparing: 'جاري تحضير الكريب',
    ready: 'جاهز للاستلام',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي'
  };

  /* ============================================================
     AUDIO ALERT SYSTEM (Web Audio API)
     ============================================================ */
  function initAudioContext() {
    if (audioContext) return;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  function playNotificationSound() {
    if (!audioContext || !soundEnabled) return;

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const now = audioContext.currentTime;
    const frequencies = [880, 660, 880, 660, 1100, 880, 1100, 880];
    const noteDuration = 0.15;
    const gap = 0.05;

    frequencies.forEach((freq, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * (noteDuration + gap));

      const startTime = now + index * (noteDuration + gap);
      const endTime = startTime + noteDuration;

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.4, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, endTime);

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.start(startTime);
      osc.stop(endTime);
    });
  }

function toggleSound() {
    initAudioContext();
    soundEnabled = !soundEnabled;

    if (soundEnabled) {
      soundBtn.classList.add('active');
      soundIcon.innerHTML = '<i class="fas fa-volume-up"></i>';
      soundLabel.textContent = 'الصوت مفعل';
      playNotificationSound();
    } else {
      soundBtn.classList.remove('active');
      soundIcon.innerHTML = '<i class="fas fa-volume-mute"></i>';
      soundLabel.textContent = 'تعطيل الصوت';
    }
  }

  /* ============================================================
     SHIFT TIMING & STORAGE
     ============================================================ */
  function getShiftStart() {
    let saved = localStorage.getItem(SHIFT_STORAGE_KEY);
    if (!saved) {
      const now = new Date();
      saved = now.toISOString();
      localStorage.setItem(SHIFT_STORAGE_KEY, saved);
    }
    return new Date(saved);
  }

  async function resetShift() {
    const shiftStart = getShiftStart();
    const formattedShift = formatDateTimeArabic(shiftStart);

const confirmed = confirm(
      `هل أنت متأكد من تصفير الوردية وبدء شيفت جديدة؟\n\nالوردية الحالية بدأت في: ${formattedShift}\n\nسيتم تصفير جميع العدادات وإخفاء الطلبات من اللوحة الحالية.`
    );
    if (!confirmed) return;

// 1. Instantly zero-out all stat cards
    const elOrders = document.getElementById('statTotalOrders');
    const elRev = document.getElementById('statTotalRevenue');
    const elPending = document.getElementById('statPendingOrders');
    const elPrep = document.getElementById('statPreparingOrders');
    if (elOrders) elOrders.textContent = '0';
    if (elRev) elRev.textContent = '0 ج.م';
    if (elPending) elPending.textContent = '0';
    if (elPrep) elPrep.textContent = '0';

    // 2. Instantly empty the orders table
if (ordersList) {
      ordersList.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem 1rem; color: var(--color-text-muted);">
            <i class="fas fa-check-circle" style="font-size: 2.5rem; color: #10B981; margin-bottom: 0.75rem;"></i>
            <p style="font-size: 1.1rem; font-weight: 700; color: #FFFFFF;">تم تصفير الوردية وبدء شيفت جديدة بنجاح</p>
            <p style="font-size: 0.88rem; color: #A3C5CD;">في انتظار أول طلب جديد في هذه الوردية...</p>
          </td>
        </tr>
      `;
    }

// 3. Reset internal tracking & silence alerts
    isSwitchingPeriod = true;
    knownOrderIds.clear();
    alertedOrderIds.clear();

    try {
      const res = await window.HeshamFouadAPI.resetShift();
      if (res && res.shiftStart) {
        localStorage.setItem(SHIFT_STORAGE_KEY, res.shiftStart);
      }
    } catch (err) {
      console.warn('Server shift reset fallback:', err);
      localStorage.setItem(SHIFT_STORAGE_KEY, new Date().toISOString());
    }

    updateShiftDisplay();
    setPeriod('shift');
  }

  function updateShiftDisplay() {
    if (!shiftTimeDisplay) return;
    const shiftStart = getShiftStart();
    shiftTimeDisplay.textContent = formatDateTimeArabic(shiftStart);
  }

function formatDateTimeArabic(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12 || 12;

    return `${day}/${month} — ${hours}:${minutes} ${ampm}`;
  }

  /* ============================================================
     DATE & PERIOD FILTERING
     ============================================================ */
  function setPeriod(period) {
    currentPeriod = period;
    isSwitchingPeriod = true; // Silence sound alerts when switching to past periods

    document.querySelectorAll('.period-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.period === period);
    });

    if (customDtBox) {
      customDtBox.style.display = period === 'custom' ? 'block' : 'none';
    }

    updateActiveFilterBanner();
    loadOrders();
    loadStats();
  }

function updateActiveFilterBanner() {
    if (!activeFilterBanner) return;

    if (currentPeriod === 'shift') {
      activeFilterBanner.style.display = 'none';
      return;
    }

    activeFilterBanner.style.display = 'block';
    if (currentPeriod === 'today') {
      activeFilterBanner.textContent = 'عرض جموع طلبات اليوم كاملاً (من 12:00 منتصف الليل)';
    } else if (currentPeriod === 'yesterday') {
      activeFilterBanner.textContent = 'عرض طلبات الأمس بالتفصيل';
    } else if (currentPeriod === 'all') {
      activeFilterBanner.textContent = 'عرض السجل التاريخي الكامل لجميع الطلبات';
    } else if (currentPeriod === 'custom' && customStartDate && customEndDate) {
      activeFilterBanner.textContent = `فلترة مخصصة: من (${formatDateTimeArabic(customStartDate)}) إلى (${formatDateTimeArabic(customEndDate)})`;
    }
  }

  function getDateParams() {
    if (currentPeriod === 'shift') {
      const shiftStart = getShiftStart();
      return { period: 'shift', startDate: shiftStart.toISOString() };
    }

    if (currentPeriod === 'today') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      return { startDate: todayStart.toISOString() };
    }

    if (currentPeriod === 'yesterday') {
      const now = new Date();
      const yStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      const yEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      return { startDate: yStart.toISOString(), endDate: yEnd.toISOString() };
    }

    if (currentPeriod === 'all') {
      return { all: 'true' };
    }

    if (currentPeriod === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: customStartDate.toISOString(),
        endDate: customEndDate.toISOString()
      };
    }

    return {};
  }

  /* ============================================================
     LOAD ORDERS & STATS
     ============================================================ */
  async function loadOrders() {
    try {
      const params = {
        limit: 50,
        ...getDateParams()
      };
      if (currentFilter) {
        params.status = currentFilter;
      }

      const res = await window.HeshamFouadAPI.getOrders(params);
      if (!res.success) return;

      const orders = res.orders || [];

      // Check for new orders to trigger sound:
      // STRICT SOUND ALERT RULES:
      // 1. Must be active shift view (currentPeriod === 'shift')
      // 2. Must NOT be initial page load or switching periods
      // 3. Sound must be enabled
      // 4. Order must be 'pending' status
      // 5. Order must NOT have been alerted before
      // 6. Order must be recently created (within last 15 minutes)
      if (currentPeriod === 'shift' && !isFirstLoad && !isSwitchingPeriod && soundEnabled) {
        const nowMs = Date.now();
        const incomingOrders = orders.filter(o => {
          if (o.status !== 'pending') return false;
          if (alertedOrderIds.has(o._id)) return false;
          const createdMs = new Date(o.createdAt).getTime();
          return !isNaN(createdMs) && (nowMs - createdMs < 15 * 60 * 1000);
        });

        if (incomingOrders.length > 0) {
          incomingOrders.forEach(o => alertedOrderIds.add(o._id));
          playNotificationSound();
        }
      }

      // Mark all orders as known
      orders.forEach(o => {
        knownOrderIds.add(o._id);
        if (currentPeriod !== 'shift') {
          // If viewing historical orders, permanently mark them as alerted so returning to shift never alarms on them
          alertedOrderIds.add(o._id);
        }
      });

      isFirstLoad = false;
      isSwitchingPeriod = false;

      renderOrdersTable(orders);
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  }

  async function loadStats() {
    try {
      const params = getDateParams();
      const res = await window.HeshamFouadAPI.getStats(params);
      if (!res.success) return;

const { stats } = res;
      document.getElementById('statTotalOrders').textContent = stats.totalOrdersToday || 0;
      document.getElementById('statTotalRevenue').textContent = `${stats.totalRevenueToday || 0} ج.م`;
      document.getElementById('statPendingOrders').textContent = stats.pendingOrders || 0;
      document.getElementById('statPreparingOrders').textContent = stats.preparingOrders || 0;
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  /* ============================================================
     RENDER ORDERS TABLE
     ============================================================ */
  function renderOrdersTable(orders) {
    if (!ordersList) return;

if (orders.length === 0) {
      ordersList.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem 1rem; color: var(--color-text-muted);">
            <i class="fas fa-inbox" style="font-size: 2.5rem; color: var(--color-accent-gold); margin-bottom: 0.75rem; opacity: 0.6;"></i>
            <p>لا توجد طلبات في هذا النطاق الزمني المحدد.</p>
          </td>
        </tr>
      `;
      return;
    }

ordersList.innerHTML = orders.map(order => {
      const dateStr = formatDateTimeArabic(order.createdAt);
      const itemsSummary = (order.items || []).map(i => {
        let text = escapeHtml(i.name) + ' (x' + i.quantity + ')';
        if (i.selectedAddons && i.selectedAddons.length > 0) {
          text += ' [' + i.selectedAddons.map(a => escapeHtml(a.name)).join('+') + ']';
        }
        if (i.selectedSauces && i.selectedSauces.length > 0) {
          text += ' [صلصات: ' + i.selectedSauces.map(s => escapeHtml(s.name)).join('+') + ']';
        }
        if (i.notes) {
          text += ' (' + escapeHtml(i.notes) + ')';
        }
        return text;
      }).join('<br>');

      return `
        <tr>
          <td><span class="order-num-tag">#${escapeHtml(order.orderNumber)}</span></td>
          <td>
            <strong>${escapeHtml(order.customerName)}</strong><br>
            <span style="font-family: 'Outfit'; color: var(--color-accent-gold); font-size: 0.85rem;">${escapeHtml(order.customerPhone)}</span>
          </td>
          <td><small>${escapeHtml(order.deliveryAddress)}</small></td>
          <td style="font-size: 0.82rem; line-height: 1.5;">${itemsSummary}</td>
          <td>
            <strong style="font-family: 'Outfit'; color: var(--color-accent-gold); font-size: 1.1rem;">${order.totalAmount}</strong> ج.م
          </td>
          <td>
            <span class="status-badge status-${order.status}">${statusLabels[order.status] || escapeHtml(order.status)}</span>
          </td>
          <td>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              ${order.status === 'pending' ? `
                <button class="btn-print-ticket" style="background:#10B981;color:#fff;" onclick="window.HeshamFouadAdmin.updateStatus('${order._id}', 'preparing')">
                  <i class="fas fa-check"></i> قبول وتحضير
                </button>
              ` : ''}
              ${order.status === 'preparing' ? `
                <button class="btn-print-ticket" style="background:#3B82F6;color:#fff;" onclick="window.HeshamFouadAdmin.updateStatus('${order._id}', 'delivered')">
                  <i class="fas fa-motorcycle"></i> تم التوصيل
                </button>
              ` : ''}
              <button class="btn-print-ticket" onclick="window.HeshamFouadAdmin.printThermalTicket('${order._id}', 'kitchen')">
                <i class="fas fa-print"></i> المطبخ
              </button>
              <button class="btn-print-ticket" onclick="window.HeshamFouadAdmin.printThermalTicket('${order._id}', 'customer')">
                <i class="fas fa-receipt"></i> العميل
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function updateStatus(orderId, newStatus) {
    try {
      const res = await window.HeshamFouadAPI.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        loadOrders();
        loadStats();
      }
    } catch (err) {
      alert('Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ø§Ù„Ø·Ù„Ø¨: ' + err.message);
    }
  }

  /* ============================================================
     THERMAL TICKET PRINTING (Dual format: Kitchen & Customer)
     ============================================================ */
  async function printThermalTicket(orderId, ticketType) {
    try {
      const res = await window.HeshamFouadAPI.getOrderById(orderId);
      if (!res.success || !res.order) return;

      const order = res.order;
      let printContainer = document.getElementById('thermalPrintContainer');
      if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'thermalPrintContainer';
        document.body.appendChild(printContainer);
      }

const isKitchen = ticketType === 'kitchen';
      const ticketTitle = isKitchen ? 'بون تحضير للمطبخ' : 'فاتورة العميل — توصيل';

printContainer.innerHTML = `
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 6px;">
          <h2 style="margin: 0; font-size: 16px;">هشام فؤاد - ملك الكريب</h2>
          <p style="margin: 2px 0; font-size: 11px;">أسيوط - شارع المحافظة بجوار الفانوس أمام مستشفى طيبة</p>
          <p style="margin: 2px 0; font-size: 11px;">تليفون: 01554006656 / 01038945555</p>
          <h3 style="margin: 4px 0; font-size: 13px; text-decoration: underline;">${escapeHtml(ticketTitle)}</h3>
        </div>

        <div style="font-size: 11px; margin-bottom: 6px;">
          <div><strong>رقم الأوردر:</strong> #${escapeHtml(order.orderNumber)}</div>
          <div><strong>التاريخ:</strong> ${formatDateTimeArabic(order.createdAt)}</div>
          <div><strong>العميل:</strong> ${escapeHtml(order.customerName)}</div>
          <div><strong>الموبايل:</strong> ${escapeHtml(order.customerPhone)}</div>
          <div><strong>العنوان:</strong> ${escapeHtml(order.deliveryAddress)}</div>
          ${order.notes ? `<div><strong>ملاحظات:</strong> ${escapeHtml(order.notes)}</div>` : ''}
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 6px; border-top: 1px dashed #000; border-bottom: 1px dashed #000;">
          <thead>
            <tr style="text-align: right;">
              <th style="padding: 3px 0;">الصنف</th>
              <th style="padding: 3px 0; text-align: center;">الكمية</th>
              ${!isKitchen ? '<th style="padding: 3px 0; text-align: left;">السعر</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${(order.items || []).map(item => `
              <tr>
                <td style="padding: 2px 0;">
                  <strong>${escapeHtml(item.name)}</strong>
                  ${item.selectedAddons && item.selectedAddons.length > 0 ? `<br><small>+ إضافات: ${item.selectedAddons.map(a => escapeHtml(a.name)).join('، ')}</small>` : ''}
                  ${item.selectedSauces && item.selectedSauces.length > 0 ? `<br><small>+ صلصات: ${item.selectedSauces.map(s => escapeHtml(s.name)).join('، ')}</small>` : ''}
                  ${item.notes ? `<br><small>* طلب: ${escapeHtml(item.notes)}</small>` : ''}
                </td>
                <td style="padding: 2px 0; text-align: center; vertical-align: top;">${item.quantity}</td>
                ${!isKitchen ? `<td style="padding: 2px 0; text-align: left; vertical-align: top;">${item.totalPrice} ج</td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${!isKitchen ? `
          <div style="font-size: 11px; margin-bottom: 6px;">
            <div style="display: flex; justify-content: space-between;">
              <span>مجموع الأصناف:</span>
              <span>${order.subtotal || (order.totalAmount - (order.deliveryFee || 15))} ج.م</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>التوصيل (أسيوط):</span>
              <span>${order.deliveryFee || 15} ج.م</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; border-top: 1px dashed #000; padding-top: 3px; margin-top: 3px;">
              <span>المجموع الكلي:</span>
              <span>${order.totalAmount} ج.م</span>
            </div>
          </div>
        ` : ''}

        <div style="text-align: center; border-top: 1px dashed #000; padding-top: 5px; font-size: 10px;">
          <p style="margin: 0;">شكراً لطلبك من هشام فؤاد ملك الكريب</p>
        </div>
      `;

      window.print();
} catch (err) {
      alert('خطأ في تحضير البون للطباعة: ' + err.message);
    }
  }

  /* ============================================================
     PASSWORD CHANGE MODAL
     ============================================================ */
  function openPasswordModal() {
    if (!pwModal) return;
    pwModal.style.display = 'flex';
    if (pwError) pwError.textContent = '';
    if (pwSuccess) pwSuccess.textContent = '';
    if (currentPwInput) currentPwInput.value = '';
    if (newPwInput) newPwInput.value = '';
    if (confirmPwInput) confirmPwInput.value = '';
  }

  function closePasswordModal() {
    if (!pwModal) return;
    pwModal.style.display = 'none';
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (!pwError || !pwSuccess) return;

    pwError.textContent = '';
    pwSuccess.textContent = '';

    const currentPassword = currentPwInput.value.trim();
    const newPassword = newPwInput.value.trim();
    const confirmPassword = confirmPwInput.value.trim();

    if (!currentPassword || !newPassword) {
      pwError.textContent = 'يرجى إدخال كلمة المرور الحالية والجديدة';
      return;
    }

    if (newPassword.length < 6) {
      pwError.textContent = 'كلمة المرور الجديدة يجب أن تكون 6 خانات على الأقل';
      return;
    }

    if (newPassword !== confirmPassword) {
      pwError.textContent = 'تأكيد كلمة المرور غير متطابق';
      return;
    }

    try {
      const res = await window.HeshamFouadAPI.changePassword(currentPassword, newPassword);
      if (res.success) {
        pwSuccess.textContent = 'تم تغيير كلمة المرور بنجاح';
        setTimeout(() => {
          closePasswordModal();
        }, 1500);
      }
    } catch (err) {
      pwError.textContent = err.message || 'فشل تغيير كلمة المرور';
    }
  }

  /* ============================================================
     EVENT LISTENERS & INIT
     ============================================================ */
  function init() {
    // Check if logged in as admin
    if (window.HeshamFouadAPI.isLoggedIn() && window.HeshamFouadAPI.isAdmin()) {
      showDashboard();
    } else {
      showLogin();
    }

    // Login Form
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';

        const user = document.getElementById('adminUser').value.trim();
        const pass = document.getElementById('adminPass').value.trim();

        try {
          const res = await window.HeshamFouadAPI.login(user, pass);
          if (res.success) {
            showDashboard();
          }
} catch (err) {
          loginError.textContent = err.message || 'بيانات الدخول غير صحيحة';
        }
      });
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        window.HeshamFouadAPI.logout();
      });
    }

    // Sound toggle
    if (soundBtn) {
      soundBtn.addEventListener('click', toggleSound);
    }

    // Reset Shift
    if (btnResetShift) {
      btnResetShift.addEventListener('click', resetShift);
    }

    // Period Tabs
    document.querySelectorAll('.period-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        setPeriod(tab.dataset.period);
      });
    });

    // Custom Date Range
    if (btnApplyCustomDt) {
      btnApplyCustomDt.addEventListener('click', () => {
        if (!dtStart.value || !dtEnd.value) {
          alert('من فضلك حدد تاريخ ووقت البداية وتاريخ ووقت النهاية');
          return;
        }
        customStartDate = new Date(dtStart.value);
        customEndDate = new Date(dtEnd.value);
        if (customEndDate < customStartDate) {
          alert('تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية');
          return;
        }
        updateActiveFilterBanner();
        loadOrders();
        loadStats();
      });
    }

    if (btnClearCustomDt) {
      btnClearCustomDt.addEventListener('click', () => {
        setPeriod('shift');
      });
    }

    // Password Modal Handlers
    if (btnAdminPw) {
      btnAdminPw.addEventListener('click', openPasswordModal);
    }
    if (pwModalClose) {
      pwModalClose.addEventListener('click', closePasswordModal);
    }
    if (pwForm) {
      pwForm.addEventListener('submit', handlePasswordSubmit);
    }
  }

  function showLogin() {
    if (loginScreen) loginScreen.style.display = 'flex';
    if (dashboard) dashboard.style.display = 'none';
    if (refreshInterval) clearInterval(refreshInterval);
  }

  async function showDashboard() {
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';

    try {
      const shiftData = await window.HeshamFouadAPI.getShift();
      if (shiftData && shiftData.shiftStart) {
        localStorage.setItem(SHIFT_STORAGE_KEY, shiftData.shiftStart);
      }
    } catch (e) {
      console.warn('Could not sync shift from server:', e);
    }

    updateShiftDisplay();
    loadOrders();
    loadStats();

    // Auto-refresh orders every 6 seconds
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
      loadOrders();
      loadStats();
    }, 6000);
  }

  document.addEventListener('DOMContentLoaded', init);

  window.HeshamFouadAdmin = {
    updateStatus,
    printThermalTicket,
    resetShift
  };
})();



