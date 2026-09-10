/**
 * POST /api/auth/admin-setup — Initialize or reset admin account
 */
const bcrypt = require('bcryptjs');
const { connectDB } = require('../_lib/db');
const User = require('../_lib/models/User');
const { handleCors } = require('../_lib/auth-middleware');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { setupSecret, username, password } = req.body;

    const expectedSecret = process.env.SETUP_SECRET;
    if (!expectedSecret || !setupSecret || setupSecret !== expectedSecret) {
      return res.status(403).json({ success: false, message: 'كود الإعداد غير صحيح' });
    }

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'اسم المستخدم وكلمة المرور مطلوبين' });
    }

    await connectDB();

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findOneAndUpdate(
      { username: username.trim().toLowerCase() },
      {
        username: username.trim().toLowerCase(),
        password: hashedPassword,
        displayName: 'مدير المطعم',
        role: 'admin'
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'تم إعداد حساب المدير بنجاح',
      user: { username: user.username, role: user.role }
    });

  } catch (error) {
    console.error('Admin setup error:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ أثناء إعداد المدير', error: error.message });
  }
};