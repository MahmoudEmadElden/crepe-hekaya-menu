/**
 * Customer Orders History — Crepe Hekaya
 */
(function () {
  'use strict';

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

      container.innerHTML = data.orders.map(order => {
        const date = new Date(order.createdAt);
        const timeStr = date.toLocaleString('ar-EG', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });

        const itemsList = order.items.map(item =>
          `<div style="display:flex;justify-content:space-between;padding:0.35rem 0;font-size:0.85rem;">
            <span>${item.name} ${item.variantLabel ? '(' + item.variantLabel + ')' : ''} × ${item.quantity}</span>
            <span style="color:var(--color-text-muted);font-weight:700;">${item.totalPrice} ج</span>
          </div>`
        ).join('');

        return `
          <div class="cart-item" style="flex-direction:column;align-items:stretch;gap:0.75rem;margin-bottom:1rem;padding:1.25rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div>
                <span style="font-weight:900;font-size:1.15rem;color:var(--color-primary);font-family:var(--font-latin);">#${order.orderNumber}</span>
                <span style="font-size:0.8rem;color:var(--color-text-muted);margin-right:0.5rem;">${timeStr}</span>
              </div>
              <span style="font-size:0.75rem;padding:0.3rem 0.75rem;border-radius:9999px;font-weight:800;color:#fff;background:${statusColors[order.status] || '#6B7280'};">
                ${statusLabels[order.status] || order.status}
              </span>
            </div>

            <!-- Live Stepper Bar -->
            ${renderStepper(order.status)}

            <div style="border-top:1px solid var(--color-border);padding-top:0.75rem;">
              ${itemsList}
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-border);padding-top:0.6rem;">
              <span style="font-size:0.82rem;color:var(--color-text-muted);">طريقة الدفع: كاش عند الاستلام</span>
              <span style="font-weight:900;font-size:1.1rem;color:var(--color-secondary);">${order.totalAmount} جنيه</span>
            </div>

            ${order.notes ? `<div style="font-size:0.8rem;color:var(--color-text-muted);font-style:italic;">ملاحظات: ${order.notes}</div>` : ''}
            ${order.mapLocation ? `
              <div style="margin-top:0.25rem;">
                <a href="${order.mapLocation}" target="_blank" style="color:var(--color-primary-light);font-size:0.8rem;text-decoration:none;display:inline-flex;align-items:center;gap:0.35rem;">
                  <i class="fas fa-location-dot"></i>
                  <span>عرض موقع التوصيل على خرائط جوجل</span>
                </a>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

    } catch (error) {
      container.innerHTML = `<p style="text-align:center;color:#FF4D4D;padding:2rem;">${error.message || 'حصل مشكلة في تحميل الطلبات'}</p>`;
    }
  }

  loadOrders();
  // Live polling every 8 seconds
  setInterval(loadOrders, 8000);
})();
