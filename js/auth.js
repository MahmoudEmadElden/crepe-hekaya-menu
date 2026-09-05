/**
 * Auth Page Logic — Crepe Hekaya
 * Handles login/register tab switching, form submissions, and password visibility toggles.
 */

// Global password visibility toggle
window.togglePasswordVisibility = function (inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  const openIcon = btn.querySelector('.eye-open');
  const closedIcon = btn.querySelector('.eye-closed');
  if (openIcon && closedIcon) {
    openIcon.style.display = isPassword ? 'none' : 'block';
    closedIcon.style.display = isPassword ? 'block' : 'none';
  }
};

(function () {
  'use strict';

  // If already logged in, redirect to menu
  if (CrepeAPI.isLoggedIn()) {
    window.location.href = '/';
    return;
  }

  // DOM Elements
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginError = document.getElementById('loginError');
  const registerError = document.getElementById('registerError');

  /* ---- Tab Switching ---- */
  function switchTab(tab) {
    if (tab === 'login') {
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
      loginForm.style.display = 'flex';
      registerForm.style.display = 'none';
      loginError.textContent = '';
    } else {
      registerTab.classList.add('active');
      loginTab.classList.remove('active');
      registerForm.style.display = 'flex';
      loginForm.style.display = 'none';
      registerError.textContent = '';
    }
  }

  loginTab.addEventListener('click', () => switchTab('login'));
  registerTab.addEventListener('click', () => switchTab('register'));

  // Check URL hash for tab
  if (window.location.hash === '#register') {
    switchTab('register');
  }

  /* ---- Login ---- */
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
      loginError.textContent = 'ادخل اسم المستخدم وكلمة المرور';
      return;
    }

    const btn = document.getElementById('loginSubmitBtn');
    setLoading(btn, true);

    try {
      await CrepeAPI.apiLogin(username, password);
      // Redirect: admin goes to dashboard, customer goes to returnTo or menu
      const user = CrepeAPI.getUser();
      if (user && user.role === 'admin') {
        window.location.href = '/admin.html';
      } else {
        const returnTo = new URLSearchParams(window.location.search).get('returnTo');
        window.location.href = returnTo || '/';
      }
    } catch (error) {
      loginError.textContent = error.message || 'حصل مشكلة. جرب تاني.';
      setLoading(btn, false);
    }
  });

  /* ---- Register ---- */
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerError.textContent = '';

    const displayName = document.getElementById('regDisplayName').value.trim();
    const address = document.getElementById('regAddress').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    // Strict Validations matching reference system
    if (!displayName) {
      registerError.textContent = 'الاسم بالكامل مطلوب';
      document.getElementById('regDisplayName').focus();
      return;
    }

    if (!address || address.length < 5) {
      registerError.textContent = 'العنوان بالتفصيل مطلوب (المنطقة، الشارع، رقم العمارة/الشقة)';
      document.getElementById('regAddress').focus();
      return;
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!cleanPhone || !/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      registerError.textContent = 'يرجى إدخال رقم هاتف صحيح مكون من 11 رقم يبدأ بـ 01';
      document.getElementById('regPhone').focus();
      return;
    }

    if (!username || username.length < 3) {
      registerError.textContent = 'اسم المستخدم لازم يكون 3 حروف على الأقل';
      document.getElementById('regUsername').focus();
      return;
    }

    if (!password || password.length < 6) {
      registerError.textContent = 'كلمة المرور لازم تكون 6 خانات على الأقل';
      document.getElementById('regPassword').focus();
      return;
    }

    if (password !== confirmPassword) {
      registerError.textContent = 'كلمتا المرور غير متطابقتين، يرجى التأكد وإعادة الكتابة';
      document.getElementById('regConfirmPassword').focus();
      return;
    }

    const btn = document.getElementById('registerSubmitBtn');
    setLoading(btn, true);

    try {
      await CrepeAPI.apiRegister(username, password, displayName, address, cleanPhone);
      const returnTo = new URLSearchParams(window.location.search).get('returnTo');
      window.location.href = returnTo || '/';
    } catch (error) {
      registerError.textContent = error.message || 'حصل مشكلة. جرب تاني.';
      setLoading(btn, false);
    }
  });

  /* ---- Loading State ---- */
  function setLoading(btn, isLoading) {
    btn.disabled = isLoading;
    const textSpan = btn.querySelector('.btn-text');
    const loadingSpan = btn.querySelector('.btn-loading');
    if (textSpan) textSpan.style.display = isLoading ? 'none' : 'inline';
    if (loadingSpan) loadingSpan.style.display = isLoading ? 'inline' : 'none';
  }

})();
