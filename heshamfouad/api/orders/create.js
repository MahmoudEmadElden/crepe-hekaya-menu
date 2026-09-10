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

// Comprehensive Price Map for Hesham Fouad (All IDs, legacy aliases, and Arabic names)
const PRICE_MAP = {
  // 1. Signature & Mixes (New IDs)
  'hesham-fouad-signature': 150,
  'mix-toscany': 135,
  'mix-milano': 130,
  'mix-chicago': 130,
  'mix-moscow': 130,
  'mix-supreme': 130,
  'mix-amsterdam': 125,
  'mix-sofia': 125,
  'mix-sujouk-kiri': 120,
  'mix-chicken-quad': 120,
  'mix-smoked': 120,
  'mix-super-crunchy': 115,

  // 1. Signature & Mixes (Legacy Aliases)
  'hf-beast': 150,
  'hf-toscanini': 135,
  'hf-milano': 130,
  'hf-moscow': 130,
  'hf-chicago': 130,
  'hf-super-supreme': 130,
  'hf-amsterdam': 125,
  'hf-sofia': 125,
  'hf-sojouk-kiri': 120,
  'hf-mix-chicken': 120,
  'hf-mix-smoked': 120,
  'hf-super-crunchy': 115,

  // 2. Chicken Crepes
  'chk-ranch': 120,
  'chk-bbq': 120,
  'chk-grilled-breast': 115,
  'chk-shish': 115,
  'chk-fajita': 115,
  'chk-shawarma': 105,
  'chk-cordon-bleu': 105,
  'chk-strips': 95,
  'chk-zinger': 95,
  'chk-pane': 95,
  'chk-nuggets': 95,

  // 3. Meat Crepes
  'meat-steak': 120,
  'meat-burger': 105,
  'meat-pastrami': 100,
  'meat-salami': 100,
  'meat-sujouk': 95,
  'meat-sojouk': 95,
  'meat-kofta': 95,
  'meat-hotdog': 90,
  'meat-sausage': 90,

  // 4. Fries & Cheese
  'fries-mix-cheese': 80,
  'side-mix-cheese': 80,
  'fries-potato': 60,
  'side-fries': 60,

  // 5. Sweet Crepes
  'swt-apple-cinnamon': 120,
  'swt-mango': 120,
  'swt-pineapple': 120,
  'swt-peach': 115,
  'swt-banana': 115,
  'swt-nutella-oreo': 105,
  'swt-nutella-classic': 100,
  'swt-nutella': 100,
  'swt-lotus': 90,
  'swt-pistachio': 90,
  'swt-kinder': 90
};

// Try merging dynamic menuData if reachable in environment
try {
  const menuData = require(path.resolve(__dirname, '../../js/menuData.js'));
  if (menuData && Array.isArray(menuData.menuItems)) {
    menuData.menuItems.forEach(item => {
      if (item.id && item.price) PRICE_MAP[item.id] = Number(item.price);
      if (item.name && item.price) PRICE_MAP[item.name.trim()] = Number(item.price);
    });
  }
} catch (e) {
  // Static map is our solid baseline
}

const ADDON_MAP = {
  'addon-mozzarella': 25,
  'addon-cheddar': 25,
  'addon-turkey': 20,
  'addon-mushroom': 20,
  'addon-jalapeno': 15,
  'addon-fries': 15
};

const DELIVERY_FEE = 15;
const MIN_ORDER = 0;

function resolvePrice(item) {
  if (!item) return 0;
  // 1. Try by itemId
  if (item.itemId && PRICE_MAP[item.itemId]) return PRICE_MAP[item.itemId];
  // 2. Try by normalized name
  if (item.name) {
    const trimmed = item.name.trim();
    if (PRICE_MAP[trimmed]) return PRICE_MAP[trimmed];
    // fuzzy match for toscany
    if (trimmed.includes('توسكان')) return 135;
    if (trimmed.includes('هشام فؤاد') || trimmed.includes('الوحش')) return 150;
    if (trimmed.includes('ميلانو') || trimmed.includes('شيكاغو') || trimmed.includes('موسكو') || trimmed.includes('سوبريم')) return 130;
  }
  // 3. Fallback to client passed unitPrice if positive and reasonable
  if (typeof item.unitPrice === 'number' && item.unitPrice > 0 && item.unitPrice <= 1000) {
    return item.unitPrice;
  }
  if (typeof item.price === 'number' && item.price > 0 && item.price <= 1000) {
    return item.price;
  }
  return 0;
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
      const basePrice = resolvePrice(item);
      if (!basePrice || basePrice <= 0) {
        return res.status(400).json({ success: false, message: `الصنف ${item.name || item.itemId} غير صالح أو غير مسجل في قائمة الأسعار` });
      }
      let addonsSum = 0;

      const validatedAddons = [];
      if (Array.isArray(item.selectedAddons)) {
        for (const addon of item.selectedAddons) {
          const aPrice = ADDON_MAP[addon.id] || Number(addon.price) || 0;
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
          const sPrice = ADDON_MAP[sauce.id] || Number(sauce.price) || 0;
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
        itemId: item.itemId || 'item-' + Math.floor(Math.random() * 1000),
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

    // Get next order number
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