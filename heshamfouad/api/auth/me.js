/**
 * GET /api/auth/me — Check current logged in user
 */
const { connectDB } = require('../_lib/db');
const User = require('../_lib/models/User');
const { verifyToken, handleCors } = require('../_lib/auth-middleware');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const decoded = verifyToken(req.headers.authorization);
    await connectDB();

    const user = await User.findById(decoded.userId).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'حدث خطأ في جلب بيانات المستخدم' });
  }
};
