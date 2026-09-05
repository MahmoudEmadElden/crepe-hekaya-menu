/**
 * POST /api/orders/create — Create a new order
 * Requires authenticated customer.
 */
const { connectDB } = require('../_lib/db');
const Order = require('../_lib/models/Order');
const Counter = require('../_lib/models/Counter');
const User = require('../_lib/models/User');
const { verifyToken, handleCors } = require('../_lib/auth-middleware');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const decoded = verifyToken(req.headers.authorization);
    await connectDB();

    const { items, notes } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لازم تضيف صنف واحد على الأقل للطلب'
      });
    }

    if (items.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'الطلب الواحد ممكن يحتوي على 20 صنف كحد أقصى'
      });
    }

    // Validate each item and calculate totals
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.itemId || !item.name || !item.quantity || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          message: 'بيانات الأصناف مش كاملة'
        });
      }

      if (item.quantity < 1 || item.quantity > 50) {
        return res.status(400).json({
          success: false,
          message: 'الكمية لازم تكون من 1 لـ 50'
        });
      }

      const lineTotal = item.unitPrice * item.quantity;
      totalAmount += lineTotal;

      orderItems.push({
        itemId: item.itemId,
        name: item.name,
        variant: item.variant || '',
        variantLabel: item.variantLabel || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: lineTotal
      });
    }

    // Get customer display name
    const user = await User.findById(decoded.userId).select('displayName username');
    const customerName = user ? (user.displayName || user.username) : decoded.username;

    // Generate order number
    const orderNumber = await Counter.getNextSequence('orderNumber');

    // Create order
    const order = await Order.create({
      orderNumber,
      customer: decoded.userId,
      customerName,
      items: orderItems,
      totalAmount,
      status: 'pending',
      notes: notes ? notes.trim().substring(0, 500) : ''
    });

    return res.status(201).json({
      success: true,
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        notes: order.notes,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    console.error('Create order error:', error);
    return res.status(500).json({
      success: false,
      message: 'حصل مشكلة في إنشاء الطلب. جرب تاني.'
    });
  }
};
