/**
 * GET /api/auth/me — Verify token and return current user info
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

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم مش موجود'
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        phone: user.phone,
        address: user.address || '',
        role: user.role
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    console.error('Auth/me error:', error);
    return res.status(500).json({
      success: false,
      message: 'حصل مشكلة في السيرفر. جرب تاني.'
    });
  }
};
