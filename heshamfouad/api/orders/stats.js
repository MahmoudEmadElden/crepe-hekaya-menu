/**
 * GET /api/orders/stats — Realtime Shift & Revenue stats for Hesham Fouad
 */
const { connectDB } = require('../_lib/db');
const Order = require('../_lib/models/Order');
const Counter = require('../_lib/models/Counter');
const { verifyToken, requireRole, handleCors } = require('../_lib/auth-middleware');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const decoded = verifyToken(req.headers.authorization);
    if (decoded.role !== 'admin' && decoded.role !== 'cashier') {
      return res.status(403).json({ success: false, message: 'غير مصرح لك بالوصول' });
    }

    await connectDB();

    let rangeFilter = {};
    if (req.query.all === 'true' || req.query.startDate === 'all') {
      rangeFilter = {};
    } else if (req.query.period === 'shift' || req.query.startDate === 'shift') {
      const shiftDoc = await Counter.findById('currentShift');
      const shiftStart = shiftDoc?.shiftStart || new Date(new Date().setHours(0, 0, 0, 0));
      rangeFilter.createdAt = { $gte: shiftStart };
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
        rangeFilter.createdAt = dateFilter;
      }
    } else {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      rangeFilter.createdAt = { $gte: todayStart, $lte: todayEnd };
    }

    const [
      totalOrdersToday,
      pendingOrders,
      acceptedOrders,
      preparingOrders,
      readyOrders,
      revenueResult
    ] = await Promise.all([
      Order.countDocuments(rangeFilter),
      Order.countDocuments({ ...rangeFilter, status: 'pending' }),
      Order.countDocuments({ ...rangeFilter, status: 'accepted' }),
      Order.countDocuments({ ...rangeFilter, status: 'preparing' }),
      Order.countDocuments({ ...rangeFilter, status: 'ready' }),
      Order.aggregate([
        {
          $match: {
            ...rangeFilter,
            status: { $nin: ['cancelled'] }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' }
          }
        }
      ])
    ]);

    const totalRevenueToday = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalOrdersToday,
        totalRevenueToday,
        pendingOrders,
        acceptedOrders,
        preparingOrders,
        readyOrders
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Stats error:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ في جلب الإحصائيات' });
  }
};
