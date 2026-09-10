/**
 * Customer Orders History — Crepe Hekaya
 */
(function () {
  'use strict';

  function safeHttpUrl(value) {
    if (!value) return '';
    try {
      const url = new URL(String(value), window.location.origin);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch (error) {
      return '';
    }
  }

  if (!CrepeAPI.isLoggedIn()) {
    window.location.href = '/auth.html?returnTo=/orders.html';
    return;
  }

  const container = document.getElementById('ordersContainer');

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

  function renderStepper(status) {
    if (status === 'cancelled') {
      return `
        <div style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-sm);padding:0.6rem 1rem;color:#EF4444;font-size:0.85rem;font-weight:700;display:flex;align-items:center;gap:0.5rem;margin:0.75rem 0;">
          <i class="fas fa-times-circle"></i>
          <span>تم إلغاء هذا الطلب من قبل الإدارة.</span>
        </div>
      `;
    }

    let currentStep = 1;
    if (status === 'accepted' || status === 'preparing') currentStep = 2;
    else if (status === 'ready' || status === 'delivering') currentStep = 3;
    else if (status === 'delivered') currentStep = 4;

    return `
      <div class="order-stepper-wrap">
        <div class="stepper-step ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'active' : ''}">
          <div class="step-circle"><i class="fas fa-receipt"></i></div>
          <span class="step-label">تم الاستلام</span>
        </div>
        <div class="stepper-line ${currentStep >= 2 ? 'completed' : ''}"></div>
        <div class="stepper-step ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'active' : ''}">
          <div class="step-circle"><i class="fas fa-fire-burner"></i></div>
          <span class="step-label">جاري التحضير</span>
        </div>
        <div class="stepper-line ${currentStep >= 3 ? 'completed' : ''}"></div>
        <div class="stepper-step ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'active' : ''}">
          <div class="step-circle"><i class="fas fa-motorcycle"></i></div>
          <span class="step-label">خرج للتوصيل</span>
        </div>
        <div class="stepper-line ${currentStep >= 4 ? 'completed' : ''}"></div>
        <div class="stepper-step ${currentStep >= 4 ? 'completed delivered' : ''} ${currentStep === 4 ? 'active' : ''}">
          <div class="step-circle"><i class="fas fa-check-double"></i></div>
          <span class="step-label">تم التسليم</span>
        </div>
      </div>
    `;
  }

  async function loadOrders() {
    try {
      const data = await CrepeAPI.apiGetOrders(1, 50);
      if (!data.success || data.orders.length === 0) {
        container.innerHTML = `
          <div class="cart-empty" style="display:flex;">
            <h3>مفيش طلبات لسه</h3>
            <p>لما تطلب أول أوردر هيظهر هنا ويتم تتبعه فوراً</p>
            <a href="/menu.html" class="btn-back-to-menu">تصفح المنيو</a>
          </div>
        `;
        return;
      }

      container.replaceChildren();
      const fragment = document.createDocumentFragment();
      data.orders.forEach(order => {
        const date = new Date(order.createdAt);
        const timeStr = date.toLocaleString('ar-EG', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        const card = document.createElement('div');
        card.className = 'cart-item';
        card.style.cssText = 'flex-direction:column;align-items:stretch;gap:0.75rem;margin-bottom:1rem;padding:1.25rem;';

        const header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';
        const identity = document.createElement('div');
        const number = document.createElement('span');
        number.style.cssText = 'font-weight:900;font-size:1.15rem;color:var(--color-primary);font-family:var(--font-latin);';
        number.textContent = `#${order.orderNumber || ''}`;
        const time = document.createElement('span');
        time.style.cssText = 'font-size:0.8rem;color:var(--color-text-muted);margin-right:0.5rem;';
        time.textContent = timeStr;
        identity.append(number, time);
        const status = document.createElement('span');
        status.style.cssText = 'font-size:0.75rem;padding:0.3rem 0.75rem;border-radius:9999px;font-weight:800;color:#fff;';
        status.style.background = statusColors[order.status] || '#6B7280';
        status.textContent = statusLabels[order.status] || order.status;
        header.append(identity, status);
        const stepperWrap = document.createElement('div');
        stepperWrap.innerHTML = renderStepper(order.status);
        card.append(header, stepperWrap);

        const items = document.createElement('div');
        items.style.cssText = 'border-top:1px solid var(--color-border);padding-top:0.75rem;';
        (order.items || []).forEach(item => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;justify-content:space-between;padding:0.35rem 0;font-size:0.85rem;';
          const name = document.createElement('span');
          name.textContent = `${item.name || ''} ${item.variantLabel ? `(${item.variantLabel})` : ''} × ${item.quantity || 0}`;
          const price = document.createElement('span');
          price.style.cssText = 'color:var(--color-text-muted);font-weight:700;';
          price.textContent = `${item.totalPrice || 0} ج`;
          row.append(name, price);
          items.append(row);
        });
        card.append(items);

        const footer = document.createElement('div');
        footer.style.cssText = 'display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-border);padding-top:0.6rem;';
        const payment = document.createElement('span');
        const paymentLabel = document.createElement('span');
        paymentLabel.textContent = 'طريقة الدفع: كاش عند الاستلام';
        const total = document.createElement('span');
        total.style.cssText = 'font-weight:900;font-size:1.1rem;color:var(--color-secondary);';
        total.textContent = `${order.totalAmount || 0} جنيه`;
        footer.append(paymentLabel, total);
        card.append(footer);

        if (order.notes) {
          const notes = document.createElement('div');
          notes.style.cssText = 'font-size:0.8rem;color:var(--color-text-muted);font-style:italic;';
          notes.textContent = `ملاحظات: ${order.notes}`;
          card.append(notes);
        }
        const mapUrl = safeHttpUrl(order.mapLocation);
        if (mapUrl) {
          const mapWrap = document.createElement('div');
          mapWrap.style.marginTop = '0.25rem';
          const mapLink = document.createElement('a');
          mapLink.href = mapUrl;
          mapLink.target = '_blank';
          mapLink.rel = 'noopener noreferrer';
          mapLink.style.cssText = 'color:var(--color-primary-light);font-size:0.8rem;text-decoration:none;display:inline-flex;align-items:center;gap:0.35rem;';
          const icon = document.createElement('i');
          icon.className = 'fas fa-location-dot';
          const mapText = document.createElement('span');
          mapText.textContent = 'عرض موقع التوصيل على خرائط جوجل';
          mapLink.append(icon, mapText);
          mapWrap.append(mapLink);
          card.append(mapWrap);
        }
        fragment.append(card);
      });
      container.append(fragment);

    } catch (error) {
      container.replaceChildren();
      const message = document.createElement('p');
      message.style.cssText = 'text-align:center;color:#FF4D4D;padding:2rem;';
      message.textContent = error.message || 'حصل مشكلة في تحميل الطلبات';
      container.append(message);
    }
  }

  document.getElementById('btnUserChangePw')?.addEventListener('click', () => {
    CrepeAPI.openChangePasswordModal();
  });

  loadOrders();
  // Live polling every 8 seconds
  setInterval(loadOrders, 8000);
})();
