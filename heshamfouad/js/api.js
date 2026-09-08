/**
 * Shared API Helper — Hesham Fouad King of Crepe
 * Centralized fetch wrapper with JWT authentication.
 */
(function () {
  'use strict';

  const API_BASE = '/api';
  const TOKEN_KEY = 'heshamFouadToken';
  const USER_KEY = 'heshamFouadUser';

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
    return user && (user.role === 'admin' || user.role === 'cashier');
  }

  function logout() {
    removeToken();
    window.location.href = 'index.html';
  }

  async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      const res = await fetch(url, config);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
          removeToken();
          const isAdminPage = window.location.pathname.includes('admin.html');
          if (isAdminPage) {
            window.location.href = 'admin.html';
          } else if (window.location.pathname.includes('orders.html')) {
            window.location.href = 'auth.html?returnTo=orders.html';
          }
        }
        throw new Error(data.message || 'حدث خطأ في الاتصال بالسيرفر');
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  }

  // Auth Methods
  async function login(username, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (data.success && data.token) {
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }

  async function register(userData) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (data.success && data.token) {
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  }

  async function changePassword(currentPassword, newPassword) {
    return await request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  async function getMe() {
    const data = await request('/auth/me');
    if (data.success && data.user) {
      setUser(data.user);
    }
    return data;
  }

  // Orders Methods
  async function createOrder(orderData) {
    return await request('/orders/create', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async function getOrders(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.status) query.set('status', params.status);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.all) query.set('all', params.all);

    const qs = query.toString();
    return await request(`/orders${qs ? '?' + qs : ''}`);
  }

  async function getOrderById(id) {
    return await request(`/orders/${id}`);
  }

  async function updateOrderStatus(id, status) {
    return await request(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async function getStats(params = {}) {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.all) query.set('all', params.all);

    const qs = query.toString();
    return await request(`/orders/stats${qs ? '?' + qs : ''}`);
  }

  /* ===========================
     CHANGE PASSWORD MODAL
     =========================== */
  function openChangePasswordModal() {
    let modal = document.getElementById('hfChangePwModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'hfChangePwModal';
      modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(2, 13, 15, 0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 1rem;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
      `;
      modal.innerHTML = `
        <div style="background:#061B20; border:1px solid rgba(24, 181, 209, 0.3); border-radius:20px; width:100%; max-width:420px; padding:2rem; position:relative; box-shadow:0 20px 50px rgba(0,0,0,0.7);">
          <button type="button" class="hf-close-modal" style="position:absolute; top:1.2rem; left:1.2rem; background:none; border:none; color:#8AA8B0; font-size:1.4rem; cursor:pointer;" aria-label="إغلاق">&times;</button>
          
          <div style="text-align:center; margin-bottom:1.5rem;">
            <div style="width:52px; height:52px; margin:0 auto 0.75rem; border-radius:50%; background:#031215; border:1px solid rgba(245, 166, 35, 0.35); display:flex; align-items:center; justify-content:center; color:#F5A623; font-size:1.35rem;">
              <i class="fas fa-key"></i>
            </div>
            <h3 style="font-size:1.25rem; font-weight:800; color:#fff; margin-bottom:0.25rem;">تغيير كلمة المرور</h3>
            <p style="font-size:0.85rem; color:#8AA8B0;">أدخل كلمة المرور الحالية وكلمة المرور الجديدة</p>
          </div>

          <form id="hfChangePwForm" style="display:flex; flex-direction:column; gap:1rem;">
            <div>
              <label style="display:block; font-size:0.85rem; font-weight:700; color:#F5EFEB; margin-bottom:0.35rem;">كلمة المرور الحالية</label>
              <input type="password" id="hfCurrentPw" required style="width:100%; padding:0.75rem 1rem; background:#031215; border:1px solid rgba(24, 181, 209, 0.25); border-radius:10px; color:#fff; outline:none;" placeholder="كلمة المرور الحالية">
            </div>

            <div>
              <label style="display:block; font-size:0.85rem; font-weight:700; color:#F5EFEB; margin-bottom:0.35rem;">كلمة المرور الجديدة</label>
              <input type="password" id="hfNewPw" required minlength="6" style="width:100%; padding:0.75rem 1rem; background:#031215; border:1px solid rgba(24, 181, 209, 0.25); border-radius:10px; color:#fff; outline:none;" placeholder="6 خانات على الأقل">
            </div>

            <div>
              <label style="display:block; font-size:0.85rem; font-weight:700; color:#F5EFEB; margin-bottom:0.35rem;">تأكيد كلمة المرور الجديدة</label>
              <input type="password" id="hfConfirmPw" required minlength="6" style="width:100%; padding:0.75rem 1rem; background:#031215; border:1px solid rgba(24, 181, 209, 0.25); border-radius:10px; color:#fff; outline:none;" placeholder="أعد كتابة كلمة المرور">
            </div>

            <div id="hfPwError" style="color:#EF4444; font-size:0.85rem; font-weight:700; text-align:center; display:none;"></div>

            <button type="submit" id="hfPwSubmitBtn" style="margin-top:0.5rem; width:100%; padding:0.85rem; background:linear-gradient(135deg, #F5A623, #D9880A); color:#031215; border:none; border-radius:9999px; font-weight:800; font-size:1rem; cursor:pointer;">
              تحديث كلمة المرور
            </button>
          </form>
        </div>
      `;
      document.body.appendChild(modal);

      const closeModal = () => {
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none';
      };

      modal.querySelector('.hf-close-modal').addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      const form = modal.querySelector('#hfChangePwForm');
      const errEl = modal.querySelector('#hfPwError');
      const submitBtn = modal.querySelector('#hfPwSubmitBtn');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errEl.style.display = 'none';
        errEl.textContent = '';

        const currentPw = modal.querySelector('#hfCurrentPw').value;
        const newPw = modal.querySelector('#hfNewPw').value;
        const confirmPw = modal.querySelector('#hfConfirmPw').value;

        if (newPw !== confirmPw) {
          errEl.textContent = 'كلمتا المرور غير متطابقتين';
          errEl.style.display = 'block';
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري التحديث...';

        try {
          const res = await changePassword(currentPw, newPw);
          alert(res.message || 'تم تحديث كلمة المرور بنجاح');
          form.reset();
          closeModal();
        } catch (err) {
          errEl.textContent = err.message || 'فشل تحديث كلمة المرور';
          errEl.style.display = 'block';
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'تحديث كلمة المرور';
        }
      });
    }

    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
  }

  window.HeshamFouadAPI = {
    getToken,
    setToken,
    removeToken,
    getUser,
    setUser,
    isLoggedIn,
    isAdmin,
    logout,
    login,
    register,
    changePassword,
    openChangePasswordModal,
    getMe,
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    getStats
  };
})();
