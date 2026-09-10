/**
 * POST /api/orders/create
 * Secure order creation for Hesham Fouad.
 * Prices are derived from the single source of truth (js/menuData.js)
 * to guarantee every item id matches the client-side menu.
 */
const path = require('path');
const { connectDB } = require('../_lib/db');
const { verifyToken, handleCors } = require('../_lib/auth-middleware');
const Order = require('../_lib/models/Order');
const Counter = require('../_lib/models/Counter');
const User = require('../_lib/models/User');

const menuData = require(path.resolve(__dirname, '../../js/menuData.js'));

const PRICE_MAP = {};
menuData.menuItems.forEach(item => {
  PRICE_MAP[item.id] = Number(item.price) || 0;
});

const ADDON_MAP = {};
menuData.extraAddons.forEach(a => { ADDON_MAP[a.id] = Number(a.price) || 0; });
menuData.extraSauces.forEach(s => { ADDON_MAP[s.id] = Number(s.price) || 0; });
menuData.sweetSauces.forEach(s => { ADDON_MAP[s.id] = Number(s.price) || 0; });

const DELIVERY_FEE = Number(menuData.restaurantInfo.deliveryFee) || 15;
const MIN_ORDER = Number(menuData.restaurantInfo.minOrder) || 0;

function resolveItemId(itemId) {
  if (!itemId) return '';
  if (PRICE_MAP[itemId]) return itemId;
  return itemId;
}

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const decoded = verifyToken(req.headers.authorization);
    await connectDB();

    const user = await User.findById(decoded.userId).select('displayName username phone address');

    const { items, notes, deliveryAddress: inputAddress, customerPhone: inputPhone, customerName: inputName, mapLocation } = req.body;

    const customerName = (inputName && inputName.trim()) || (user ? (user.displayName || user.username) : '');
    const customerPhone = (inputPhone && inputPhone.trim()) || (user ? user.phone : '');
    const deliveryAddress = (inputAddress && inputAddress.trim()) || (user ? user.address : '');

    if (!customerName || customerName.length < 3) {
      return res.status(400).json({ success: false, message: 'الاسم بالكامل مطلوب لإتمام الطلب' });
    }

    const cleanPhone = customerPhone.replace(/[\s-]/g, '');
    if (!cleanPhone || !/^01[0125][0-9]{8}$/.test(cleanPhone)) {
      return res.status(400).json({ success: false, message: 'رقم الموبايل غير صحيح. يرجى إدخال رقم مصري صحيح مكون من 11 رقماً' });
    }

    if (!deliveryAddress || deliveryAddress.length < 5) {
      return res.status(400).json({ success: false, message: 'عنوان التوصيل بالتفصيل بأسيوط مطلوب لإتمام الطلب' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'يجب اختيار صنف واحد على الأقل' });
    }

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const resolvedId = resolveItemId(item.itemId);
      const basePrice = PRICE_MAP[resolvedId];
      if (!basePrice) {
        return res.status(400).json({ success: false, message: `الصنف ${item.name || item.itemId} غير صالح أو غير مسجل في قائمة الأسعار` });
      }
      let addonsSum = 0;

      const validatedAddons = [];
      if (Array.isArray(item.selectedAddons)) {
        for (const addon of item.selectedAddons) {
          const aPrice = ADDON_MAP[addon.id] || 0;
          if (aPrice === 0) {
            return res.status(400).json({ success: false, message: `إضافة ${addon.name || addon.id} غير صالحة` });
          }
          addonsSum += aPrice;
          validatedAddons.push({
            id: addon.id,
            name: addon.name,
            price: aPrice
          });
        }
      }

      const validatedSauces = [];
      if (Array.isArray(item.selectedSauces)) {
        for (const sauce of item.selectedSauces) {
          const sPrice = ADDON_MAP[sauce.id] || 0;
          if (sPrice === 0) {
            return res.status(400).json({ success: false, message: `صوص ${sauce.name || sauce.id} غير صالح` });
          }
          addonsSum += sPrice;
          validatedSauces.push({
            id: sauce.id,
            name: sauce.name,
            price: sPrice
          });
        }
      }

      const unitPrice = basePrice + addonsSum;
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const totalPrice = unitPrice * qty;
      subtotal += totalPrice;

      validatedItems.push({
        itemId: resolvedId,
        name: item.name || 'كريب فاخر',
        quantity: qty,
        unitPrice,
        totalPrice,
        selectedAddons: validatedAddons,
        selectedSauces: validatedSauces,
        notes: item.notes || ''
      });
    }

    if (MIN_ORDER > 0 && subtotal < MIN_ORDER) {
      return res.status(400).json({
        success: false,
        message: `الحد الأدنى للطلب هو ${MIN_ORDER} ج.م. المجموع الحالي هو ${subtotal} ج.م`
      });
    }

    const totalAmount = subtotal + DELIVERY_FEE;

    const orderNumber = await Counter.getNextSequence('orderNumber');

    const order = new Order({
      orderNumber,
      customer: decoded.userId,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      deliveryAddress: deliveryAddress.trim(),
      mapLocation: mapLocation ? mapLocation.trim() : '',
      items: validatedItems,
      subtotal,
      deliveryFee: DELIVERY_FEE,
      totalAmount,
      status: 'pending',
      notes: notes ? notes.trim() : ''
    });

    await order.save();

    return res.status(201).json({
      success: true,
      message: 'تم تسجيل الطلب بنجاح',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      }
    });

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Error creating order:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ في تسجيل الطلب', error: error.message });
  }
};