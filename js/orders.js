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

  async function loadOrders() {
    try {
      const data = await CrepeAPI.apiGetOrders(1, 50);
      if (!data.success || data.orders.length === 0) {
        container.innerHTML = `
          <div class="cart-empty" style="display:flex;">
            <h3>مفيش طلبات لسه</h3>
            <p>لما تطلب أول أوردر هيظهر هنا</p>
            <a href="/" class="btn-back-to-menu">تصفح المنيو</a>
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
          `<div style="display:flex;justify-content:space-between;padding:0.3rem 0;font-size:0.82rem;">
            <span>${item.name} ${item.variantLabel ? '(' + item.variantLabel + ')' : ''} × ${item.quantity}</span>
            <span style="color:var(--color-text-muted);">${item.totalPrice} ج</span>
          </div>`
        ).join('');

        return `
          <div class="cart-item" style="flex-direction:column;align-items:stretch;gap:0.75rem;margin-bottom:0.75rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:800;color:var(--color-primary);">#${order.orderNumber}</span>
              <span style="font-size:0.75rem;padding:0.25rem 0.6rem;border-radius:9999px;font-weight:700;color:#fff;background:${statusColors[order.status] || '#6B7280'};">${statusLabels[order.status] || order.status}</span>
            </div>
            <div style="border-top:1px solid var(--color-border);padding-top:0.5rem;">
              ${itemsList}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--color-border);padding-top:0.5rem;">
              <span style="font-size:0.78rem;color:var(--color-text-muted);">${timeStr}</span>
              <span style="font-weight:800;color:var(--color-primary);">${order.totalAmount} جنيه</span>
            </div>
            ${order.notes ? `<div style="font-size:0.78rem;color:var(--color-text-muted);font-style:italic;">ملاحظات: ${order.notes}</div>` : ''}
          </div>
        `;
      }).join('');

    } catch (error) {
      container.innerHTML = `<p style="text-align:center;color:#FF4D4D;padding:2rem;">${error.message || 'حصل مشكلة في تحميل الطلبات'}</p>`;
    }
  }

  loadOrders();
})();
