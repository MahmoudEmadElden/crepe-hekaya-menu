/**
 * POST /api/auth/login — Login for both customers and admin
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectDB } = require('../_lib/db');
const User = require('../_lib/models/User');
const { handleCors } = require('../_lib/auth-middleware');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    const err = new Error('JWT_SECRET environment variable is not set');
    err.statusCode = 500;
    throw err;
  }
  return secret;
}

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم وكلمة المرور مطلوبين'
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    const user = await User.findOne({ username: cleanUsername });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    const expiresIn = user.role === 'admin' ? '48h' : '7d';
    const secret = getJwtSecret();
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role
      },
      secret,
      { expiresIn }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الدخول',
      error: error.message
    });
  }
};