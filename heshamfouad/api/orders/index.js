/**
 * GET /api/orders — List orders for Hesham Fouad
 */
const { connectDB } = require('../_lib/db');
const Order = require('../_lib/models/Order');
const Counter = require('../_lib/models/Counter');
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
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    let filter = {};

    if (decoded.role === 'admin' || decoded.role === 'cashier') {
      if (req.query.status) {
        filter.status = req.query.status;
      }
      // Date/Shift range filter
      if (req.query.all !== 'true' && req.query.startDate !== 'all') {
        if (req.query.period === 'shift' || req.query.startDate === 'shift') {
          const shiftDoc = await Counter.findById('currentShift');
          const shiftStart = shiftDoc?.shiftStart || new Date(new Date().setHours(0, 0, 0, 0));
          filter.createdAt = { $gte: shiftStart };
        } else if (req.query.startDate || req.query.endDate) {
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
    console.error('Error in /api/orders:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب الطلبات'
    });
  }
};
