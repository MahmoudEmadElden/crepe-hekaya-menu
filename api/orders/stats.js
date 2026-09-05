/**
 * GET /api/orders/stats — Admin-only order statistics for today
 */
const { connectDB } = require('../_lib/db');
const Order = require('../_lib/models/Order');
const { verifyToken, requireRole, handleCors } = require('../_lib/auth-middleware');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const decoded = verifyToken(req.headers.authorization);
    requireRole(decoded, 'admin');

    await connectDB();

    // Today's date range (Egypt timezone: UTC+2)
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const todayFilter = { createdAt: { $gte: todayStart, $lte: todayEnd } };

    // Aggregate today's stats
    const [
      totalOrdersToday,
      pendingOrders,
      acceptedOrders,
      preparingOrders,
      readyOrders,
      revenueResult
    ] = await Promise.all([
      Order.countDocuments(todayFilter),
      Order.countDocuments({ ...todayFilter, status: 'pending' }),
      Order.countDocuments({ ...todayFilter, status: 'accepted' }),
      Order.countDocuments({ ...todayFilter, status: 'preparing' }),
      Order.countDocuments({ ...todayFilter, status: 'ready' }),
      Order.aggregate([
        {
          $match: {
            ...todayFilter,
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
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    console.error('Stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'حصل مشكلة في تحميل الإحصائيات'
    });
  }
};
