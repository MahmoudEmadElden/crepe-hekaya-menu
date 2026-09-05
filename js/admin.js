/**
 * Admin Dashboard Logic — Crepe Hekaya
 * Handles admin login, stats display, orders management, and status updates.
 */
(function () {
  'use strict';

  const loginScreen = document.getElementById('adminLoginScreen');
  const dashboard = document.getElementById('adminDashboard');
  const loginForm = document.getElementById('adminLoginForm');
  const loginError = document.getElementById('adminLoginError');
  const logoutBtn = document.getElementById('adminLogoutBtn');
  const ordersList = document.getElementById('adminOrdersList');

  let currentFilter = '';
  let refreshInterval = null;

  const statusLabels = {
    pending: 'في الانتظار',
    accepted: 'تم القبول',
    preparing: 'جارٍ التحضير',
    ready: 'جاهز',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي'
  };

  const statusColors = {
    pending: '#F59E0B',
    accepted: '#3B82F6',
    preparing: '#8B5CF6',
    ready: '#10B981',
    delivered: '#6B7280',
    cancelled: '#EF4444'
  };

  /* ---- Init ---- */
  function init() {
    // Check if already logged in as admin
    if (CrepeAPI.isLoggedIn() && CrepeAPI.isAdmin()) {
      showDashboard();
    } else {
      // Clear any non-admin token
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
    loadStats();
    loadOrders();
    // Auto-refresh every 30 seconds
    refreshInterval = setInterval(() => {
      loadStats();
      loadOrders();
    }, 30000);
  }

  /* ---- Login ---- */
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';

    const username = document.getElementById('adminUser').value.trim();
    const password = document.getElementById('adminPass').value;

    try {
      const data = await CrepeAPI.apiLogin(username, password);
      if (data.user.role !== 'admin') {
        CrepeAPI.removeToken();
        loginError.textContent = 'هذا الحساب ليس حساب أدمن';
        return;
      }
      showDashboard();
    } catch (error) {
      loginError.textContent = error.message || 'بيانات الدخول غلط';
    }
  });

  /* ---- Logout ---- */
  logoutBtn.addEventListener('click', () => {
    CrepeAPI.logout();
  });

  /* ---- Load Stats ---- */
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

  /* ---- Load Orders ---- */
  async function loadOrders() {
    try {
      const data = await CrepeAPI.apiGetOrders(1, 50, currentFilter || undefined);
      if (!data.success || data.orders.length === 0) {
        ordersList.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:2rem;">مفيش طلبات</p>';
        return;
      }

      ordersList.innerHTML = data.orders.map(order => {
        const date = new Date(order.createdAt);
        const timeStr = date.toLocaleString('ar-EG', {
          month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });

        const itemsHtml = order.items.map(item =>
          `<div class="order-item-row">
            <span>${item.name} ${item.variantLabel ? '(' + item.variantLabel + ')' : ''} × ${item.quantity}</span>
            <span>${item.totalPrice} ج</span>
          </div>`
        ).join('');

        // Status action buttons based on current status
        let actionsHtml = '';
        const s = order.status;
        if (s !== 'delivered' && s !== 'cancelled') {
          const actions = [];
          if (s === 'pending') actions.push({ status: 'accepted', label: 'قبول', cls: 'accept' });
          if (s === 'accepted') actions.push({ status: 'preparing', label: 'بدأ التحضير', cls: 'prepare' });
          if (s === 'preparing') actions.push({ status: 'ready', label: 'جاهز', cls: 'ready' });
          if (s === 'ready') actions.push({ status: 'delivered', label: 'تم التوصيل', cls: 'deliver' });
          actions.push({ status: 'cancelled', label: 'إلغاء', cls: 'cancel' });

          actionsHtml = `<div class="order-status-actions">
            ${actions.map(a => `<button class="status-action-btn status-action-btn--${a.cls}" data-order-id="${order._id}" data-new-status="${a.status}">${a.label}</button>`).join('')}
          </div>`;
        }

        return `
          <div class="admin-order-card">
            <div class="order-card-header">
              <div>
                <span class="order-num">#${order.orderNumber}</span>
                <span class="order-customer"> — ${order.customerName || 'عميل'}</span>
              </div>
              <span class="order-status-badge" style="background:${statusColors[order.status] || '#6B7280'};">${statusLabels[order.status] || order.status}</span>
            </div>
            <div class="order-items-list">${itemsHtml}</div>
            ${order.notes ? `<div class="order-notes">ملاحظات: ${order.notes}</div>` : ''}
            <div class="order-card-footer">
              <span class="order-total">${order.totalAmount} جنيه</span>
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
      ordersList.innerHTML = `<p style="text-align:center;color:#FF4D4D;padding:2rem;">${error.message || 'حصل مشكلة'}</p>`;
    }
  }

  /* ---- Status Update ---- */
  ordersList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.status-action-btn');
    if (!btn) return;

    const orderId = btn.dataset.orderId;
    const newStatus = btn.dataset.newStatus;

    if (newStatus === 'cancelled' && !confirm('متأكد إنك عايز تلغي الطلب ده؟')) {
      return;
    }

    btn.disabled = true;
    btn.textContent = '...';

    try {
      await CrepeAPI.apiUpdateOrderStatus(orderId, newStatus);
      loadStats();
      loadOrders();
    } catch (error) {
      alert(error.message || 'حصل مشكلة في تحديث حالة الطلب');
      btn.disabled = false;
    }
  });

  /* ---- Filter ---- */
  document.querySelector('.admin-filter-bar').addEventListener('click', (e) => {
    const btn = e.target.closest('.admin-filter-btn');
    if (!btn) return;

    document.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    loadOrders();
  });

  /* ---- Start ---- */
  init();
})();
