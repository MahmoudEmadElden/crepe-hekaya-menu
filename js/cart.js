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

  /* ---- Unified Instant WhatsApp Checkout (Zero Login Barrier) ---- */
  async function handleUnifiedCheckout() {
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

    const mapLocation = document.getElementById('orderMapLocation') ? document.getElementById('orderMapLocation').value.trim() : '';

    // Set loading state
    checkoutBtn.disabled = true;
    if (checkoutBtn.querySelector('.btn-text')) checkoutBtn.querySelector('.btn-text').style.display = 'none';
    if (checkoutBtn.querySelector('.btn-loading')) checkoutBtn.querySelector('.btn-loading').style.display = 'inline';

    let orderNumber = 'CH-' + Math.floor(1000 + Math.random() * 9000);

    // Background attempt to log to database if reachable
    try {
      if (CrepeAPI.isLoggedIn && CrepeAPI.isLoggedIn()) {
        const apiPromise = CrepeAPI.apiCreateOrder(cart, notes, deliveryAddress, cleanPhone, customerName, mapLocation)
          .catch(err => { console.warn('Background sync note:', err); return null; });
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 500));
        const res = await Promise.race([apiPromise, timeoutPromise]);
        if (res && res.success && res.order && res.order.orderNumber) {
          orderNumber = res.order.orderNumber;
        }
      }
    } catch (e) {
      console.warn('Background order registration note:', e);
    }

    // Prepare luxury WhatsApp receipt
    let timeStr = '';
    let dateStr = '';
    try {
      const now = new Date();
      timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      timeStr = new Date().toLocaleTimeString();
    }

    const total = CrepeAPI.getCartTotal();

    let message = `👑 *طلب أونلاين جديد — مطعم كريب حكاية*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🧾 *رقم الأوردر:* #${orderNumber}\n`;
    if (timeStr) {
      message += `⏰ *التوقيت:* ${timeStr}${dateStr ? ' (' + dateStr + ')' : ''}\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `👤 *بيانات العميل والتوصيل:*\n`;
    message += `• *الاسم:* ${customerName}\n`;
    message += `• *الهاتف:* ${cleanPhone}\n`;
    message += `• *العنوان:* ${deliveryAddress}\n`;
    if (mapLocation) {
      message += `📍 *موقع GPS على الخريطة:*\n${mapLocation}\n`;
    }
    if (notes) {
      message += `📝 *ملاحظات العميل:* ${notes}\n`;
    }
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `🌯 *الأصناف والكميات المطلوبة:*\n`;

    cart.forEach((item, index) => {
      const variantText = item.variantLabel ? ` (${item.variantLabel})` : '';
      const lineTotal = item.unitPrice * item.quantity;
      message += `\n${index + 1}. *${item.name}*${variantText}\n   الكمية: ${item.quantity} × ${item.unitPrice} ج = *${lineTotal} ج*\n`;
    });

    message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💰 *الإجمالي الكلي المطلوب للدفع:* *${total} جنيه*\n`;
    message += `🛵 *طريقة الدفع:* كاش عند الاستلام\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📍 كريب حكاية: شارع الأزهر بجوار مطعم بهية\n`;
    message += `_تم إرسال هذا الطلب تلقائياً عبر موقع كريب حكاية الرسمي_`;

    const whatsappUrl = `https://wa.me/201064319292?text=${encodeURIComponent(message)}`;

    // Clear Cart
    CrepeAPI.clearCart();

    // Show Confirmation View on screen
    cartItemsList.style.display = 'none';
    cartFooter.style.display = 'none';
    const cartHeader = document.querySelector('.cart-header');
    if (cartHeader) cartHeader.style.display = 'none';

    if (confirmOrderNum) confirmOrderNum.textContent = `#${orderNumber}`;
    const directWaBtn = document.getElementById('confirmWaDirectBtn');
    if (directWaBtn) directWaBtn.href = whatsappUrl;

    orderConfirmation.style.display = 'flex';
    orderConfirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Auto-launch WhatsApp directly on customer's phone!
    setTimeout(() => {
      window.location.href = whatsappUrl;
    }, 400);
  }

  checkoutBtn.addEventListener('click', handleUnifiedCheckout);

  const btnWhatsApp = document.getElementById('btnWhatsAppCheckout');
  if (btnWhatsApp) {
    btnWhatsApp.addEventListener('click', handleUnifiedCheckout);
  }

  /* ---- Leaflet GPS Location Picker ---- */
  let deliveryMapInstance = null;
  let deliveryMarker = null;

  function initGpsPicker() {
    const btnGps = document.getElementById('btnGpsLocation');
    const mapContainer = document.getElementById('mapPickerContainer');
    const addressInput = document.getElementById('orderDeliveryAddress');
    const mapLocationInput = document.getElementById('orderMapLocation');
    const coordsText = document.getElementById('mapCoordsText');

    if (!btnGps) return;

    btnGps.addEventListener('click', () => {
      if (!navigator.geolocation) {
        CrepeAPI.showToast('المتصفح لا يدعم تحديد الموقع الجغرافي GPS', 'error');
        return;
      }

      btnGps.disabled = true;
      btnGps.innerHTML = `<span>جارٍ تحديد موقعك...</span>`;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          btnGps.disabled = false;
          btnGps.innerHTML = `<i class="fas fa-check"></i> <span>تم تحديد موقعك</span>`;

          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const googleMapsLink = `https://maps.google.com/?q=${lat},${lng}`;
          if (mapLocationInput) mapLocationInput.value = googleMapsLink;
          if (coordsText) coordsText.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

          if (mapContainer) mapContainer.style.display = 'block';

          if (typeof L !== 'undefined') {
            if (!deliveryMapInstance) {
              deliveryMapInstance = L.map('deliveryMap').setView([lat, lng], 16);
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
              }).addTo(deliveryMapInstance);

              deliveryMarker = L.marker([lat, lng], { draggable: true }).addTo(deliveryMapInstance);
              deliveryMarker.on('dragend', () => {
                const markerPos = deliveryMarker.getLatLng();
                const updatedLink = `https://maps.google.com/?q=${markerPos.lat},${markerPos.lng}`;
                if (mapLocationInput) mapLocationInput.value = updatedLink;
                if (coordsText) coordsText.textContent = `${markerPos.lat.toFixed(5)}, ${markerPos.lng.toFixed(5)}`;
              });
            } else {
              deliveryMapInstance.setView([lat, lng], 16);
              deliveryMarker.setLatLng([lat, lng]);
              deliveryMapInstance.invalidateSize();
            }
          }

          if (addressInput && (!addressInput.value || addressInput.value.trim().length === 0)) {
            addressInput.value = 'موقعي الحالي عبر الـ GPS';
          }
        },
        (err) => {
          btnGps.disabled = false;
          btnGps.innerHTML = `<i class="fas fa-location-crosshairs"></i> <span>تحديد موقعي بالـ GPS</span>`;
          CrepeAPI.showToast('تعذر جلب موقع GPS. يرجى تفعيل إذن الموقع بالمتصفح.', 'error');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  /* ---- Init ---- */
  renderCart();
  prefillCustomerInfo();
  initGpsPicker();
})();