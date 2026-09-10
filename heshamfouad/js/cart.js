/**
 * Hesham Fouad - King of Crepe
 * Cart Management & LocalStorage State (No Emojis)
 */
(function () {
  'use strict';

  const CART_STORAGE_KEY = 'hesham_fouad_cart';
  let cart = [];

  function loadCart() {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      cart = saved ? JSON.parse(saved) : [];
    } catch (e) {
      cart = [];
    }
    updateNavBadge();
    return cart;
  }

  function saveCart() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {}
    updateNavBadge();
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
  }

  function getCart() {
    return cart;
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

  function addToCart(item, quantity = 1, selectedAddons = [], selectedSauces = [], notes = '') {
    const customKey = item.id + '_' + selectedAddons.map(a => a.id).sort().join('_') + '_' + selectedSauces.map(s => s.id).sort().join('_');
    const existingIndex = cart.findIndex(ci => ci.customKey === customKey);

    const addonsTotal = selectedAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
    const saucesTotal = selectedSauces.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    const unitPrice = Number(item.price) + addonsTotal + saucesTotal;

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
      cart[existingIndex].totalPrice = cart[existingIndex].quantity * unitPrice;
    } else {
      cart.push({
        customKey,
        itemId: item.id,
        name: item.name,
        basePrice: Number(item.price),
        unitPrice,
        quantity,
        totalPrice: quantity * unitPrice,
        image: item.image || 'assets/images/logo.png',
        selectedAddons,
        selectedSauces,
        notes
      });
    }

    saveCart();
    showToastNotification('تمت اضافة "' + item.name + '" إلى السلة');
  }

  function updateQuantity(customKey, newQty) {
    const item = cart.find(ci => ci.customKey === customKey);
    if (!item) return;

    if (newQty <= 0) {
      removeFromCart(customKey);
    } else {
      item.quantity = newQty;
      item.totalPrice = item.quantity * item.unitPrice;
      saveCart();
    }
  }

  function removeFromCart(customKey) {
    cart = cart.filter(ci => ci.customKey !== customKey);
    saveCart();
  }

  function clearCart() {
    cart = [];
    saveCart();
  }

  function getCartTotals() {
    const subtotal = cart.reduce((sum, ci) => sum + ci.totalPrice, 0);
    const info = window.HeshamFouadData && window.HeshamFouadData.restaurantInfo ? window.HeshamFouadData.restaurantInfo : {};
    const deliveryFee = subtotal > 0 ? (info.deliveryFee || 15) : 0;
    const total = subtotal + deliveryFee;
    const totalCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);

    return {
      subtotal,
      deliveryFee,
      total,
      totalCount
    };
  }

  function updateNavBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const totalCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);
    badges.forEach(b => {
      b.textContent = totalCount;
      b.style.display = totalCount > 0 ? 'flex' : 'none';
    });
  }

  function showToastNotification(message) {
    let toast = document.getElementById('hf-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'hf-toast';
      toast.style.cssText = 'position:fixed;bottom:30px;right:30px;background:#162226;color:#FFFFFF;border:1px solid #0A748A;border-radius:9999px;padding:0.85rem 1.75rem;font-weight:700;font-size:0.95rem;box-shadow:0 10px 30px rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;gap:0.75rem;transform:translateY(100px);opacity:0;transition:transform 0.3s cubic-bezier(0.16,1,0.3,1),opacity 0.3s ease;';
      document.body.appendChild(toast);
    }
    toast.innerHTML = '<i class="fas fa-check-circle" style="color:#F59E0B;"></i> <span>' + escapeHtml(message) + '</span>';
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';

    clearTimeout(toast.timeout);
    toast.timeout = setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
    }, 2800);
  }

  function formatWhatsAppOrder(customerInfo) {
    customerInfo = customerInfo || {};
    const totals = getCartTotals();
    const info = (window.HeshamFouadData && window.HeshamFouadData.restaurantInfo) || {};
    const phone = info.whatsapp || '201554006656';
    const orderNum = customerInfo.orderNumber || ('HF-' + Math.floor(1000 + Math.random() * 9000));

    // Arabic Date & Time
    let timeStr = '';
    let dateStr = '';
    try {
      const now = new Date();
      timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      timeStr = new Date().toLocaleTimeString();
    }

    let msg = '👑 *طلب أونلاين جديد — هشام فؤاد (ملك الكريب)*\n';
    msg += '━━━━━━━━━━━━━━━━━━━━━━\n';
    msg += '🧾 *رقم الأوردر:* #' + orderNum + '\n';
    if (timeStr) {
      msg += '⏰ *التوقيت:* ' + timeStr + (dateStr ? ' (' + dateStr + ')' : '') + '\n';
    }
    msg += '━━━━━━━━━━━━━━━━━━━━━━\n';
    msg += '👤 *بيانات العميل والتوصيل:*\n';
    msg += '• *الاسم:* ' + (customerInfo.name || 'عميل') + '\n';
    msg += '• *الموبايل:* ' + (customerInfo.phone || '') + '\n';
    msg += '• *العنوان:* ' + (customerInfo.address || 'استلام من الفرع') + '\n';
    if (customerInfo.mapLocation) {
      msg += '📍 *موقع GPS على الخريطة:*\n' + customerInfo.mapLocation + '\n';
    }
    if (customerInfo.notes) {
      msg += '📝 *ملاحظات العميل:* ' + customerInfo.notes + '\n';
    }
    msg += '━━━━━━━━━━━━━━━━━━━━━━\n';
    msg += '🌯 *الأصناف والكميات المطلوبة:*\n';

    cart.forEach((item, index) => {
      msg += '\n' + (index + 1) + '. *' + item.name + '*\n';
      msg += '   الكمية: ' + item.quantity + ' × ' + item.unitPrice + ' ج = *' + item.totalPrice + ' ج*\n';
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        msg += '   + إضافات: ' + item.selectedAddons.map(a => a.name).join('، ') + '\n';
      }
      if (item.selectedSauces && item.selectedSauces.length > 0) {
        msg += '   + صوصات: ' + item.selectedSauces.map(s => s.name).join('، ') + '\n';
      }
      if (item.notes) {
        msg += '   - ملاحظة خاصة: ' + item.notes + '\n';
      }
    });

    msg += '\n━━━━━━━━━━━━━━━━━━━━━━\n';
    msg += '💵 *الحساب المالي:*\n';
    msg += '• مجموع الأصناف: ' + totals.subtotal + ' ج.م\n';
    msg += '• خدمة التوصيل (أسيوط): ' + totals.deliveryFee + ' ج.م\n';
    msg += '💰 *الإجمالي المطلوب للدفع:* *' + totals.total + ' ج.م*\n';
    msg += '🛵 *طريقة الدفع:* كاش عند الاستلام\n';
    msg += '━━━━━━━━━━━━━━━━━━━━━━\n';
    msg += '📍 فرع أسيوط: شارع المحافظة بجوار الفانوس أمام مستشفى طيبة\n';
    msg += '_تم إرسال هذا الطلب تلقائياً عبر موقع هشام فؤاد الرسمي_';

    const encoded = encodeURIComponent(msg);
    return 'https://wa.me/' + phone + '?text=' + encoded;
  }

  loadCart();

  window.HeshamFouadCart = {
    getCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotals,
    formatWhatsAppOrder,
    loadCart
  };
})();