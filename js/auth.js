/**
 * Auth Page Logic — Crepe Hekaya
 * Handles login/register tab switching and form submissions.
 */
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
      // Redirect: admin goes to dashboard, customer goes to menu
      const user = CrepeAPI.getUser();
      if (user && user.role === 'admin') {
        window.location.href = '/admin.html';
      } else {
        // Go back to previous page or menu
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

    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const displayName = document.getElementById('regDisplayName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();

    if (!username || !password) {
      registerError.textContent = 'اسم المستخدم وكلمة المرور مطلوبين';
      return;
    }

    if (username.length < 3) {
      registerError.textContent = 'اسم المستخدم لازم يكون 3 حروف على الأقل';
      return;
    }

    if (password.length < 6) {
      registerError.textContent = 'كلمة المرور لازم تكون 6 حروف على الأقل';
      return;
    }

    const btn = document.getElementById('registerSubmitBtn');
    setLoading(btn, true);

    try {
      await CrepeAPI.apiRegister(username, password, displayName, phone);
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
    btn.querySelector('.btn-text').style.display = isLoading ? 'none' : 'inline';
    btn.querySelector('.btn-loading').style.display = isLoading ? 'inline' : 'none';
  }

})();
