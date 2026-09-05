/**
 * Cart Page Logic — Crepe Hekaya
 * Renders cart items, handles quantity changes, and processes checkout.
 */
(function () {
  'use strict';

  const cartItemsList = document.getElementById('cartItemsList');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartFooter = document.getElementById('cartFooter');
  const cartItemsCount = document.getElementById('cartItemsCount');
  const cartTotalNum = document.getElementById('cartTotalNum');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const orderConfirmation = document.getElementById('orderConfirmation');
  const confirmOrderNum = document.getElementById('confirmOrderNum');

  /* ---- Render Cart ---- */
  function renderCart() {
    const cart = CrepeAPI.getCart();

    if (cart.length === 0) {
      cartItemsList.style.display = 'none';
      cartFooter.style.display = 'none';
      cartEmpty.style.display = 'flex';
      cartItemsCount.textContent = '0 أصناف';
      return;
    }

    cartEmpty.style.display = 'none';
    cartItemsList.style.display = 'flex';
    cartFooter.style.display = 'flex';

    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    cartItemsCount.textContent = `${totalItems} صنف`;
    cartTotalNum.textContent = CrepeAPI.getCartTotal();

    cartItemsList.innerHTML = cart.map(item => {
      const lineTotal = item.unitPrice * item.quantity;
      return `
        <div class="cart-item" data-item-id="${item.itemId}" data-variant="${item.variant}">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            ${item.variantLabel ? `<div class="cart-item-variant">${item.variantLabel} — ${item.unitPrice} ج</div>` : `<div class="cart-item-variant">${item.unitPrice} ج</div>`}
          </div>
          <div class="cart-item-qty">
            <button class="qty-btn qty-minus" aria-label="أقل">−</button>
            <span class="qty-num">${item.quantity}</span>
            <button class="qty-btn qty-plus" aria-label="أكثر">+</button>
          </div>
          <span class="cart-item-price">${lineTotal} ج</span>
          <button class="cart-item-remove" aria-label="حذف الصنف">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;
    }).join('');
  }

  /* ---- Cart Events ---- */
  cartItemsList.addEventListener('click', (e) => {
    const cartItem = e.target.closest('.cart-item');
    if (!cartItem) return;

    const itemId = cartItem.dataset.itemId;
    const variant = cartItem.dataset.variant;
    const cart = CrepeAPI.getCart();
    const item = cart.find(c => c.itemId === itemId && c.variant === variant);
    if (!item) return;

    if (e.target.closest('.qty-minus')) {
      CrepeAPI.updateCartItemQty(itemId, variant, item.quantity - 1);
      renderCart();
    } else if (e.target.closest('.qty-plus')) {
      CrepeAPI.updateCartItemQty(itemId, variant, item.quantity + 1);
      renderCart();
    } else if (e.target.closest('.cart-item-remove')) {
      CrepeAPI.removeFromCart(itemId, variant);
      renderCart();
    }
  });

  /* ---- Prefill Customer Delivery Info ---- */
  function prefillCustomerInfo() {
    const user = CrepeAPI.getUser();
    if (user) {
      const nameInput = document.getElementById('orderCustomerName');
      const phoneInput = document.getElementById('orderCustomerPhone');
      const addressInput = document.getElementById('orderDeliveryAddress');
      if (nameInput && user.displayName) nameInput.value = user.displayName;
      if (phoneInput && user.phone) phoneInput.value = user.phone;
      if (addressInput && user.address) addressInput.value = user.address;
    }
  }

  /* ---- Checkout ---- */
  checkoutBtn.addEventListener('click', async () => {
    // Check if logged in
    if (!CrepeAPI.isLoggedIn()) {
      CrepeAPI.showToast('لازم تسجل دخول أولاً لتأكيد طلبك', 'error');
      setTimeout(() => {
        window.location.href = '/auth.html?returnTo=/cart.html';
      }, 1000);
      return;
    }

    const cart = CrepeAPI.getCart();
    if (cart.length === 0) {
      CrepeAPI.showToast('السلة فاضية!', 'error');
      return;
    }

    const customerName = document.getElementById('orderCustomerName').value.trim();
    const customerPhone = document.getElementById('orderCustomerPhone').value.trim();
    const deliveryAddress = document.getElementById('orderDeliveryAddress').value.trim();
    const notes = document.getElementById('orderNotes').value.trim();

    // Validation for delivery info
    if (!customerName) {
      CrepeAPI.showToast('الاسم بالكامل مطلوب لإتمام الطلب', 'error');
      document.getElementById('orderCustomerName').focus();
      return;
    }

    const cleanPhone = customerPhone.replace(/[\s-]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      CrepeAPI.showToast('يرجى إدخال رقم هاتف صحيح للتواصل معك وقت التوصيل', 'error');
      document.getElementById('orderCustomerPhone').focus();
      return;
    }

    if (!deliveryAddress || deliveryAddress.length < 5) {
      CrepeAPI.showToast('عنوان التوصيل بالتفصيل مطلوب (المنطقة والشارع ورقم العمارة)', 'error');
      document.getElementById('orderDeliveryAddress').focus();
      return;
    }

    // Set loading state
    checkoutBtn.disabled = true;
    checkoutBtn.querySelector('.btn-text').style.display = 'none';
    checkoutBtn.querySelector('.btn-loading').style.display = 'inline';

    try {
      const data = await CrepeAPI.apiCreateOrder(cart, notes, deliveryAddress, cleanPhone, customerName);

      if (data.success) {
        // Clear cart
        CrepeAPI.clearCart();

        // Show confirmation
        cartItemsList.style.display = 'none';
        cartFooter.style.display = 'none';
        document.querySelector('.cart-header').style.display = 'none';
        confirmOrderNum.textContent = `#${data.order.orderNumber}`;
        orderConfirmation.style.display = 'flex';
      }
    } catch (error) {
      CrepeAPI.showToast(error.message || 'حصل مشكلة في إرسال الطلب', 'error', 3000);
      checkoutBtn.disabled = false;
      checkoutBtn.querySelector('.btn-text').style.display = 'inline';
      checkoutBtn.querySelector('.btn-loading').style.display = 'none';
    }
  });

  /* ---- Init ---- */
  renderCart();
  prefillCustomerInfo();
})();
