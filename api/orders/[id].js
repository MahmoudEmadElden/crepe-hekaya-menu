/**
 * GET/PATCH /api/orders/[id] — Get or update a single order
 * - GET: Customer can view own order, Admin can view any order
 * - PATCH: Admin only — update order status
 */
const { connectDB } = require('../_lib/db');
const Order = require('../_lib/models/Order');
const { verifyToken, requireRole, handleCors } = require('../_lib/auth-middleware');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  // Extract order ID from URL: /api/orders/[id]
  const urlParts = req.url.split('?')[0].split('/');
  const orderId = urlParts[urlParts.length - 1];

  if (!orderId || orderId === 'index' || orderId === 'create' || orderId === 'stats') {
    return res.status(400).json({ success: false, message: 'Order ID is required' });
  }

  try {
    const decoded = verifyToken(req.headers.authorization);
    await connectDB();

    if (req.method === 'GET') {
      const order = await Order.findById(orderId).lean();
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'الطلب مش موجود'
        });
      }

      // Customer can only view their own orders
      if (decoded.role !== 'admin' && order.customer.toString() !== decoded.userId) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بعرض هذا الطلب'
        });
      }

      return res.status(200).json({ success: true, order });
    }

    if (req.method === 'PATCH') {
      requireRole(decoded, 'admin');

      const { status } = req.body;
      const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'cancelled'];

      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'حالة الطلب غير صحيحة'
        });
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        { status, updatedAt: new Date() },
        { new: true }
      ).lean();

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'الطلب مش موجود'
        });
      }

      return res.status(200).json({ success: true, order });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    console.error('Order detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'حصل مشكلة في تحميل بيانات الطلب'
    });
  }
};
