/**
 * Shared API Helper — Crepe Hekaya
 * Centralized fetch wrapper with JWT authentication.
 */
(function () {
  'use strict';

  const API_BASE = '/api';
  const TOKEN_KEY = 'crepeHekayaToken';
  const USER_KEY = 'crepeHekayaUser';
  const CART_KEY = 'crepeHekayaCart';

  /* ===========================
     AUTH HELPERS
     =========================== */

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function isAdmin() {
    const user = getUser();
    return user && user.role === 'admin';
  }

  function logout() {
    removeToken();
    window.location.href = '/';
  }

  /* ===========================
     CART HELPERS
     =========================== */

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  function addToCart(item) {
    const cart = getCart();
    // Check if same item with same variant already exists
    const existingIdx = cart.findIndex(
      c => c.itemId === item.itemId && c.variant === item.variant
    );

    if (existingIdx >= 0) {
      cart[existingIdx].quantity += 1;
    } else {
      cart.push({
        itemId: item.itemId,
        name: item.name,
        variant: item.variant || '',
        variantLabel: item.variantLabel || '',
        quantity: 1,
        unitPrice: item.unitPrice
      });
    }

    saveCart(cart);
    return cart;
  }

  function updateCartItemQty(itemId, variant, newQty) {
    const cart = getCart();
    const idx = cart.findIndex(c => c.itemId === itemId && c.variant === variant);
    if (idx >= 0) {
      if (newQty <= 0) {
        cart.splice(idx, 1);
      } else {
        cart[idx].quantity = Math.min(newQty, 50);
      }
    }
    saveCart(cart);
    return cart;
  }

  function removeFromCart(itemId, variant) {
    const cart = getCart().filter(
      c => !(c.itemId === itemId && c.variant === variant)
    );
    saveCart(cart);
    return cart;
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
  }

  function getCartTotal() {
    return getCart().reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }

  function getCartCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
  }

  function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
      const count = getCartCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  /* ===========================
     FETCH WRAPPER
     =========================== */

  async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        // If 401, token expired — clear auth
        if (response.status === 401) {
          removeToken();
        }
        throw { status: response.status, message: data.message || 'حصل مشكلة', data };
      }

      return data;
    } catch (error) {
      if (error.status) throw error; // Re-throw API errors
      throw { status: 0, message: 'مفيش اتصال بالسيرفر. تأكد من الإنترنت وجرب تاني.' };
    }
  }

  /* ===========================
     API METHODS
     =========================== */

  async function apiRegister(username, password, displayName, address, phone) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName, address, phone })
    });
    if (data.token) {
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }

  async function apiLogin(username, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (data.success) {
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }

  async function apiGetMe() {
    return await apiFetch('/auth/me', { method: 'GET' });
  }

  async function apiCreateOrder(items, notes, deliveryAddress, customerPhone, customerName, mapLocation) {
    return await apiFetch('/orders/create', {
      method: 'POST',
      body: JSON.stringify({ items, notes, deliveryAddress, customerPhone, customerName, mapLocation })
    });
  }

  async function apiChangePassword(currentPassword, newPassword) {
    return await apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  async function apiGetOrders(page, limit, status, startDate, endDate) {
    let query = `?page=${page || 1}&limit=${limit || 50}`;
    if (status) query += `&status=${status}`;
    if (startDate) query += `&startDate=${encodeURIComponent(startDate)}`;
    if (endDate) query += `&endDate=${encodeURIComponent(endDate)}`;
    return await apiFetch(`/orders${query}`, { method: 'GET' });
  }

  async function apiGetOrder(orderId) {
    return await apiFetch(`/orders/${orderId}`, { method: 'GET' });
  }

  async function apiUpdateOrderStatus(orderId, status) {
    return await apiFetch(`/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async function apiGetStats(startDate, endDate) {
    let query = '';
    const params = [];
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
    if (params.length > 0) query = '?' + params.join('&');
    return await apiFetch(`/orders/stats${query}`, { method: 'GET' });
  }

  /* ===========================
     TOAST NOTIFICATION
     =========================== */

  function showToast(message, type = 'success', duration = 2500) {
    // Remove existing toasts
    const existing = document.querySelector('.ch-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `ch-toast ch-toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('ch-toast--visible');
    });

    setTimeout(() => {
      toast.classList.remove('ch-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /* ===========================
     CHANGE PASSWORD MODAL
     =========================== */

  function openChangePasswordModal() {
    let modal = document.getElementById('chChangePwModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'chChangePwModal';
      modal.className = 'ch-pw-modal-overlay';
      modal.innerHTML = `
        <div class="ch-pw-modal-card">
          <button type="button" class="ch-pw-close" aria-label="إغلاق">&times;</button>
          <div class="ch-pw-header">
            <div class="ch-pw-icon"><i class="fa-solid fa-key" style="color:var(--color-primary);font-size:1.6rem;"></i></div>
            <h3 class="ch-pw-title">تغيير كلمة المرور</h3>
            <p class="ch-pw-sub">أدخل كلمة المرور الحالية وكلمة المرور الجديدة</p>
          </div>
          <form class="ch-pw-form" id="chChangePwForm">
            <div class="ch-pw-group">
              <label for="chCurrentPw">كلمة المرور الحالية</label>
              <input type="password" id="chCurrentPw" required placeholder="كلمة المرور الحالية">
            </div>
            <div class="ch-pw-group">
              <label for="chNewPw">كلمة المرور الجديدة</label>
              <input type="password" id="chNewPw" required minlength="6" placeholder="6 أحرف على الأقل">
            </div>
            <div class="ch-pw-group">
              <label for="chConfirmPw">تأكيد كلمة المرور الجديدة</label>
              <input type="password" id="chConfirmPw" required minlength="6" placeholder="أعد كتابة كلمة المرور الجديدة">
            </div>
            <div class="ch-pw-error" id="chPwError"></div>
            <button type="submit" class="ch-pw-submit" id="chPwSubmitBtn">تحديث كلمة المرور</button>
          </form>
        </div>
      `;
      document.body.appendChild(modal);

      // Close handlers
      const closeModal = () => modal.classList.remove('active');
      modal.querySelector('.ch-pw-close').addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      // Submit handler
      const form = modal.querySelector('#chChangePwForm');
      const errEl = modal.querySelector('#chPwError');
      const submitBtn = modal.querySelector('#chPwSubmitBtn');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errEl.textContent = '';
        const currentPw = modal.querySelector('#chCurrentPw').value;
        const newPw = modal.querySelector('#chNewPw').value;
        const confirmPw = modal.querySelector('#chConfirmPw').value;

        if (newPw !== confirmPw) {
          errEl.textContent = 'كلمة المرور الجديدة غير متطابقة';
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'جارٍ التحديث...';

        try {
          const res = await apiChangePassword(currentPw, newPw);
          showToast(res.message || 'تم تغيير كلمة المرور بنجاح', 'success');
          form.reset();
          closeModal();
        } catch (err) {
          errEl.textContent = err.message || 'حدث خطأ أثناء تغيير كلمة المرور';
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'تحديث كلمة المرور';
        }
      });
    }

    // Reset and open
    const form = modal.querySelector('#chChangePwForm');
    if (form) form.reset();
    const errEl = modal.querySelector('#chPwError');
    if (errEl) errEl.textContent = '';
    modal.classList.add('active');
  }

  /* ===========================
     EXPORT TO WINDOW
     =========================== */

  window.CrepeAPI = {
    // Auth
    getToken, setToken, removeToken,
    getUser, setUser,
    isLoggedIn, isAdmin, logout,
    apiRegister, apiLogin, apiGetMe, apiChangePassword,
    openChangePasswordModal,

    // Cart
    getCart, saveCart, addToCart,
    updateCartItemQty, removeFromCart, clearCart,
    getCartTotal, getCartCount, updateCartBadge,

    // Orders
    apiCreateOrder, apiGetOrders, apiGetOrder,
    apiUpdateOrderStatus, apiGetStats,

    // UI
    showToast
  };

  // Initialize cart badge on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCartBadge);
  } else {
    updateCartBadge();
  }
})();