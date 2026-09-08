/**
 * Auth Page Client Logic — Hesham Fouad King of Crepe
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

  // If already logged in, redirect
  if (window.HeshamFouadAPI && window.HeshamFouadAPI.isLoggedIn()) {
    const returnTo = new URLSearchParams(window.location.search).get('returnTo');
    window.location.href = returnTo || 'index.html';
    return;
  }

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
      hideError(loginError);
    } else {
      registerTab.classList.add('active');
      loginTab.classList.remove('active');
      registerForm.style.display = 'flex';
      loginForm.style.display = 'none';
      hideError(registerError);
    }
  }

  if (loginTab && registerTab) {
    loginTab.addEventListener('click', () => switchTab('login'));
    registerTab.addEventListener('click', () => switchTab('register'));
  }

  // Check URL hash
  if (window.location.hash === '#register') {
    switchTab('register');
  }

  function showError(el, message) {
    if (!el) return;
    el.textContent = message;
    el.classList.add('visible');
    el.style.display = 'block';
  }

  function hideError(el) {
    if (!el) return;
    el.textContent = '';
    el.classList.remove('visible');
    el.style.display = 'none';
  }

  function setLoading(btn, isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
    const textSpan = btn.querySelector('.btn-text');
    const loadingSpan = btn.querySelector('.btn-loading');
    if (textSpan) textSpan.style.display = isLoading ? 'none' : 'inline-flex';
    if (loadingSpan) loadingSpan.style.display = isLoading ? 'inline-flex' : 'none';
  }

  function redirectAfterAuth() {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');
    if (returnTo) {
      window.location.href = returnTo;
    } else {
      window.location.href = 'menu.html';
    }
  }

  /* ---- Login Submission ---- */
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError(loginError);

      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!username || !password) {
        showError(loginError, 'يرجى إدخال اسم المستخدم وكلمة المرور');
        return;
      }

      const btn = document.getElementById('loginSubmitBtn');
      setLoading(btn, true);

      try {
        const data = await window.HeshamFouadAPI.login(username, password);
        if (data.success) {
          const user = window.HeshamFouadAPI.getUser();
          if (user && (user.role === 'admin' || user.role === 'cashier')) {
            window.location.href = 'admin.html';
          } else {
            redirectAfterAuth();
          }
        } else {
          showError(loginError, data.message || 'فشل تسجيل الدخول');
          setLoading(btn, false);
        }
      } catch (err) {
        showError(loginError, err.message || 'حدث خطأ أثناء تسجيل الدخول');
        setLoading(btn, false);
      }
    });
  }

  /* ---- Register Submission ---- */
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError(registerError);

      const displayName = document.getElementById('regDisplayName').value.trim();
      const phone = document.getElementById('regPhone').value.trim();
      const address = document.getElementById('regAddress').value.trim();
      const username = document.getElementById('regUsername').value.trim();
      const password = document.getElementById('regPassword').value;
      const confirmPassword = document.getElementById('regConfirmPassword').value;

      if (!displayName || displayName.length < 3) {
        showError(registerError, 'الاسم بالكامل مطلوب (3 أحرف على الأقل)');
        document.getElementById('regDisplayName').focus();
        return;
      }

      const cleanPhone = phone.replace(/[\s-]/g, '');
      if (!cleanPhone || !/^01[0125][0-9]{8}$/.test(cleanPhone)) {
        showError(registerError, 'يرجى إدخال رقم موبايل مصري صحيح مكون من 11 رقماً يبدأ بـ 01');
        document.getElementById('regPhone').focus();
        return;
      }

      if (!address || address.length < 5) {
        showError(registerError, 'العنوان بالتفصيل بأسيوط مطلوب (الشارع، رقم العمارة/الشقة)');
        document.getElementById('regAddress').focus();
        return;
      }

      if (!username || username.length < 3) {
        showError(registerError, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
        document.getElementById('regUsername').focus();
        return;
      }

      if (!password || password.length < 6) {
        showError(registerError, 'كلمة المرور يجب أن تكون 6 خانات أو أرقام على الأقل');
        document.getElementById('regPassword').focus();
        return;
      }

      if (password !== confirmPassword) {
        showError(registerError, 'كلمتا المرور غير متطابقتين، يرجى إعادة التأكد');
        document.getElementById('regConfirmPassword').focus();
        return;
      }

      const btn = document.getElementById('registerSubmitBtn');
      setLoading(btn, true);

      try {
        const data = await window.HeshamFouadAPI.register({
          displayName,
          phone: cleanPhone,
          address,
          username,
          password
        });

        if (data.success) {
          redirectAfterAuth();
        } else {
          showError(registerError, data.message || 'فشل إنشاء الحساب');
          setLoading(btn, false);
        }
      } catch (err) {
        showError(registerError, err.message || 'حدث خطأ في السيرفر أثناء إنشاء الحساب');
        setLoading(btn, false);
      }
    });
  }

})();
