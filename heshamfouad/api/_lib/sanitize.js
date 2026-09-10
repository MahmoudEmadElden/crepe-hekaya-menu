/**
 * Output Sanitization Helpers — Hesham Fouad
 * Prevents XSS by escaping user-controlled values before injection into HTML.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeOrderItem(item) {
  if (!item) return item;
  return {
    ...item,
    name: escapeHtml(item.name),
    notes: escapeHtml(item.notes),
    selectedAddons: Array.isArray(item.selectedAddons)
      ? item.selectedAddons.map(a => ({ ...a, name: escapeHtml(a.name) }))
      : item.selectedAddons,
    selectedSauces: Array.isArray(item.selectedSauces)
      ? item.selectedSauces.map(s => ({ ...s, name: escapeHtml(s.name) }))
      : item.selectedSauces
  };
}

function sanitizeOrder(order) {
  if (!order) return order;
  return {
    ...order,
    customerName: escapeHtml(order.customerName),
    customerPhone: escapeHtml(order.customerPhone),
    deliveryAddress: escapeHtml(order.deliveryAddress),
    mapLocation: escapeHtml(order.mapLocation),
    notes: escapeHtml(order.notes),
    items: Array.isArray(order.items) ? order.items.map(sanitizeOrderItem) : order.items
  };
}

module.exports = { escapeHtml, sanitizeOrderItem, sanitizeOrder };