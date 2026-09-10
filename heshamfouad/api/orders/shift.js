/**
 * GET/POST /api/orders/shift — Manage active shift start timestamp for Hesham Fouad
 */
const { connectDB } = require('../_lib/db');
const Counter = require('../_lib/models/Counter');
const { verifyToken, handleCors } = require('../_lib/auth-middleware');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  try {
    const decoded = verifyToken(req.headers.authorization);
    if (decoded.role !== 'admin' && decoded.role !== 'cashier') {
      return res.status(403).json({ success: false, message: 'غير مصرح لك بالوصول' });
    }

    await connectDB();

    if (req.method === 'POST') {
      const now = new Date();
      await Counter.findByIdAndUpdate(
        'currentShift',
        {
          _id: 'currentShift',
          shiftStart: now,
          resetBy: decoded.username || 'admin',
          resetAt: now
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({
        success: true,
        message: 'تم تصفير الوردية وبدء شيفت جديد بنجاح',
        shiftStart: now.toISOString()
      });
    }

    if (req.method === 'GET') {
      let shiftDoc = await Counter.findById('currentShift');
      if (!shiftDoc || !shiftDoc.shiftStart) {
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        shiftDoc = await Counter.findByIdAndUpdate(
          'currentShift',
          {
            _id: 'currentShift',
            shiftStart: todayMidnight,
            resetBy: 'system',
            resetAt: todayMidnight
          },
          { upsert: true, new: true }
        );
      }

      return res.status(200).json({
        success: true,
        shiftStart: shiftDoc.shiftStart.toISOString()
      });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('Shift API error:', error);
    return res.status(500).json({ success: false, message: error.message || 'حدث خطأ في إدارة الوردية' });
  }
};
