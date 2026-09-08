/**
 * GET /api/orders — List orders
 * - Customer: sees only their own orders
 * - Admin: sees all orders (with optional status filter)
 */
const { connectDB } = require('../_lib/db');
const Order = require('../_lib/models/Order');
const { verifyToken, handleCors } = require('../_lib/auth-middleware');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const decoded = verifyToken(req.headers.authorization);
    await connectDB();

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    let filter = {};

    if (decoded.role === 'admin' || decoded.role === 'cashier') {
      // Admin/cashier can filter by status
      if (req.query.status) {
        filter.status = req.query.status;
      }
      // Date/Shift range filter
      if (req.query.all !== 'true' && req.query.startDate !== 'all') {
        if (req.query.startDate || req.query.endDate) {
          const dateFilter = {};
          if (req.query.startDate) {
            const s = new Date(req.query.startDate);
            if (!isNaN(s.getTime())) dateFilter.$gte = s;
          }
          if (req.query.endDate) {
            const e = new Date(req.query.endDate);
            if (!isNaN(e.getTime())) dateFilter.$lte = e;
          }
          if (Object.keys(dateFilter).length > 0) {
            filter.createdAt = dateFilter;
          }
        }
      }
    } else {
      // Customer only sees their own orders
      filter.customer = decoded.userId;
    }

    const [orders, totalCount] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    console.error('List orders error:', error);
    return res.status(500).json({
      success: false,
      message: 'حصل مشكلة في تحميل الطلبات'
    });
  }
};
