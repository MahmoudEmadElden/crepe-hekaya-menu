/**
 * Customer Orders Tracker — Hesham Fouad King of Crepe
 */
(function () {
  'use strict';

  if (!window.HeshamFouadAPI || !window.HeshamFouadAPI.isLoggedIn()) {
    window.location.href = 'auth.html?returnTo=orders.html';
    return;
  }

  const container = document.getElementById('ordersListContainer');

  const statusLabels = {
    pending: 'قيد الانتظار',
    accepted: 'تم قبول الطلب',
    preparing: 'جاري تحضير الكريب',
    ready: 'جاهز للتوصيل',
    delivered: 'تم التوصيل بنجاح',
    cancelled: 'ملغي'
  };

  const statusColors = {
    pending: '#F59E0B',
    accepted: '#3B82F6',
    preparing: '#18B5D1',
    ready: '#8B5CF6',
    delivered: '#10B981',
    cancelled: '#EF4444'
  };

  function renderStepper(status) {
    if (status === 'cancelled') {
      return `
        <div style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:0.75rem 1.25rem; color:#EF4444; font-size:0.9rem; font-weight:700; display:flex; align-items:center; gap:0.6rem; margin:1rem 0;">
          <i class="fas fa-times-circle"></i>
          <span>تم إلغاء هذا الطلب من قبل إدارة المطعم.</span>
        </div>
      `;
    }

    let currentStep = 1;
    if (status === 'accepted' || status === 'preparing') currentStep = 2;
    else if (status === 'ready') currentStep = 3;
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
        <div class="stepper-line ${currentStep >= 4 ? 'completed delivered' : ''}"></div>
        <div class="stepper-step ${currentStep >= 4 ? 'completed delivered' : ''} ${currentStep === 4 ? 'active' : ''}">
          <div class="step-circle"><i class="fas fa-check-double"></i></div>
          <span class="step-label">تم التسليم</span>
        </div>
      </div>
    `;
  }

  async function loadOrders() {
    try {
      const data = await window.HeshamFouadAPI.getOrders({ page: 1, limit: 50 });
      if (!data.success || !Array.isArray(data.orders) || data.orders.length === 0) {
        container.innerHTML = `
          <div class="empty-orders-state">
            <i class="fas fa-receipt" style="font-size:3rem; color:var(--accent-gold); margin-bottom:1rem; opacity:0.6;"></i>
            <h3 style="font-size:1.35rem; font-weight:800; color:#fff; margin-bottom:0.5rem;">لا توجد طلبات سابقة</h3>
            <p style="color:var(--text-muted); margin-bottom:1.5rem;">لم تقم بطلب أي كريب حتى الآن. يمكنك استعراض القائمة الآن والطلب.</p>
            <a href="menu.html" class="btn-landing-order" style="display:inline-flex; padding:0.8rem 2rem; border-radius:var(--radius-full);">تصفح المنيو واطلب الآن</a>
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

        const statusText = statusLabels[order.status] || order.status;
        const statusColor = statusColors[order.status] || '#F59E0B';

        const itemsHtml = (order.items || []).map(item => {
          let customNotes = '';
          if (item.selectedAddons && item.selectedAddons.length > 0) {
            customNotes += ` (+ إضافات: ${item.selectedAddons.map(a => a.name).join('، ')})`;
          }
          if (item.selectedSauces && item.selectedSauces.length > 0) {
            customNotes += ` (+ صوصات: ${item.selectedSauces.map(s => s.name).join('، ')})`;
          }
          if (item.notes) {
            customNotes += ` [${item.notes}]`;
          }

          return `
            <div class="order-item-row">
              <div>
                <strong>${item.name}</strong> × ${item.quantity}
                ${customNotes ? `<div style="font-size:0.78rem; color:var(--text-muted);">${customNotes}</div>` : ''}
              </div>
              <div style="font-family:'Outfit'; font-weight:800; color:#fff;">${item.totalPrice} ج.م</div>
            </div>
          `;
        }).join('');

        return `
          <div class="order-card">
            <div class="order-card-header">
              <div>
                <div class="order-number-title">
                  <i class="fas fa-receipt"></i>
                  <span>أوردر #${order.orderNumber || '0000'}</span>
                </div>
                <div class="order-date-text">
                  <i class="fas fa-clock" style="margin-left:4px;"></i>
                  ${timeStr}
                </div>
              </div>

              <div class="order-status-badge" style="background:${statusColor}22; color:${statusColor}; border:1px solid ${statusColor}44;">
                <span style="width:8px; height:8px; border-radius:50%; background:${statusColor}; display:inline-block;"></span>
                <span>${statusText}</span>
              </div>
            </div>

            <!-- Stepper -->
            ${renderStepper(order.status)}

            <!-- Items -->
            <div class="order-items-box">
              <div style="font-size:0.85rem; font-weight:800; color:var(--primary-light); margin-bottom:0.5rem;">محتويات الأوردر:</div>
              ${itemsHtml}
              
              <div class="order-totals-bar">
                <span style="color:var(--text-cream); font-size:0.95rem;">الإجمالي شامل التوصيل:</span>
                <span style="font-family:'Outfit'; font-size:1.4rem; color:var(--accent-gold); font-weight:900;">${order.totalAmount} ج.م</span>
              </div>
            </div>

            <!-- Delivery info -->
            <div style="margin-top:0.85rem; font-size:0.82rem; color:var(--text-muted); display:flex; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
              <span><i class="fas fa-map-marker-alt" style="color:var(--accent-gold); margin-left:4px;"></i> ${order.deliveryAddress}</span>
              <span><i class="fas fa-phone-alt" style="color:var(--accent-gold); margin-left:4px;"></i> ${order.customerPhone}</span>
            </div>
          </div>
        `;
      }).join('');

    } catch (err) {
      console.error('Error loading orders:', err);
      container.innerHTML = `
        <div style="text-align:center; padding:2rem; color:#EF4444;">
          <p>حدث خطأ أثناء تحميل الطلبات. يرجى المحاولة مرة أخرى.</p>
          <button onclick="location.reload()" style="background:var(--primary); color:#fff; border:none; padding:0.5rem 1.5rem; border-radius:20px; cursor:pointer; margin-top:0.5rem;">إعادة المحاولة</button>
        </div>
      `;
    }
  }

  loadOrders();

  // Auto-refresh orders status every 20 seconds
  setInterval(loadOrders, 20000);

  // Change Password Modal Trigger
  document.getElementById('btnOrdersChangePw')?.addEventListener('click', () => {
    window.HeshamFouadAPI.openChangePasswordModal();
  });
})();
