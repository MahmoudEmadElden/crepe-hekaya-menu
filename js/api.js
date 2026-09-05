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

  async function apiRegister(username, password, displayName, phone) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName, phone })
    });
    if (data.success) {
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

  async function apiCreateOrder(items, notes) {
    return await apiFetch('/orders/create', {
      method: 'POST',
      body: JSON.stringify({ items, notes })
    });
  }

  async function apiGetOrders(page, limit, status) {
    let query = `?page=${page || 1}&limit=${limit || 20}`;
    if (status) query += `&status=${status}`;
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

  async function apiGetStats() {
    return await apiFetch('/orders/stats', { method: 'GET' });
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
     EXPORT TO WINDOW
     =========================== */

  window.CrepeAPI = {
    // Auth
    getToken, setToken, removeToken,
    getUser, setUser,
    isLoggedIn, isAdmin, logout,
    apiRegister, apiLogin, apiGetMe,

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
